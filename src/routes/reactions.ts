import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/authz";
import { Reaction } from "../models/Reaction";
import { Rating } from "../models/Rating";

const router = Router();

const reactSchema = z.object({ emoji: z.string().min(1) });

router.post("/ratings/:id/reactions", requireAuth, async (req, res) => {
    const parsed = reactSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const rating = await Rating.findById(req.params.id);
    if (!rating) return res.status(404).end();
    try {
        await Reaction.create({
            ratingId: rating._id,
            userId: req.user!.id,
            emoji: parsed.data.emoji,
        });
        await Rating.updateOne(
            { _id: rating._id },
            { $inc: { [`reactions.${parsed.data.emoji}`]: 1 } }
        );
    } catch {}
    const updated = await Rating.findById(req.params.id);
    res.json({ reactions: updated?.reactions || {} });
});

router.delete("/ratings/:id/reactions", requireAuth, async (req, res) => {
    const parsed = reactSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const rating = await Rating.findById(req.params.id);
    if (!rating) return res.status(404).end();
    const del = await Reaction.findOneAndDelete({
        ratingId: rating._id,
        userId: req.user!.id,
        emoji: parsed.data.emoji,
    });
    if (del)
        await Rating.updateOne(
            { _id: rating._id },
            { $inc: { [`reactions.${parsed.data.emoji}`]: -1 } }
        );
    const updated = await Rating.findById(req.params.id);
    res.json({ reactions: updated?.reactions || {} });
});

export default router;