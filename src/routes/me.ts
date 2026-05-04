import { Hono } from "hono";
import { db, eq, lists, user } from "../db/index.js";

const app = new Hono();

/**
 * GET /me — returns the current user, or null when unauthenticated.
 *
 * The frontend uses better-auth's `useSession()` hook for most
 * session queries; this endpoint is a server-side, app-augmented view
 * that includes counts (e.g. number of authored lists).
 */
app.get("/", async (c) => {
  const currentUser = c.get("user");
  if (!currentUser) return c.json({ user: null });

  const [profile] = await db
    .select({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      image: user.image,
      bio: user.bio,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, currentUser.id))
    .limit(1);

  if (!profile) return c.json({ user: null });

  const authored = await db
    .select({ id: lists.id })
    .from(lists)
    .where(eq(lists.authorId, profile.id));

  return c.json({
    user: {
      ...profile,
      createdAt: profile.createdAt.toISOString(),
      stats: {
        listsAuthored: authored.length,
      },
    },
  });
});

export default app;
