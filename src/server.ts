import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { HTTPException } from "hono/http-exception";

import { auth } from "./lib/auth.js";
import { corsOrigins, env } from "./lib/env.js";
import { logger } from "./lib/logger.js";
import { sessionMiddleware } from "./middleware/auth.js";

import healthRoutes from "./routes/health.js";
import meRoutes from "./routes/me.js";
import listRoutes from "./routes/lists.js";
import catalogueRoutes from "./routes/catalogue.js";

const app = new Hono();

// ────────────────────────────────────────────────────────────
// Global middleware
// ────────────────────────────────────────────────────────────

app.use(
  "*",
  honoLogger((msg) => logger.info(msg)),
);
app.use("*", secureHeaders());

app.use(
  "*",
  cors({
    origin: (origin) => {
      // Allow requests from the configured frontend origins, plus
      // server-to-server / curl calls (no Origin header).
      if (!origin) return origin;
      return corsOrigins.includes(origin) ? origin : null;
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    maxAge: 600,
  }),
);

// ────────────────────────────────────────────────────────────
// Better-auth handler — mounted BEFORE sessionMiddleware so that
// the auth routes themselves don't try to load a session that
// doesn't exist yet (during sign-in).
// ────────────────────────────────────────────────────────────

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// ────────────────────────────────────────────────────────────
// Session middleware for everything below
// ────────────────────────────────────────────────────────────

app.use("/api/*", sessionMiddleware);

// ────────────────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────────────────

app.route("/healthz", healthRoutes);
app.route("/api/me", meRoutes);
app.route("/api/lists", listRoutes);
app.route("/api/catalogue", catalogueRoutes);

// Root
app.get("/", (c) =>
  c.json({
    service: "wh40k-lists-backend",
    docs: "https://github.com/your-org/wh40k-lists-backend",
    healthz: "/healthz",
  }),
);

// ────────────────────────────────────────────────────────────
// Error handling
// ────────────────────────────────────────────────────────────

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  logger.error({ err: err.message, stack: err.stack }, "Unhandled error");
  return c.json({ error: "Internal server error" }, 500);
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

// ────────────────────────────────────────────────────────────
// Start
// ────────────────────────────────────────────────────────────

const port = env.RUN_PORT;
serve({ fetch: app.fetch, port }, (info) => {
  logger.info(
    {
      port: info.port,
      env: env.NODE_ENV,
      cors: corsOrigins,
    },
    `🛡  Dossier API listening on :${info.port}`,
  );
});

export default app;
