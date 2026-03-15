import { nextJsConfig } from "@repo/eslint-config/next-js";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    files: ["next.config.js", "next.config.mjs", "next.config.ts"],
    languageOptions: { globals: { ...globals.node } },
  },
];
