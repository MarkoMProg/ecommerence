#!/usr/bin/env node
/**
 * SEC-001: Generate TLS certificate for local HTTPS.
 *
 * Creates certs/ with:
 *   key.pem   – private key
 *   cert.pem  – server certificate
 *   ca.pem    – CA root (mkcert's rootCA.pem OR cert.pem itself for self-signed)
 *
 * Priority:
 *   1. mkcert  – generates a cert trusted by browsers/OS; CA copied to certs/ca.pem
 *   2. OpenSSL – self-signed; cert.pem is also written as ca.pem
 *   3. Docker  – runs openssl inside an Alpine container (no local install needed)
 *
 * SANs: localhost, backend (Docker hostname), 127.0.0.1, ::1
 *
 * Install mkcert (recommended):
 *   Windows (winget): winget install FiloSottile.mkcert
 *   Windows (choco):  choco install mkcert
 *   macOS:            brew install mkcert
 *   Linux:            https://github.com/FiloSottile/mkcert#installation
 */
import { spawn } from 'child_process';
import { mkdir, writeFile, unlink, copyFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CERTS_DIR = join(__dirname, '..', 'certs');
const KEY_PATH  = join(CERTS_DIR, 'key.pem');
const CERT_PATH = join(CERTS_DIR, 'cert.pem');
const CONF_PATH = join(CERTS_DIR, '_openssl_san.cnf');

// OpenSSL config with SANs – written to a temp file and deleted after use.
// Using a config file is compatible with all OpenSSL 1.x / 3.x versions on
// all platforms (avoids the -addext flag which requires OpenSSL 1.1.1+).
const OPENSSL_CONFIG = `\
[req]
default_bits       = 4096
prompt             = no
default_md         = sha256
distinguished_name = dn
x509_extensions    = v3_req

[dn]
CN = localhost

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = backend
IP.1  = 127.0.0.1
IP.2  = ::1
`;

async function runOpenSSL() {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      'openssl',
      [
        'req',
        '-x509',
        '-newkey', 'rsa:4096',
        '-keyout', KEY_PATH,
        '-out',    CERT_PATH,
        '-days',   '365',
        '-nodes',
        '-config', CONF_PATH,
      ],
      { stdio: 'inherit' }
    );
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`openssl exited ${code}`))));
    proc.on('error', reject);
  });
}

/**
 * Fallback: run openssl inside a temporary Docker container.
 * Works on any platform where Docker Desktop is installed — no local OpenSSL needed.
 * The certs/ directory is bind-mounted so the generated files land on the host.
 */
async function runOpenSSLViaDocker() {
  console.log('[generate-tls-cert] openssl not found locally — falling back to Docker...');

  // Docker Desktop on Windows accepts forward-slash paths for -v mounts.
  const dockerCertsDir = CERTS_DIR.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, d) => `//${d.toLowerCase()}`);

  // Run openssl inside Alpine.  The SAN config was already written to CERTS_DIR,
  // so it is available inside the container at /output/_openssl_san.cnf.
  return new Promise((resolve, reject) => {
    const proc = spawn(
      'docker',
      [
        'run', '--rm',
        '-v', `${dockerCertsDir}:/output`,
        'alpine',
        'sh', '-c',
        [
          'apk add --no-cache openssl >/dev/null 2>&1',
          '&&',
          'openssl req -x509',
          '-newkey rsa:4096',
          '-keyout /output/key.pem',
          '-out    /output/cert.pem',
          '-days   365',
          '-nodes',
          '-config /output/_openssl_san.cnf',
        ].join(' '),
      ],
      { stdio: 'inherit' }
    );
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`docker run openssl exited ${code}`))));
    proc.on('error', (err) => reject(new Error(`docker not found either: ${err.message}`)));
  });
}

