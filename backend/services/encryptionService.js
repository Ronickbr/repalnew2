import crypto from 'crypto';
import { ENV } from '../config/env.js';

/**
 * Service responsible for encrypting and decrypting sensitive data.
 * Follows Rule 04: Secrets Vault.
 */
class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    // Use configured key or a dev fallback (only for non-production)
    const keyString = ENV.ENCRYPTION_KEY || (ENV.NODE_ENV !== 'production' ? 'dev-encryption-key-must-be-32-bytes-long!!' : '');
    
    if (!keyString) {
      throw new Error('ENCRYPTION_KEY is required in production');
    }

    // Ensure key is 32 bytes. If base64, decode it. If string, pad/slice or hash it.
    // For simplicity and robustness, we'll hash the key string to get 32 bytes if it's not a direct 32-byte buffer.
    this.key = crypto.createHash('sha256').update(String(keyString)).digest();
  }

  /**
   * Encrypts a text string.
   * @param {string} text - The text to encrypt.
   * @returns {string} - The encrypted string in format "iv:authTag:encryptedContent" (hex).
   */
  encrypt(text) {
    if (!text) return text;
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Return IV:AuthTag:Encrypted
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts an encrypted string.
   * @param {string} encryptedText - The string to decrypt (format: "iv:authTag:encryptedContent").
   * @returns {string} - The decrypted text.
   */
  decrypt(encryptedText) {
    if (!encryptedText) return encryptedText;
    
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      // Assuming it might be plain text if format doesn't match (migration path) or error
      // Ideally we should throw or return null, but for safety in existing systems we might return as is?
      // Rule 04 says "Criptografia em Repouso".
      // Let's assume strict format.
      throw new Error('Invalid encrypted format');
    }
    
    const [ivHex, authTagHex, encryptedHex] = parts;
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

export const encryptionService = new EncryptionService();
