import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL ?? "file:./data/app.db";
const file = databaseUrl.startsWith("file:")
  ? databaseUrl.slice("file:".length)
  : databaseUrl;

function createDb() {
  const absolute = path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    file,
  );
  fs.mkdirSync(path.dirname(absolute), { recursive: true });

  const sqlite = new Database(absolute);
  sqlite.pragma("foreign_keys = ON");

  return drizzle(sqlite, { schema });
}

// Next.js clears the module cache on hot reload; keep one connection per process.
const globalForDb = globalThis as unknown as {
  __campoDb?: ReturnType<typeof createDb>;
};

export const db = globalForDb.__campoDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__campoDb = db;
}

export { schema };
