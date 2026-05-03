import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const integrationConfigsTable = pgTable("integration_configs", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  config: text("config").notNull().default("{}"),
  lastTestedAt: timestamp("last_tested_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type IntegrationConfig = typeof integrationConfigsTable.$inferSelect;
