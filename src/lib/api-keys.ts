/**
 * API Key Management Utilities.
 *
 * Provides functions for generating, validating, and managing API keys
 * with monthly token limits.
 */

import { randomBytes, createHash } from 'crypto';
import { prisma } from './db';

const API_KEY_PREFIX = 'halo_';
const KEY_LENGTH = 32; // 32 bytes = 64 hex chars
const DEFAULT_MONTHLY_TOKEN_LIMIT = 1_000_000; // 1 million tokens

/**
 * Generate a new API key for a user.
 *
 * The raw key is returned only once at creation time.
 * Only the hash is stored in the database.
 */
export async function generateApiKey(
  userId: string,
  options: {
    name?: string;
    monthlyTokenLimit?: number;
  } = {}
): Promise<{
  key: string;
  keyPrefix: string;
  keyId: string;
}> {
  // Generate random key bytes
  const keyBytes = randomBytes(KEY_LENGTH);
  const keyHex = keyBytes.toString('hex');

  // Create the full key with prefix
  const fullKey = `${API_KEY_PREFIX}${keyHex}`;

  // Create prefix for identification (first 8 chars after prefix)
  const keyPrefix = `${API_KEY_PREFIX}${keyHex.substring(0, 8)}`;

  // Hash the full key for storage
  const keyHash = createHash('sha256').update(fullKey).digest('hex');

  // Calculate next reset date (first day of next month)
  const now = new Date();
  const tokenResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Create the API key record
  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      keyPrefix,
      keyHash,
      name: options.name || 'Default API Key',
      monthlyTokenLimit: options.monthlyTokenLimit || DEFAULT_MONTHLY_TOKEN_LIMIT,
      tokenResetAt,
    },
  });

  return {
    key: fullKey,
    keyPrefix,
    keyId: apiKey.id,
  };
}

/**
 * Validate an API key and return its data if valid.
 */
export async function validateApiKey(
  key: string
): Promise<{
  valid: boolean;
  apiKey?: {
    id: string;
    userId: string;
    tokensRemaining: number;
    isActive: boolean;
  };
  error?: string;
}> {
  // Validate format
  if (!key.startsWith(API_KEY_PREFIX)) {
    return { valid: false, error: 'Invalid API key format' };
  }

  // Hash the provided key
  const keyHash = createHash('sha256').update(key).digest('hex');

  // Look up the key
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
  });

  if (!apiKey) {
    return { valid: false, error: 'API key not found' };
  }

  if (!apiKey.isActive) {
    return { valid: false, error: 'API key has been revoked' };
  }

  // Check if tokens need to be reset
  const now = new Date();
  if (now >= apiKey.tokenResetAt) {
    // Reset tokens for new month
    const nextResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: {
        tokensUsed: 0,
        tokenResetAt: nextResetAt,
      },
    });
    apiKey.tokensUsed = 0;
    apiKey.tokenResetAt = nextResetAt;
  }

  const tokensRemaining = apiKey.monthlyTokenLimit - apiKey.tokensUsed;

  if (tokensRemaining <= 0) {
    return {
      valid: false,
      error: 'Monthly token limit exceeded. Tokens reset on the 1st of each month.',
    };
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: now },
  });

  return {
    valid: true,
    apiKey: {
      id: apiKey.id,
      userId: apiKey.userId,
      tokensRemaining,
      isActive: apiKey.isActive,
    },
  };
}

/**
 * Record token usage for an API key.
 */
export async function recordTokenUsage(
  apiKeyId: string,
  tokensUsed: number
): Promise<{
  success: boolean;
  tokensRemaining: number;
  error?: string;
}> {
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId },
  });

  if (!apiKey) {
    return { success: false, tokensRemaining: 0, error: 'API key not found' };
  }

  const newTokensUsed = apiKey.tokensUsed + tokensUsed;
  const tokensRemaining = Math.max(0, apiKey.monthlyTokenLimit - newTokensUsed);

  await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: {
      tokensUsed: newTokensUsed,
      lastUsedAt: new Date(),
    },
  });

  return {
    success: true,
    tokensRemaining,
  };
}

/**
 * Get all API keys for a user.
 */
export async function getUserApiKeys(userId: string) {
  const keys = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      keyPrefix: true,
      name: true,
      monthlyTokenLimit: true,
      tokensUsed: true,
      tokenResetAt: true,
      isActive: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });

  return keys.map((key) => ({
    ...key,
    tokensRemaining: key.monthlyTokenLimit - key.tokensUsed,
    percentUsed: Math.round((key.tokensUsed / key.monthlyTokenLimit) * 100),
  }));
}

/**
 * Revoke an API key.
 */
export async function revokeApiKey(
  apiKeyId: string,
  userId: string,
  reason?: string
): Promise<boolean> {
  const result = await prisma.apiKey.updateMany({
    where: {
      id: apiKeyId,
      userId, // Ensure user owns the key
    },
    data: {
      isActive: false,
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });

  return result.count > 0;
}

/**
 * Create a default API key for a new user.
 * Called during signup.
 */
export async function createDefaultApiKeyForUser(
  userId: string
): Promise<string | null> {
  try {
    const { key } = await generateApiKey(userId, {
      name: 'Default API Key',
      monthlyTokenLimit: DEFAULT_MONTHLY_TOKEN_LIMIT,
    });
    return key;
  } catch (error) {
    console.error('Failed to create default API key:', error);
    return null;
  }
}

/**
 * Check if a user has exceeded their token limit.
 * Uses the User model's monthlyTokens for web sessions.
 */
export async function checkUserTokenLimit(
  userId: string
): Promise<{
  hasLimit: boolean;
  tokensUsed: number;
  tokensRemaining: number;
  percentUsed: number;
  monthlyLimit: number;
}> {
  const DEFAULT_MONTHLY_LIMIT = 1_000_000;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      monthlyTokens: true,
      tokenResetAt: true,
      plan: true,
    },
  });

  if (!user) {
    return {
      hasLimit: false,
      tokensUsed: 0,
      tokensRemaining: 0,
      percentUsed: 0,
      monthlyLimit: DEFAULT_MONTHLY_LIMIT,
    };
  }

  // Check if tokens need to be reset (first of the month)
  const now = new Date();
  const resetNeeded = !user.tokenResetAt || now >= user.tokenResetAt;

  if (resetNeeded) {
    const nextResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await prisma.user.update({
      where: { id: userId },
      data: {
        monthlyTokens: 0,
        tokenResetAt: nextResetAt,
      },
    });
    user.monthlyTokens = 0;
  }

  // Determine limit based on plan
  const planLimits: Record<string, number> = {
    FREE: 1_000_000,      // 1M tokens
    PRO: 5_000_000,       // 5M tokens
    ENTERPRISE: 50_000_000, // 50M tokens
  };
  const monthlyLimit = planLimits[user.plan] || DEFAULT_MONTHLY_LIMIT;

  return {
    hasLimit: true,
    tokensUsed: user.monthlyTokens,
    tokensRemaining: Math.max(0, monthlyLimit - user.monthlyTokens),
    percentUsed: Math.round((user.monthlyTokens / monthlyLimit) * 100),
    monthlyLimit,
  };
}

/**
 * Record token usage for a user (web session).
 */
export async function recordUserTokenUsage(
  userId: string,
  tokensUsed: number
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      monthlyTokens: {
        increment: tokensUsed,
      },
    },
  });
}
