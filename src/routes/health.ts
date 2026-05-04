import { Hono } from "hono";
import { db } from "../db/index.js";
import { sql } from "drizzle-orm";

const app = new Hono();

/**
 * GET /healthz — Cloud Run health check.
 *
 * Returns 200 with { ok: true, db: "up" } when Postgres is reachable,
 * 200 with { ok: true, db: "down" } if not (Cloud Run still considers
 * the container alive; we surface DB state in the body for monitoring).
 */
app.get("/", async (c) => {
  let dbStatus: "up" | "down" = "down";
  try {
    await db.execute(sql`select 1`);
    dbStatus = "up";
  } catch {
    // swallow — surface in body
  }
  return c.json({
    ok: true,
    service: "wh40k-lists-backend",
    db: dbStatus,
    time: new Date().toISOString(),
  });
});

export default app;