/** Returns true when the openssl binary is available on PATH. */
async function opensslAvailable() {
  return new Promise((resolve) => {
    const proc = spawn('openssl', ['version'], { stdio: 'ignore' });
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

/** Returns true when mkcert binary is available on PATH. */
async function mkcertAvailable() {
  return new Promise((resolve) => {
    const proc = spawn('mkcert', ['-version'], { stdio: 'ignore' });
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

/**
 * Returns the path to mkcert's local CA root certificate, or null if not found.
 * mkcert stores it in a platform-specific data directory.
 */
function getMkcertCaRootPath() {
  let candidate;
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA
      || join(process.env.USERPROFILE || '', 'AppData', 'Local');
    candidate = join(localAppData, 'mkcert', 'rootCA.pem');
  } else if (process.platform === 'darwin') {
    candidate = join(process.env.HOME || '', 'Library', 'Application Support', 'mkcert', 'rootCA.pem');
  } else {
    const xdgData = process.env.XDG_DATA_HOME
      || join(process.env.HOME || '', '.local', 'share');
    candidate = join(xdgData, 'mkcert', 'rootCA.pem');
  }
  return existsSync(candidate) ? candidate : null;
}

/** Generate cert using mkcert (creates a browser/OS-trusted certificate). */
async function runMkcert() {
  // Install the mkcert CA into the system trust store (requires user approval on first run)
  console.log('[generate-tls-cert] Installing mkcert local CA (may prompt for admin/sudo)...');
  await new Promise((resolve) => {
    const proc = spawn('mkcert', ['-install'], { stdio: 'inherit' });
    // Non-zero exit is treated as a warning (commonly happens when Java JDK
    // cacerts is read-only — the Windows/browser trust store is still updated).
    proc.on('close', (code) => {
      if (code !== 0) {
        console.warn('[generate-tls-cert] mkcert -install exited with code', code,
          '— usually a Java keystore permission warning; ignoring.');
      }
      resolve();
    });
    proc.on('error', resolve); // also non-fatal
  });

  // Generate cert covering all required hostnames
  await new Promise((resolve, reject) => {
    const proc = spawn(
      'mkcert',
      ['-key-file', KEY_PATH, '-cert-file', CERT_PATH, 'localhost', '127.0.0.1', '::1', 'backend'],
      { stdio: 'inherit' },
    );
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`mkcert exited ${code}`))));
    proc.on('error', reject);
  });
}



async function main() {
  console.log('[generate-tls-cert] Creating certs directory:', CERTS_DIR);
  await mkdir(CERTS_DIR, { recursive: true });

  const CA_PATH = join(CERTS_DIR, 'ca.pem');

  const hasMkcert = await mkcertAvailable();
  const hasOpenssl = await opensslAvailable();

  try {
    if (hasMkcert) {
      // ── Path 1: mkcert ──────────────────────────────────────────────────────
      console.log('[generate-tls-cert] mkcert detected — using mkcert (browser-trusted cert).');
      await runMkcert();

      // Copy the mkcert CA root to certs/ca.pem so Docker containers can trust it
      const caRoot = getMkcertCaRootPath();
      if (caRoot) {
        await copyFile(caRoot, CA_PATH);
        console.log('[generate-tls-cert] Copied mkcert CA root →', CA_PATH);
      } else {
        console.warn('[generate-tls-cert] Warning: could not locate mkcert rootCA.pem; ca.pem not written.');
      }
    } else {
      // ── Path 2: OpenSSL (local or via Docker) ───────────────────────────────
      if (!hasMkcert) {
        console.log('[generate-tls-cert] mkcert not found — falling back to OpenSSL (self-signed cert).');
        console.log('[generate-tls-cert] For browser-trusted certs install mkcert: winget install FiloSottile.mkcert');
      }

      // Write temporary OpenSSL config
      await writeFile(CONF_PATH, OPENSSL_CONFIG);
      try {
        if (hasOpenssl) {
          await runOpenSSL();
        } else {
          await runOpenSSLViaDocker();
        }
      } finally {
        await unlink(CONF_PATH).catch(() => {});
      }

      // For self-signed certs the cert IS its own CA — copy it as ca.pem
      await copyFile(CERT_PATH, CA_PATH);
      console.log('[generate-tls-cert] Wrote ca.pem (=cert.pem for self-signed)');
    }

    console.log('[generate-tls-cert] Success. Created:');
    console.log('  key.pem  →', KEY_PATH);
    console.log('  cert.pem →', CERT_PATH);
    console.log('  ca.pem   →', CA_PATH);
    console.log('');
    if (hasMkcert) {
      console.log('Certificate is trusted by your OS and browsers (via mkcert local CA).');
      console.log('Node.js server-side fetch trusts it via the mkcert CA at %LOCALAPPDATA%/mkcert/rootCA.pem.');
    } else {
      console.log('Self-signed cert generated. Browsers will show a warning — install mkcert to avoid this.');
    }
    console.log('');
    console.log('Ensure USE_HTTPS=1 is set in apps/backend/.env, then restart the backend.');
  } catch (err) {
    console.error('[generate-tls-cert] Certificate generation failed:', err.message);
    console.error('');
    console.error('Install mkcert (recommended):');
    console.error('  Windows: winget install FiloSottile.mkcert');
    console.error('  macOS:   brew install mkcert');
    console.error('  Linux:   https://github.com/FiloSottile/mkcert#installation');
    console.error('');
    console.error('Or install OpenSSL and re-run this script.');
    process.exit(1);
  }
}

main();
