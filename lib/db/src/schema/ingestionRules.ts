import { pgTable, serial, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ingestionRulesTable = pgTable("ingestion_rules", {
  id: serial("id").primaryKey(),
  minConfidence: real("min_confidence").notNull().default(0),
  allowStocks: boolean("allow_stocks").notNull().default(true),
  allowIndices: boolean("allow_indices").notNull().default(true),
  allowForex: boolean("allow_forex").notNull().default(true),
  requireReasoning: boolean("require_reasoning").notNull().default(false),
  requireStopLoss: boolean("require_stop_loss").notNull().default(false),
  requireTargetPrice: boolean("require_target_price").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertIngestionRulesSchema = createInsertSchema(ingestionRulesTable).omit({ id: true });
export type InsertIngestionRules = z.infer<typeof insertIngestionRulesSchema>;
export type IngestionRulesRow = typeof ingestionRulesTable.$inferSelect;
