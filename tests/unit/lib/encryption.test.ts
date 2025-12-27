import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Test key - 32-byte hex key
const TEST_ENCRYPTION_KEY = 'a'.repeat(64);

describe('Encryption Utilities', () => {
  beforeEach(() => {
    vi.resetModules();
    // Ensure key is set before each test
    vi.stubEnv('ENCRYPTION_KEY', TEST_ENCRYPTION_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('encrypts and decrypts a string correctly', async () => {
    const { encrypt, decrypt } = await import('@/lib/utils/encryption');

    const originalText = 'my-secret-api-key';
    const encrypted = encrypt(originalText);

    expect(encrypted).not.toBe(originalText);
    expect(encrypted.length).toBeGreaterThan(originalText.length);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(originalText);
  });

  it('produces different ciphertext for same plaintext (due to random IV)', async () => {
    const { encrypt } = await import('@/lib/utils/encryption');

    const text = 'same-text';
    const encrypted1 = encrypt(text);
    const encrypted2 = encrypt(text);

    expect(encrypted1).not.toBe(encrypted2);
  });

  it('encrypts and decrypts credentials object', async () => {
    const { encryptCredentials, decryptCredentials } = await import('@/lib/utils/encryption');

    const credentials = {
      clientId: 'client-123',
      clientSecret: 'secret-456',
    };

    const encrypted = encryptCredentials(credentials);

    expect(encrypted.clientId).not.toBe(credentials.clientId);
    expect(encrypted.clientSecret).not.toBe(credentials.clientSecret);

    const decrypted = decryptCredentials(encrypted);
    expect(decrypted).toEqual(credentials);
  });

  it('throws error when encryption key is missing', async () => {
    vi.stubEnv('ENCRYPTION_KEY', '');
    vi.resetModules();

    const { encrypt } = await import('@/lib/utils/encryption');

    expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY environment variable is not set');
  });

  it('handles special characters in plaintext', async () => {
    const { encrypt, decrypt } = await import('@/lib/utils/encryption');

    const specialText = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./~`';
    const encrypted = encrypt(specialText);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(specialText);
  });

  it('handles unicode characters', async () => {
    const { encrypt, decrypt } = await import('@/lib/utils/encryption');

    const unicodeText = '你好世界 🌍 مرحبا';
    const encrypted = encrypt(unicodeText);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(unicodeText);
  });
});
