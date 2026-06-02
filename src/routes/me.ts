import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { and, db, desc, eq, lists, user } from "../db/index.js";
import { myListsQuerySchema } from "../lib/contracts.js";
import { requireAuth } from "../middleware/auth.js";

const app = new Hono();

const summaryColumns = {
  id: lists.id,
  slug: lists.slug,
  title: lists.title,
  description: lists.description,
  factionId: lists.factionId,
  detachmentId: lists.detachmentId,
  points: lists.points,
  pointsLimit: lists.pointsLimit,
  visibility: lists.visibility,
  viewCount: lists.viewCount,
  likeCount: lists.likeCount,
  forkCount: lists.forkCount,
  forkedFromId: lists.forkedFromId,
  createdAt: lists.createdAt,
  updatedAt: lists.updatedAt,
  authorId: user.id,
  authorUsername: user.username,
  authorName: user.name,
  authorImage: user.image,
};

function toSummary(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    factionId: row.factionId as string,
    detachmentId: (row.detachmentId as string | null) ?? null,
    points: row.points as number,
    pointsLimit: row.pointsLimit as number,
    visibility: row.visibility as "public" | "unlisted" | "private",
    viewCount: row.viewCount as number,
    likeCount: row.likeCount as number,
    forkCount: row.forkCount as number,
    forkedFromId: (row.forkedFromId as string | null) ?? null,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
    author: {
      id: row.authorId as string,
      username: row.authorUsername as string,
      name: (row.authorName as string | null) ?? null,
      image: (row.authorImage as string | null) ?? null,
    },
  };
}

/**
 * GET /me — returns the current user profile, or null when unauthenticated.
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

/**
 * GET /me/lists — all lists belonging to the current user (all visibilities).
 * Requires authentication.
 */
app.get(
  "/lists",
  requireAuth,
  zValidator("query", myListsQuerySchema),
  async (c) => {
    const currentUser = c.get("user")!;
    const { faction, q, sort, limit } = c.req.valid("query");
    const needle = q?.toLowerCase();

    const conditions = [eq(lists.authorId, currentUser.id)];
    if (faction) conditions.push(eq(lists.factionId, faction));

    const orderCol = sort === "views" ? desc(lists.viewCount) : desc(lists.updatedAt);

    const rows = await db
      .select(summaryColumns)
      .from(lists)
      .innerJoin(user, eq(lists.authorId, user.id))
      .where(and(...conditions))
      .orderBy(orderCol)
      .limit(limit);

    const filtered = needle
      ? rows.filter((r) =>
          `${r.title} ${r.description ?? ""}`.toLowerCase().includes(needle),
        )
      : rows;

    return c.json({ lists: filtered.map(toSummary), count: filtered.length });
  },
);

export default app;
