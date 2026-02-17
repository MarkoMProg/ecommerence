#!/usr/bin/env node
/**
 * Wrapper to run drizzle-kit push with .env loaded from backend directory.
 * Fixes: dotenv not loading when run via npm (cwd/path issues).
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendDir = resolve(__dirname, "..");
const envPath = resolve(backendDir, ".env");

config({ path: envPath });

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL not set. Check that", envPath, "exists and contains DATABASE_URL=...");
  process.exit(1);
}

const drizzlePath = resolve(backendDir, "../../node_modules/drizzle-kit/bin.cjs");
const result = spawnSync("node", [drizzlePath, "push"], {
  cwd: backendDir,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
