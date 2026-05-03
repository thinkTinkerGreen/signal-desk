import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { apiKeysTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function generateKey(): string {
  return `sk_${crypto.randomBytes(32).toString("hex")}`;
}

export async function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || typeof apiKey !== "string") {
    res.status(401).json({ error: "Missing X-API-Key header" });
    return;
  }

  const keyHash = hashKey(apiKey);
  const [keyRow] = await db
    .select()
    .from(apiKeysTable)
    .where(eq(apiKeysTable.keyHash, keyHash));

  if (!keyRow || !keyRow.active) {
    res.status(401).json({ error: "Invalid or revoked API key" });
    return;
  }

  // Track last used (fire and forget)
  db.update(apiKeysTable)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeysTable.id, keyRow.id))
    .catch(() => {});

  // Attach key name for ingestion log
  (req as Request & { apiKeyName?: string }).apiKeyName = keyRow.name;
  next();
}
