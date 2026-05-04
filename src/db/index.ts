import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "../lib/env.js";
import * as schema from "./schema.js";

neonConfig.fetchConnectionCache = true;

declare global {
  // eslint-disable-next-line no-var
  var __wh40kDb: ReturnType<typeof createClient> | undefined;
}

function createClient() {
  const sql = neon(env.DATABASE_URL);
  return drizzle(sql, { schema });
}

export const db = globalThis.__wh40kDb ?? createClient();

if (!env.NODE_ENV.startsWith("prod")) {
  globalThis.__wh40kDb = db;
}

export type DbClient = typeof db;
export * from "./schema.js";
export { eq, and, or, not, desc, asc, sql } from "drizzle-orm";
