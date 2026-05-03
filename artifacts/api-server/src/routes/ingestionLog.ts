import { Router } from "express";
import { db, ingestionLogTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { GetIngestionLogQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/ingestion/log", async (req, res) => {
  const parsed = GetIngestionLogQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, limit } = parsed.data;

  let rows = await db
    .select()
    .from(ingestionLogTable)
    .orderBy(desc(ingestionLogTable.createdAt))
    .limit(limit ?? 200);

  if (status && status !== "all") {
    rows = rows.filter((r) =>
      status === "accepted" ? r.accepted : !r.accepted
    );
  }

  res.json(rows);
});

export default router;
