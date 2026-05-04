import { z } from "zod";

/**
 * API contracts.
 *
 * IMPORTANT: this file is duplicated verbatim in the frontend repo at
 * `src/lib/api/contracts.ts`. Until we extract a shared package, keep
 * the two files in sync by hand. They define the wire format between
 * the Vercel app and the Cloud Run API.
 */

// ────────────────────────────────────────────────────────────
// Roster — matches the Roster type in @wh40k/wh40k-data
// ────────────────────────────────────────────────────────────

export const unitSelectionSchema = z.object({
  id: z.string(),
  unitId: z.string(),
  name: z.string(),
  modelCount: z.number().int().positive(),
  points: z.number().int().nonnegative(),
  notes: z.string().optional(),
});

export const rosterSchema = z.object({
  version: z.literal(1),
  factionId: z.string(),
  detachmentId: z.string().optional(),
  pointsLimit: z.number().int().positive(),
  enhancements: z
    .array(
      z.object({
        unitSelectionId: z.string(),
        enhancementId: z.string(),
      }),
    )
    .default([]),
  selections: z.array(unitSelectionSchema),
});

export type Roster = z.infer<typeof rosterSchema>;

// ────────────────────────────────────────────────────────────
// Lists
// ────────────────────────────────────────────────────────────

export const listVisibilitySchema = z.enum(["public", "unlisted", "private"]);

export const createListSchema = z.object({
  title: z.string().min(1).max(140),
  description: z.string().max(2000).optional(),
  factionId: z.string().min(1),
  detachmentId: z.string().optional(),
  pointsLimit: z.number().int().min(500).max(3000).default(2000),
  visibility: listVisibilitySchema.default("public"),
  roster: rosterSchema,
});

export const updateListSchema = createListSchema.partial();

export const listListsQuerySchema = z.object({
  faction: z.string().optional(),
  q: z.string().optional(),
  author: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  cursor: z.string().optional(),
});

export const listSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  factionId: z.string(),
  detachmentId: z.string().nullable(),
  points: z.number().int(),
  pointsLimit: z.number().int(),
  visibility: listVisibilitySchema,
  viewCount: z.number().int(),
  likeCount: z.number().int(),
  forkCount: z.number().int(),
  forkedFromId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  author: z.object({
    id: z.string(),
    username: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable(),
  }),
});

export const listDetailSchema = listSummarySchema.extend({
  roster: rosterSchema,
});

export const listListsResponseSchema = z.object({
  lists: z.array(listSummarySchema),
  count: z.number().int(),
  nextCursor: z.string().nullable().optional(),
});

// ────────────────────────────────────────────────────────────
// Comments
// ────────────────────────────────────────────────────────────

export const createCommentSchema = z.object({
  body: z.string().min(1).max(4000),
  parentId: z.string().optional(),
});

export const commentSchema = z.object({
  id: z.string(),
  listId: z.string(),
  parentId: z.string().nullable(),
  body: z.string(),
  edited: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  author: z.object({
    id: z.string(),
    username: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable(),
  }),
});

// ────────────────────────────────────────────────────────────
// Inferred types
// ────────────────────────────────────────────────────────────

export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type ListSummary = z.infer<typeof listSummarySchema>;
export type ListDetail = z.infer<typeof listDetailSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CommentDto = z.infer<typeof commentSchema>;
