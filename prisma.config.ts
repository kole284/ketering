import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Same files Next.js reads; .env.local comes from `vercel env pull`.
config({ path: [".env.local", ".env"], quiet: true });

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
