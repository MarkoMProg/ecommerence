import { defineConfig } from "drizzle-kit";

// NOTE: Load .env before running drizzle-kit. Use: npm run db:push (preloads dotenv)

export default defineConfig({
  schema: ["./src/auth/schema.ts", "./src/catalog/schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
