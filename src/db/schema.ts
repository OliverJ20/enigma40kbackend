import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// ────────────────────────────────────────────────────────────
// Enums
// ────────────────────────────────────────────────────────────

export const listVisibility = pgEnum("list_visibility", [
  "public",
  "unlisted",
  "private",
]);

export const gameMode = pgEnum("game_mode", [
  "combat_patrol",
  "incursion",
  "strike_force",
  "onslaught",
]);

// ────────────────────────────────────────────────────────────
// Better-auth tables
//
// Field shapes match better-auth's expected core schema:
//   https://better-auth.com/docs/concepts/database
// You can regenerate this file with `pnpm auth:generate` once your
// auth config is finalised, but we keep it inline so the schema
// stays readable.
// ────────────────────────────────────────────────────────────

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    // App-specific extension — keep on the same table.
    username: varchar("username", { length: 32 }).notNull(),
    bio: text("bio"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex("user_email_idx").on(t.email),
    usernameIdx: uniqueIndex("user_username_idx").on(t.username),
  }),
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    tokenIdx: uniqueIndex("session_token_idx").on(t.token),
    userIdx: index("session_user_idx").on(t.userId),
  }),
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    idToken: text("id_token"),
    /** Hashed password for the email+password provider (null for OAuth). */
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("account_user_idx").on(t.userId),
    providerIdx: index("account_provider_idx").on(t.providerId, t.accountId),
  }),
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    identIdx: index("verification_identifier_idx").on(t.identifier),
  }),
);

// ────────────────────────────────────────────────────────────
// Application tables — lists, likes, comments, follows
// ────────────────────────────────────────────────────────────

export const lists = pgTable(
  "lists",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    slug: varchar("slug", { length: 96 }).notNull(),
    title: varchar("title", { length: 140 }).notNull(),
    description: text("description"),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    factionId: varchar("faction_id", { length: 64 }).notNull(),
    detachmentId: varchar("detachment_id", { length: 96 }),

    points: integer("points").notNull().default(0),
    pointsLimit: integer("points_limit").notNull().default(2000),
    mode: gameMode("mode").notNull().default("strike_force"),
    visibility: listVisibility("visibility").notNull().default("public"),

    /** Roster snapshot — see Roster type in src/lib/contracts.ts */
    roster: jsonb("roster").$type<unknown>().notNull(),

    viewCount: integer("view_count").notNull().default(0),
    likeCount: integer("like_count").notNull().default(0),
    forkCount: integer("fork_count").notNull().default(0),
    forkedFromId: text("forked_from_id"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    slugAuthorIdx: uniqueIndex("lists_slug_author_idx").on(t.authorId, t.slug),
    factionIdx: index("lists_faction_idx").on(t.factionId),
    visibilityIdx: index("lists_visibility_idx").on(t.visibility),
    createdIdx: index("lists_created_idx").on(t.createdAt),
  }),
);

export const listLikes = pgTable(
  "list_likes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    listId: text("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.listId] }),
    listIdx: index("list_likes_list_idx").on(t.listId),
  }),
);

export const comments = pgTable(
  "comments",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    listId: text("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    parentId: text("parent_id"),
    edited: boolean("edited").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    listIdx: index("comments_list_idx").on(t.listId),
  }),
);

export const follows = pgTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.followerId, t.followingId] }),
  }),
);

// ────────────────────────────────────────────────────────────
// Relations
// ────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  sessions: many(session),
  lists: many(lists),
  likes: many(listLikes),
  comments: many(comments),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const listsRelations = relations(lists, ({ one, many }) => ({
  author: one(user, { fields: [lists.authorId], references: [user.id] }),
  forkedFrom: one(lists, {
    fields: [lists.forkedFromId],
    references: [lists.id],
    relationName: "fork",
  }),
  likes: many(listLikes),
  comments: many(comments),
}));

export const listLikesRelations = relations(listLikes, ({ one }) => ({
  user: one(user, { fields: [listLikes.userId], references: [user.id] }),
  list: one(lists, { fields: [listLikes.listId], references: [lists.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  list: one(lists, { fields: [comments.listId], references: [lists.id] }),
  author: one(user, { fields: [comments.authorId], references: [user.id] }),
}));

// ────────────────────────────────────────────────────────────
// Inferred types
// ────────────────────────────────────────────────────────────

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type List = typeof lists.$inferSelect;
export type NewList = typeof lists.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
