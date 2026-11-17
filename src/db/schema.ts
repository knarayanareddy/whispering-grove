import { index, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Account-less cloud saves, keyed by a device token generated in the browser.
export const saves = pgTable("saves", {
  token: text("token").primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Leaderboards: Daily Trial, Wilds tiers and story clear times (lower value = faster).
export const scores = pgTable(
  "scores",
  {
    id: serial("id").primaryKey(),
    token: text("token").notNull(),
    name: text("name").notNull(),
    board: text("board").notNull(),
    value: integer("value").notNull(),
    diff: text("diff").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("scores_board_idx").on(t.board, t.value)],
);
