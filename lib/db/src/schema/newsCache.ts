import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const newsCacheTable = pgTable("news_cache", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  headline: text("headline").notNull(),
  summary: text("summary").notNull(),
  source: text("source").notNull(),
  url: text("url").notNull().default("#"),
  sentiment: text("sentiment").notNull().default("neutral"),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  isBreaking: boolean("is_breaking").notNull().default(false),
  tags: text("tags").notNull().default(""),
});

export type NewsItem = typeof newsCacheTable.$inferSelect;
