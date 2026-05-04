import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { and, db, desc, eq, lists, listLikes, sql, user } from "../db/index.js";
import {
  createListSchema,
  listListsQuerySchema,
  updateListSchema,
} from "../lib/contracts.js";
import { requireAuth } from "../middleware/auth.js";

const app = new Hono();

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function uniqueSlug(title: string): string {
  const base = slugify(title) || "untitled-list";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

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

// ────────────────────────────────────────────────────────────
// GET /lists — browse
// ────────────────────────────────────────────────────────────

app.get(
  "/",
  zValidator("query", listListsQuerySchema),
  async (c) => {
    const { faction, q, author, limit } = c.req.valid("query");
    const needle = q?.toLowerCase();

    // Base predicate — public only
    const conditions = [eq(lists.visibility, "public" as const)];
    if (faction) conditions.push(eq(lists.factionId, faction));
    if (author) conditions.push(eq(user.username, author));

    const rows = await db
      .select(summaryColumns)
      .from(lists)
      .innerJoin(user, eq(lists.authorId, user.id))
      .where(and(...conditions))
      .orderBy(desc(lists.updatedAt))
      .limit(limit);

    const filtered = needle
      ? rows.filter((r) =>
          `${r.title} ${r.description ?? ""} ${r.authorUsername ?? ""}`
            .toLowerCase()
            .includes(needle),
        )
      : rows;

    return c.json({
      lists: filtered.map(toSummary),
      count: filtered.length,
    });
  },
);

// ────────────────────────────────────────────────────────────
// POST /lists — create
// ────────────────────────────────────────────────────────────

app.post(
  "/",
  requireAuth,
  zValidator("json", createListSchema),
  async (c) => {
    const data = c.req.valid("json");
    const currentUser = c.get("user")!;

    const computedPoints = data.roster.selections.reduce(
      (sum, s) => sum + s.points,
      0,
    );
    const slug = uniqueSlug(data.title);

    const [created] = await db
      .insert(lists)
      .values({
        slug,
        title: data.title,
        description: data.description,
        authorId: currentUser.id,
        factionId: data.factionId,
        detachmentId: data.detachmentId,
        points: computedPoints,
        pointsLimit: data.pointsLimit,
        visibility: data.visibility,
        roster: data.roster,
      })
      .returning({ id: lists.id, slug: lists.slug });

    if (!created) {
      throw new HTTPException(500, { message: "Failed to create list." });
    }

    return c.json({ id: created.id, slug: created.slug }, 201);
  },
);

// ────────────────────────────────────────────────────────────
// GET /lists/:slug — detail
// ────────────────────────────────────────────────────────────

app.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const [row] = await db
    .select({ ...summaryColumns, roster: lists.roster })
    .from(lists)
    .innerJoin(user, eq(lists.authorId, user.id))
    .where(eq(lists.slug, slug))
    .limit(1);

  if (!row) throw new HTTPException(404, { message: "List not found." });

  // Enforce private visibility
  const currentUser = c.get("user");
  if (row.visibility === "private" && row.authorId !== currentUser?.id) {
    throw new HTTPException(404, { message: "List not found." });
  }

  // Fire-and-forget view counter (don't block the response).
  db.update(lists)
    .set({ viewCount: sql`${lists.viewCount} + 1` })
    .where(eq(lists.id, row.id))
    .catch(() => {});

  return c.json({
    ...toSummary(row),
    roster: row.roster,
  });
});

// ────────────────────────────────────────────────────────────
// PATCH /lists/:slug — update (author only)
// ────────────────────────────────────────────────────────────

