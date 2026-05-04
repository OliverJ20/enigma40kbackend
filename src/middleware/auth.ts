import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { auth, type Session } from "../lib/auth.js";

/**
 * Hono variables for typed access in handlers:
 *   const session = c.get("session");
 *   const user = c.get("user");
 */
declare module "hono" {
  interface ContextVariableMap {
    session: Session["session"] | null;
    user: Session["user"] | null;
  }
}

/**
 * Always-on middleware — fetches the session for every request and
 * stuffs it into the Hono context, but never throws.
 *
 * Use `requireAuth` further down the chain when an endpoint actually
 * needs a logged-in user.
 */
export const sessionMiddleware = createMiddleware(async (c, next) => {
  const sessionData = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  c.set("session", sessionData?.session ?? null);
  c.set("user", sessionData?.user ?? null);

  await next();
});

/**
 * Throws 401 if there's no logged-in user.
 */
export const requireAuth = createMiddleware(async (c, next) => {
  const user = c.get("user");
  if (!user) {
    throw new HTTPException(401, { message: "Sign-in required." });
  }
  await next();
});
