import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ingestionLogTable = pgTable("ingestion_log", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(), // agent | tradingview | manual
  symbol: text("symbol").notNull(),
  signalType: text("signal_type").notNull(),
  accepted: boolean("accepted").notNull(),
  rejectionReason: text("rejection_reason"),
  keyName: text("key_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertIngestionLogSchema = createInsertSchema(ingestionLogTable).omit({ id: true, createdAt: true });
export type InsertIngestionLog = z.infer<typeof insertIngestionLogSchema>;
export type IngestionLogRow = typeof ingestionLogTable.$inferSelect;
