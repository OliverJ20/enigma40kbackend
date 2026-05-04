import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";
import { corsOrigins, env, isProd } from "./env.js";
import { logger } from "./logger.js";

/**
 * Better-auth server.
 *
 * Mounted on the Hono app at `/api/auth/*` (see src/server.ts).
 * The frontend talks to it via the `betterAuthClient` from
 * `better-auth/react` configured in the Next.js app.
 *
 * ┌──────────────────────────────────────────────────────────┐
 * │ Cookies & cross-domain                                   │
 * │ ──────────────────────────────────────────────────────── │
 * │ Frontend (Vercel):  https://dossier.example.com          │
 * │ Backend  (CloudRun) https://api.dossier.example.com      │
 * │                                                           │
 * │ Browsers will not send a cookie set by the API to the     │
 * │ Vercel app unless we either:                              │
 * │   1. share an apex domain (set COOKIE_DOMAIN=.example.com)│
 * │      and use SameSite=None + Secure, OR                   │
 * │   2. accept that auth state lives on the API origin only  │
 * │      and call it directly from the browser, which is what │
 * │      we do here.                                          │
 * │                                                           │
 * │ For local dev the cross-port story (3000 ↔ 8080) requires │
 * │ SameSite=Lax to actually persist — we set it conditionally│
 * │ on NODE_ENV.                                              │
 * └──────────────────────────────────────────────────────────┘
 */

const baseHost = (() => {
  try {
    return new URL(env.BETTER_AUTH_URL).hostname;
  } catch {
    return undefined;
  }
})();

export const auth = betterAuth({
  appName: "Dossier",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      // Better-auth defaults to singular table names already, so we just
      // forward the schema. Mapped explicitly for clarity.
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    autoSignIn: true,
  },

  // GitHub social — only registers if the env vars are present so a
  // local dev can run without configuring OAuth at all.
  ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
    ? {
        socialProviders: {
          github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          },
        },
      }
    : {}),

  trustedOrigins: corsOrigins,

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once per day
  },

  advanced: {
    // In production, the backend is on a different origin from the
    // frontend, so the session cookie has to be SameSite=None.
    // In dev (localhost:3000 ↔ localhost:8080), Lax is fine and
    // avoids requiring HTTPS.
    defaultCookieAttributes: {
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      domain: env.COOKIE_DOMAIN || baseHost,
      httpOnly: true,
    },
  },

  /**
   * App-specific user extension. When better-auth creates a user we
   * derive a `username` from the email local-part. Username uniqueness
   * is enforced at the DB level, so collisions throw — we add a short
   * suffix to mitigate.
   */
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
        input: false, // not user-settable on signup; derived
      },
      bio: {
        type: "string",
        required: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (data) => {
          const local =
            data.email?.split("@")[0]?.replace(/[^a-z0-9_-]/gi, "") || "commander";
          const suffix = Math.random().toString(36).slice(2, 6);
          return {
            data: {
              ...data,
              username: `${local}-${suffix}`.slice(0, 32),
            },
          };
        },
      },
    },
  },

  logger: {
    log: (level, message, ...rest) => {
      const fn = level === "error" ? logger.error : level === "warn" ? logger.warn : logger.info;
      fn.call(logger, { rest }, `[better-auth] ${message}`);
    },
  },
});

export type Auth = typeof auth;
export type Session = Auth["$Infer"]["Session"];
