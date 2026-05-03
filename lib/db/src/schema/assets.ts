import { pgTable, serial, text, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assetsTable = pgTable("assets", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  assetClass: text("asset_class").notNull(),
  currentPrice: real("current_price").notNull(),
  change: real("change").notNull().default(0),
  changePercent: real("change_percent").notNull().default(0),
  volume: text("volume").notNull().default("0"),
  marketCap: text("market_cap").notNull().default("N/A"),
});

export const insertAssetSchema = createInsertSchema(assetsTable).omit({ id: true });
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assetsTable.$inferSelect;
