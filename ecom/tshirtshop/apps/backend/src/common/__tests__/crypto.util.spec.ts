/**
 * Unit tests for the AES-256-GCM encryption utility (SEC-003 — sensitive data at rest).
 *
 * These tests verify:
 *  1. encrypt()         — produces a properly formatted ciphertext, never the plaintext
 *  2. decrypt()         — round-trips correctly back to the original value
 *  3. IV uniqueness     — two encryptions of the same value produce different ciphertexts
 *  4. Tamper detection  — modifying ciphertext throws during decryption (GCM auth tag)
 *  5. Nullable helpers  — encryptNullable / decryptNullable pass null through untouched
 *  6. Key validation    — missing / malformed key throws a clear error
 *  7. Edge cases        — empty string, Unicode, long strings
 */

import { encrypt, decrypt, encryptNullable, decryptNullable } from '../crypto.util';

/** 64-character hex string = 32 bytes, required for AES-256 */
const VALID_KEY = 'a'.repeat(64);

describe('crypto.util — AES-256-GCM field encryption', () => {
  beforeEach(() => {
    process.env['ENCRYPTION_KEY'] = VALID_KEY;
  });

  afterEach(() => {
    delete process.env['ENCRYPTION_KEY'];
  });

  // ── encrypt() ──────────────────────────────────────────────────────────────

  describe('encrypt()', () => {
    it('returns a colon-delimited hex string in iv:tag:ciphertext format', () => {
      const ct = encrypt('Jane Doe');
      const parts = ct.split(':');
      expect(parts).toHaveLength(3);
      const [iv, tag, data] = parts as [string, string, string];
      // IV = 12 bytes → 24 hex chars; auth tag = 16 bytes → 32 hex chars
      expect(iv).toHaveLength(24);
      expect(tag).toHaveLength(32);
      expect(data.length).toBeGreaterThan(0);
    });

    it('does NOT store the plaintext in the ciphertext', () => {
      const ct = encrypt('super-secret-address');
      expect(ct).not.toContain('super-secret-address');
    });

    it('produces different ciphertexts for the same plaintext (IV randomness)', () => {
      const ct1 = encrypt('123 Main St');
      const ct2 = encrypt('123 Main St');
      expect(ct1).not.toEqual(ct2);
    });

    it('returns only hex characters and colons', () => {
      const ct = encrypt('test');
      expect(ct).toMatch(/^[0-9a-f:]+$/);
    });
  });

  // ── decrypt() ──────────────────────────────────────────────────────────────

  describe('decrypt()', () => {
    it('round-trips a plain address line', () => {
      const plain = '123 Main Street';
      expect(decrypt(encrypt(plain))).toBe(plain);
    });

    it('round-trips a full name', () => {
      const plain = 'Jane Doe';
      expect(decrypt(encrypt(plain))).toBe(plain);
    });

    it('round-trips a postal code', () => {
      const plain = '78701';
      expect(decrypt(encrypt(plain))).toBe(plain);
    });

    it('round-trips a phone number', () => {
      const plain = '+1 (555) 123-4567';
      expect(decrypt(encrypt(plain))).toBe(plain);
    });

    it('round-trips a country code', () => {
      const plain = 'US';
      expect(decrypt(encrypt(plain))).toBe(plain);
    });

    it('round-trips an empty string', () => {
      expect(decrypt(encrypt(''))).toBe('');
    });

    it('round-trips a Unicode / international address', () => {
      const plain = 'Ödengatan 12, Göteborg';
      expect(decrypt(encrypt(plain))).toBe(plain);
    });

    it('round-trips a long string (> 255 chars)', () => {
      const plain = 'x'.repeat(512);
      expect(decrypt(encrypt(plain))).toBe(plain);
    });

    it('throws when ciphertext has been tampered with (auth tag failure)', () => {
      const ct = encrypt('sensitive');
      // Flip the last character of the ciphertext segment to simulate tampering
      const parts = ct.split(':');
      const corrupted =
        parts[0] +
        ':' +
        parts[1] +
        ':' +
        parts[2]!.slice(0, -1) +
        (parts[2]!.slice(-1) === 'f' ? '0' : 'f');
      expect(() => decrypt(corrupted)).toThrow();
    });

    it('throws when the IV has been tampered with', () => {
      const ct = encrypt('sensitive');
      const parts = ct.split(':');
      const tamperedIv = parts[0]!.slice(0, -1) + (parts[0]!.slice(-1) === 'f' ? '0' : 'f');
      const corrupted = tamperedIv + ':' + parts[1] + ':' + parts[2];
      expect(() => decrypt(corrupted)).toThrow();
    });

    it('throws when format is invalid (missing segments)', () => {
      expect(() => decrypt('notvalidatall')).toThrow(/invalid ciphertext format/i);
    });

    it('throws when given only two segments', () => {
      expect(() => decrypt('aabb:ccdd')).toThrow(/invalid ciphertext format/i);
    });
  });

  // ── encryptNullable / decryptNullable ──────────────────────────────────────

  describe('encryptNullable()', () => {
    it('returns null when given null', () => {
      expect(encryptNullable(null)).toBeNull();
    });

    it('returns null when given undefined', () => {
      expect(encryptNullable(undefined)).toBeNull();
    });

    it('encrypts a non-null value', () => {
      const ct = encryptNullable('Apt 4');
      expect(ct).not.toBeNull();
      expect(ct!.split(':').length).toBe(3);
    });
  });

  describe('decryptNullable()', () => {
    it('returns null when given null', () => {
      expect(decryptNullable(null)).toBeNull();
    });

    it('returns null when given undefined', () => {
      expect(decryptNullable(undefined)).toBeNull();
    });

    it('round-trips a non-null value', () => {
      const ct = encryptNullable('Floor 3');
      expect(decryptNullable(ct)).toBe('Floor 3');
    });
  });

  // ── Key validation ─────────────────────────────────────────────────────────

  describe('key validation', () => {
    it('throws when ENCRYPTION_KEY is not set', () => {
      delete process.env['ENCRYPTION_KEY'];
      expect(() => encrypt('test')).toThrow(/ENCRYPTION_KEY/);
    });

    it('throws when ENCRYPTION_KEY is too short', () => {
      process.env['ENCRYPTION_KEY'] = 'abc123';
      expect(() => encrypt('test')).toThrow(/ENCRYPTION_KEY/);
    });

    it('throws when ENCRYPTION_KEY is 63 chars (one short)', () => {
      process.env['ENCRYPTION_KEY'] = 'a'.repeat(63);
      expect(() => encrypt('test')).toThrow(/ENCRYPTION_KEY/);
    });

    it('accepts a valid 64-char hex ENCRYPTION_KEY', () => {
      process.env['ENCRYPTION_KEY'] = VALID_KEY;
      expect(() => encrypt('test')).not.toThrow();
    });
  });

  // ── Cross-key isolation ────────────────────────────────────────────────────

  describe('cross-key isolation', () => {
    it('cannot decrypt with a different key', () => {
      process.env['ENCRYPTION_KEY'] = VALID_KEY;
      const ct = encrypt('secret data');

      // Switch to a different key
      process.env['ENCRYPTION_KEY'] = 'b'.repeat(64);
      expect(() => decrypt(ct)).toThrow();
    });
  });
});
