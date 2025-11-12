import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/authz";
import { Rating } from "../models/Rating";
import { PNM } from "../models/PNM";
import { recomputeAggregate } from "../services/aggregate";
import { Reaction } from "../models/Reaction";
import { TermMembership } from "../models/TermMembership";
import { User } from "../models/User";

const router = Router();

const bodySchema = z.object({
    score: z.number().int().min(0).max(10),
    comment: z.string().max(500).optional(),
});

router.post("/pnms/:id/ratings", requireAuth, async (req: any, res) => {
    const pnm = await PNM.findById(req.params.id);
    if (!pnm) return res.status(404).end();
    const mem = await TermMembership.findOne({
        termId: pnm.termId,
        userId: req.user.id,
    });
    if (!mem) return res.status(403).json({ error: "not_a_member" });
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const payload = parsed.data;
    const doc = await Rating.findOneAndUpdate(
        { termId: pnm.termId, pnmId: pnm._id, raterId: req.user.id },
        {
            ...payload,
            termId: pnm.termId,
            pnmId: pnm._id,
            raterId: req.user.id,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    await recomputeAggregate(String(pnm.termId), String(pnm._id));
    res.json(doc);
});

router.get("/pnms/:id/ratings", requireAuth, async (req: any, res) => {
    const pnm = await PNM.findById(req.params.id);
    if (!pnm) return res.status(404).end();
    const mem = await TermMembership.findOne({
        termId: pnm.termId,
        userId: req.user.id,
    });
    if (!mem) return res.status(403).json({ error: "not_a_member" });
    const rows = await Rating.find({
        termId: pnm.termId,
        pnmId: pnm._id,
        isHidden: false,
    }).sort({ updatedAt: -1 });
    const userReacts = await Reaction.find({
        ratingId: { $in: rows.map((r) => r._id) },
        userId: req.user.id,
    });
    const byId = new Map(userReacts.map((r) => [String(r.ratingId), r]));
    const users = await User.find({
        _id: { $in: rows.map((r) => r.raterId) },
    }).select("_id name email");
    const payload = rows.map((r) => {
        const u = users.find((x) => String(x._id) === String(r.raterId));
        const reactions: Record<string, number> = {};
        for (const [k, v] of r.reactions.entries()) reactions[k] = v as number;
        return {
            id: r._id,
            score: r.score,
            comment: r.comment,
            rater: u ? { id: u._id, name: u.name, email: u.email } : null,
            updatedAt: r.updatedAt,
            reactions,
            myReactions: byId.has(String(r._id))
                ? [byId.get(String(r._id))!.emoji]
                : [],
        };
    });
    res.json({ items: payload });
});

router.delete("/pnms/:id/ratings/mine", requireAuth, async (req: any, res) => {
    const pnm = await PNM.findById(req.params.id);
    if (!pnm) return res.status(404).end();
    const mem = await TermMembership.findOne({
        termId: pnm.termId,
        userId: req.user.id,
    });
    if (!mem) return res.status(403).json({ error: "not_a_member" });
    await Rating.findOneAndDelete({
        termId: pnm.termId,
        pnmId: pnm._id,
        raterId: req.user.id,
    });
    await recomputeAggregate(String(pnm.termId), String(pnm._id));
    res.status(204).end();
});

export default router;