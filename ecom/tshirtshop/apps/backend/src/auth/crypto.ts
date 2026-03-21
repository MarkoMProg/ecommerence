import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from 'crypto';

// Lazy-cached key + secret so the module can be imported without env vars
// during testing — they are validated on first use.
let _key: Buffer | null = null;
let _blindSecret: string | null = null;

function key(): Buffer {
  if (!_key) {
    const hex = process.env.ENCRYPTION_KEY;
    if (!hex || hex.length !== 64) {
      throw new Error(
        '[crypto] ENCRYPTION_KEY must be a 64-char hex string (32 bytes). ' +
          "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
      );
    }
    _key = Buffer.from(hex, 'hex');
  }
  return _key;
}

function blindSecret(): string {
  if (!_blindSecret) {
    const s = process.env.BLIND_INDEX_SECRET;
    if (!s) {
      throw new Error(
        '[crypto] BLIND_INDEX_SECRET must be set in environment variables.',
      );
    }
    _blindSecret = s;
  }
  return _blindSecret;
}

export function encrypt(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decrypt(value: string): string {
  const buf = Buffer.from(value, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    'utf8',
  );
}

export function blindIndex(value: string): string {
  return createHmac('sha256', blindSecret())
    .update(value.toLowerCase().trim())
    .digest('hex');
}

export function blindEmail(value: string): string {
  return `${blindIndex(value)}@blind.index`;
}
