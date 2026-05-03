import { Router } from "express";
import { db, apiKeysTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateKey, hashKey } from "../lib/apiKeyAuth";
import { CreateApiKeyBody, DeleteApiKeyParams } from "@workspace/api-zod";

const router = Router();

router.get("/keys", async (_req, res) => {
  const keys = await db
    .select({
      id: apiKeysTable.id,
      name: apiKeysTable.name,
      prefix: apiKeysTable.prefix,
      active: apiKeysTable.active,
      lastUsedAt: apiKeysTable.lastUsedAt,
      createdAt: apiKeysTable.createdAt,
    })
    .from(apiKeysTable)
    .orderBy(apiKeysTable.createdAt);

  res.json(keys);
});

router.post("/keys", async (req, res) => {
  const parsed = CreateApiKeyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const key = generateKey();
  const keyHash = hashKey(key);
  const prefix = key.slice(0, 10); // "sk_" + first 7 hex chars

  const [row] = await db
    .insert(apiKeysTable)
    .values({
      name: parsed.data.name,
      keyHash,
      prefix,
      active: true,
    })
    .returning();

  res.status(201).json({
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    key, // Full key — only shown once
    active: row.active,
    createdAt: row.createdAt,
  });
});

router.delete("/keys/:id", async (req, res) => {
  const parsed = DeleteApiKeyParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db
    .update(apiKeysTable)
    .set({ active: false })
    .where(eq(apiKeysTable.id, parsed.data.id));

  res.status(204).send();
});

export default router;