app.patch(
  "/:slug",
  requireAuth,
  zValidator("json", updateListSchema),
  async (c) => {
    const slug = c.req.param("slug");
    const data = c.req.valid("json");
    const currentUser = c.get("user")!;

    const [existing] = await db
      .select({ id: lists.id, authorId: lists.authorId })
      .from(lists)
      .where(eq(lists.slug, slug))
      .limit(1);

    if (!existing) throw new HTTPException(404, { message: "List not found." });
    if (existing.authorId !== currentUser.id) {
      throw new HTTPException(403, { message: "Not your list." });
    }

    const points = data.roster
      ? data.roster.selections.reduce((sum, s) => sum + s.points, 0)
      : undefined;

    await db
      .update(lists)
      .set({
        ...data,
        ...(points !== undefined ? { points } : {}),
        updatedAt: new Date(),
      })
      .where(eq(lists.id, existing.id));

    return c.json({ ok: true });
  },
);

// ────────────────────────────────────────────────────────────
// DELETE /lists/:slug — author only
// ────────────────────────────────────────────────────────────

app.delete("/:slug", requireAuth, async (c) => {
  const slug = c.req.param("slug");
  const currentUser = c.get("user")!;

  const [existing] = await db
    .select({ id: lists.id, authorId: lists.authorId })
    .from(lists)
    .where(eq(lists.slug, slug))
    .limit(1);

  if (!existing) throw new HTTPException(404, { message: "List not found." });
  if (existing.authorId !== currentUser.id) {
    throw new HTTPException(403, { message: "Not your list." });
  }

  await db.delete(lists).where(eq(lists.id, existing.id));
  return c.json({ ok: true });
});

// ────────────────────────────────────────────────────────────
// POST /lists/:slug/fork — clone, attribute
// ────────────────────────────────────────────────────────────

app.post("/:slug/fork", requireAuth, async (c) => {
  const slug = c.req.param("slug");
  const currentUser = c.get("user")!;

  const [src] = await db
    .select()
    .from(lists)
    .where(eq(lists.slug, slug))
    .limit(1);

  if (!src) throw new HTTPException(404, { message: "List not found." });
  if (src.visibility === "private" && src.authorId !== currentUser.id) {
    throw new HTTPException(404, { message: "List not found." });
  }

  const newSlug = uniqueSlug(`fork-${src.title}`);
  const [created] = await db
    .insert(lists)
    .values({
      slug: newSlug,
      title: `Fork of ${src.title}`,
      description: src.description,
      authorId: currentUser.id,
      factionId: src.factionId,
      detachmentId: src.detachmentId,
      points: src.points,
      pointsLimit: src.pointsLimit,
      visibility: "public",
      roster: src.roster,
      forkedFromId: src.id,
    })
    .returning({ id: lists.id, slug: lists.slug });

  // Bump fork counter on source
  await db
    .update(lists)
    .set({ forkCount: sql`${lists.forkCount} + 1` })
    .where(eq(lists.id, src.id));

  return c.json({ id: created?.id, slug: created?.slug }, 201);
});

// ────────────────────────────────────────────────────────────
// POST /lists/:slug/like — toggle
// ────────────────────────────────────────────────────────────

app.post("/:slug/like", requireAuth, async (c) => {
  const slug = c.req.param("slug");
  const currentUser = c.get("user")!;

  const [target] = await db
    .select({ id: lists.id })
    .from(lists)
    .where(eq(lists.slug, slug))
    .limit(1);
  if (!target) throw new HTTPException(404, { message: "List not found." });

  const [existing] = await db
    .select({ userId: listLikes.userId })
    .from(listLikes)
    .where(
      and(eq(listLikes.userId, currentUser.id), eq(listLikes.listId, target.id)),
    )
    .limit(1);

  if (existing) {
    await db
      .delete(listLikes)
      .where(
        and(eq(listLikes.userId, currentUser.id), eq(listLikes.listId, target.id)),
      );
    await db
      .update(lists)
      .set({ likeCount: sql`GREATEST(${lists.likeCount} - 1, 0)` })
      .where(eq(lists.id, target.id));
    return c.json({ liked: false });
  }

  await db.insert(listLikes).values({
    userId: currentUser.id,
    listId: target.id,
  });
  await db
    .update(lists)
    .set({ likeCount: sql`${lists.likeCount} + 1` })
    .where(eq(lists.id, target.id));
  return c.json({ liked: true });
});

export default app;
