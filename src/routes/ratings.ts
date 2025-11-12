import { Router } from "express";
import { z } from "zod";
import { Rating } from "../models/Rating";
import { requireAuth } from "../middleware/authz";
import { recomputeAggregate } from "../services/aggregate";

const router = Router();

const bodySchema = z.object({
    score: z.number().int().min(0).max(10),
    comment: z.string().max(500).optional(),
});

router.post("/pnms/:id/ratings", requireAuth, async (req: any, res) => {
    const pnmId = req.params.id;
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const payload = parsed.data;
    const doc = await Rating.findOneAndUpdate(
        { pnmId, raterId: req.user.id },
        { ...payload, pnmId, raterId: req.user.id },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    await recomputeAggregate(pnmId);
    res.json(doc);
});

router.get("/pnms/:id/ratings", requireAuth, async (req, res) => {
    const rows = await Rating.find({ pnmId: req.params.id }).sort({
        updatedAt: -1,
    });
    res.json(rows);
});

router.delete("/pnms/:id/ratings/mine", requireAuth, async (req: any, res) => {
    const pnmId = req.params.id;
    await Rating.findOneAndDelete({ pnmId, raterId: req.user.id });
    await recomputeAggregate(pnmId);
    res.status(204).end();
});

export default router;