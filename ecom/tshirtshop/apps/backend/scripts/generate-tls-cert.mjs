#!/usr/bin/env node
/**
 * SEC-001: Generate self-signed TLS certificate for local HTTPS.
 *
 * Creates certs/ directory with key.pem and cert.pem.
 * Run from apps/backend: node scripts/generate-tls-cert.mjs
 *
 * Requires: OpenSSL (usually pre-installed on macOS/Linux; on Windows: Git Bash or install OpenSSL)
 */
import { spawn } from 'child_process';
import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CERTS_DIR = join(__dirname, '..', 'certs');
const KEY_PATH = join(CERTS_DIR, 'key.pem');
const CERT_PATH = join(CERTS_DIR, 'cert.pem');

async function runOpenSSL() {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      'openssl',
      [
        'req',
        '-x509',
        '-newkey', 'rsa:4096',
        '-keyout', KEY_PATH,
        '-out', CERT_PATH,
        '-days', '365',
        '-nodes',
        '-subj', '/CN=localhost',
      ],
      { stdio: 'inherit' }
    );
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`openssl exited ${code}`))));
    proc.on('error', reject);
  });
}

async function main() {
  console.log('[generate-tls-cert] Creating certs directory:', CERTS_DIR);
  await mkdir(CERTS_DIR, { recursive: true });

  try {
    await runOpenSSL();
    console.log('[generate-tls-cert] Success. Created:');
    console.log('  -', KEY_PATH);
    console.log('  -', CERT_PATH);
    console.log('');
    console.log('To enable HTTPS, set in .env:');
    console.log('  USE_HTTPS=1');
    console.log('');
    console.log('Then restart the backend. It will listen on https://localhost:' + (process.env.PORT || '3000'));
  } catch (err) {
    console.error('[generate-tls-cert] OpenSSL failed:', err.message);
    console.error('');
    console.error('Manual steps:');
    console.error('  1. Install OpenSSL (Windows: install via Git for Windows or chocolatey)');
    console.error('  2. Run: openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/CN=localhost"');
    console.error('  3. From apps/backend directory');
    process.exit(1);
  }
}

main();
