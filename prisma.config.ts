import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Only .env (the local database). .env.local may hold the production URL for `next dev`,
// and the CLI must never migrate production by accident: set DATABASE_URL_UNPOOLED explicitly for that.
config({ path: ".env", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct connection; Neon's pooled URL is for the app.
    // Not required, so `prisma generate` (postinstall) works without a database.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  },
});
