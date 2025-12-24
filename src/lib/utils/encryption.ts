/**
 * Encryption utilities for securing HaloPSA credentials
 * Uses AES-256-GCM for authenticated encryption
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;

/**
 * Get encryption key from environment or derive from password
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  // If key is a hex string, convert it
  if (key.length === 64 && /^[a-fA-F0-9]+$/.test(key)) {
    return Buffer.from(key, 'hex');
  }

  // Otherwise, derive key using scrypt
  const salt = Buffer.from('halopsa-ai-salt', 'utf-8');
  return scryptSync(key, salt, KEY_LENGTH);
}

/**
 * Encrypt a string value
 * Returns base64 encoded: salt + iv + tag + ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const salt = randomBytes(SALT_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  // Combine: salt + iv + tag + ciphertext
  const combined = Buffer.concat([
    salt,
    iv,
    tag,
    Buffer.from(encrypted, 'hex'),
  ]);

  return combined.toString('base64');
}

/**
 * Decrypt a string value
 * Expects base64 encoded: salt + iv + tag + ciphertext
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedData, 'base64');

  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = combined.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + TAG_LENGTH
  );
  const ciphertext = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * Encrypt credentials object
 */
export function encryptCredentials(credentials: {
  clientId: string;
  clientSecret: string;
}): { clientId: string; clientSecret: string } {
  return {
    clientId: encrypt(credentials.clientId),
    clientSecret: encrypt(credentials.clientSecret),
  };
}

/**
 * Decrypt credentials object
 */
export function decryptCredentials(encrypted: {
  clientId: string;
  clientSecret: string;
}): { clientId: string; clientSecret: string } {
  return {
    clientId: decrypt(encrypted.clientId),
    clientSecret: decrypt(encrypted.clientSecret),
  };
}
