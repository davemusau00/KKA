import "dotenv/config";
import { defineConfig } from "prisma/config";

// DATABASE_URL is required at runtime (migrations, seed, server start).
// During `prisma generate` (which runs at postinstall and never opens a
// real connection) we fall back to a dummy URL so engineers can run
// `pnpm install` without a live Postgres instance.
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/kka_placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
