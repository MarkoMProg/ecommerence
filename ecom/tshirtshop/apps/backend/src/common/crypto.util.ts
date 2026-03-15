/**
 * AES-256-GCM encryption utility for sensitive PII fields stored in the database.
 *
 * Usage:
 *   encrypt('Jane Doe')  → '<iv>:<authTag>:<ciphertext>'  (all hex)
 *   decrypt('<iv>:<authTag>:<ciphertext>') → 'Jane Doe'
 *
 * Key configuration:
 *   Set ENCRYPTION_KEY as a 64-character hex string (32 bytes) in your .env:
 *     ENCRYPTION_KEY=<output of: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
 *
 * Ciphertext format stored in DB:
 *   "<12-byte IV hex>:<16-byte GCM auth tag hex>:<ciphertext hex>"
 *   The auth tag prevents silent tampering (authenticated encryption).
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
/** GCM recommended IV length in bytes */
const IV_LENGTH = 12;

function getKey(): Buffer {
  const hex = process.env['ENCRYPTION_KEY'];
  if (!hex || hex.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY env variable must be a 64-character hex string (32 bytes). ' +
        "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypts a UTF-8 plaintext string using AES-256-GCM.
 * Returns a colon-delimited hex string: "<iv>:<authTag>:<ciphertext>".
 * A fresh random IV is generated for every call, so two encryptions of the
 * same plaintext produce different ciphertexts (IND-CPA secure).
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString('hex'),
    tag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

/**
 * Returns true if the value looks like AES-256-GCM ciphertext produced by `encrypt`.
 * Format: "<24-char hex IV>:<32-char hex authTag>:<hex ciphertext>"
 */
function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  const [iv, tag] = parts;
  // IV = 12 bytes = 24 hex chars, authTag = 16 bytes = 32 hex chars
  return iv.length === 24 && tag.length === 32 && /^[0-9a-f:]+$/i.test(value);
}

/**
 * Decrypts a value produced by `encrypt`.
 * If the value doesn't look like ciphertext (e.g. legacy plain-text data),
 * returns it as-is instead of throwing.
 */
export function decrypt(ciphertext: string): string {
  if (!isEncrypted(ciphertext)) {
    return ciphertext;
  }
  const key = getKey();
  const parts = ciphertext.split(':');
  const [ivHex, tagHex, encHex] = parts as [string, string, string];
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const enc = Buffer.from(encHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString(
    'utf8',
  );
}

/** Encrypts a non-null string; passes null through unchanged. */
export function encryptNullable(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  return encrypt(value);
}

/** Decrypts a non-null ciphertext; passes null through unchanged. */
export function decryptNullable(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  return decrypt(value);
}
