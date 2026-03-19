/**
 * Load .env before tests run so ENCRYPTION_KEY, BLIND_INDEX_SECRET, etc. are available.
 * Path is relative to apps/backend (Jest rootDir is src, but cwd when running npm test is apps/backend).
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
