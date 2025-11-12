import { Router } from "express";
import { z } from "zod";
import { PNM } from "../models/PNM.js";
import { requireAuth, requireRole } from "../middleware/authz.js";
import { config } from "../config/env.js";

const router = Router();

const upsertSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  preferredName: z.string().optional(),
  classYear: z.number().int().optional(),
  major: z.string().optional(),
  gpa: z.number().min(0).max(4).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  instagram: z.string().optional(),
  notes: z.string().optional(),
  photoURL: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["new", "invited", "bid", "declined"]).optional()
});

router.post("/pnms", requireAuth, requireRole("Admin", "Adder"), async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const doc = await PNM.create(parsed.data);
  res.json(doc);
});

router.patch("/pnms/:id", requireAuth, requireRole("Admin", "Adder"), async (req, res) => {
  const parsed = upsertSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const doc = await PNM.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
  if (!doc) return res.status(404).end();
  res.json(doc);
});

router.get("/pnms", requireAuth, async (req, res) => {
  const { q = "", status, year, tag, sort = "-aggregate.avgScore,-aggregate.countRatings,-updatedAt", page = "1", limit = "50" } = req.query as Record<string, string>;
  const filter: any = {};
  if (status) filter.status = status;
  if (year) filter.classYear = Number(year);
  if (tag) filter.tags = tag;
  if (q) {
    const rx = new RegExp(q, "i");
    filter.$or = [{ firstName: rx }, { lastName: rx }, { preferredName: rx }, { major: rx }, { tags: rx }];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const items = await PNM.find(filter).sort(sort.split(",").join(" ")).skip(skip).limit(Number(limit));
  res.json({ items });
});

router.get("/pnms/:id", requireAuth, async (req, res) => {
  const doc = await PNM.findById(req.params.id);
  if (!doc) return res.status(404).end();
  res.json(doc);
});

router.delete("/pnms/:id", requireAuth, requireRole("Admin"), async (req, res) => {
  await PNM.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

const attachSchema = z.object({
  key: z.string().min(1)
});

router.post("/pnms/:id/photo/attach", requireAuth, requireRole("Admin", "Adder"), async (req, res) => {
  const parsed = attachSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const photoURL = `${config.S3_PUBLIC_URL_BASE}/${parsed.data.key}`;
  const doc = await PNM.findByIdAndUpdate(req.params.id, { photoURL }, { new: true });
  if (!doc) return res.status(404).end();
  res.json({ photoURL });
});

export default router;