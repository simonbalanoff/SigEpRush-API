import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { requireAuth } from "../middleware/authz";
import { Term } from "../models/Term";
import { TermMembership } from "../models/TermMembership";

const router = Router();

const createSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(3).max(40),
    inviteCode: z.string().min(6),
    inviteExpiresAt: z.string().datetime().optional(),
    inviteMaxUses: z.number().int().positive().optional(),
});

router.post("/", requireAuth, async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());

    const hash = crypto
        .createHash("sha256")
        .update(parsed.data.inviteCode.toLowerCase())
        .digest("hex");

    try {
        const t = await Term.create({
            name: parsed.data.name,
            code: parsed.data.code.toLowerCase(),
            isActive: true,
            createdBy: req.user!.id,
            inviteCodeHash: hash,
            inviteCode: parsed.data.inviteCode,
            inviteExpiresAt: parsed.data.inviteExpiresAt
                ? new Date(parsed.data.inviteExpiresAt)
                : undefined,
            inviteMaxUses: parsed.data.inviteMaxUses,
            inviteUses: 0,
        });

        await TermMembership.create({
            userId: req.user!.id,
            termId: t._id,
            role: "Admin",
        });

        res.status(201).json({ id: t._id, code: t.code, name: t.name });
    } catch (err: any) {
        if (err?.code === 11000) {
            return res.status(409).json({ error: "term_code_exists" });
        }
        throw err;
    }
});

router.get("/mine", requireAuth, async (req, res) => {
    const ms = await TermMembership.find({ userId: req.user!.id }).sort({
        createdAt: -1,
    });
    const termIds = ms.map((m) => m.termId);
    const terms = await Term.find({ _id: { $in: termIds } }).select(
        "_id name code isActive createdAt updatedAt",
    );
    const payload = ms.map((m) => {
        const t = terms.find((tt) => String(tt._id) === String(m.termId))!;
        return {
            termId: t._id,
            name: t.name,
            code: t.code,
            active: t.isActive,
            role: m.role,
            joinedAt: m.joinedAt,
        };
    });
    res.json({ items: payload });
});

const joinSchema = z.object({ code: z.string().min(6) });

router.post("/join", requireAuth, async (req, res) => {
    const parsed = joinSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());

    const code = parsed.data.code.toLowerCase();
    const hash = crypto.createHash("sha256").update(code).digest("hex");

    const term = await Term.findOne({
        inviteCodeHash: hash,
        code: { $exists: true },
    });
    if (!term) return res.status(404).json({ error: "invalid_code" });
    if (term.inviteExpiresAt && term.inviteExpiresAt.getTime() < Date.now())
        return res.status(410).json({ error: "expired" });
    if (term.inviteMaxUses && (term.inviteUses || 0) >= term.inviteMaxUses)
        return res.status(409).json({ error: "limit_reached" });

    const exists = await TermMembership.findOne({
        termId: term._id,
        userId: req.user!.id,
    });
    if (!exists) {
        await TermMembership.create({
            termId: term._id,
            userId: req.user!.id,
            role: "Member",
        });
    }

    await Term.updateOne({ _id: term._id }, { $inc: { inviteUses: 1 } });
    res.json({ termId: term._id, code: term.code });
});

router.get("/admin", requireAuth, async (req, res) => {
    const adminMs = await TermMembership.find({
        userId: req.user!.id,
        role: "Admin",
    }).sort({ createdAt: -1 });
    if (adminMs.length === 0) return res.json({ items: [] });

    const termIds = adminMs.map((m) => m.termId);
    const terms = await Term.find({ _id: { $in: termIds } })
        .select("_id name code isActive updatedAt inviteCode")
        .sort({ updatedAt: -1 });

    // Get member counts for each term
    const memberCounts = await TermMembership.aggregate([
        { $match: { termId: { $in: termIds } } },
        { $group: { _id: "$termId", count: { $sum: 1 } } },
    ]);

    const items = terms.map((t) => {
        const countDoc = memberCounts.find(
            (c) => String(c._id) === String(t._id),
        );
        return {
            id: String(t._id),
            name: t.name,
            code: t.code,
            inviteCode: t.inviteCode,
            isActive: !!t.isActive,
            memberCount: countDoc?.count || 0,
        };
    });

    res.json({ items });
});

const patchSchema = z.object({
    name: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
});

router.patch("/:id", requireAuth, async (req, res) => {
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());

    const termId = req.params.id;

    const membership = await TermMembership.findOne({
        termId,
        userId: req.user!.id,
        role: "Admin",
    });
    if (!membership) return res.status(403).json({ error: "forbidden" });

    const update: any = {};
    if (parsed.data.name) update.name = parsed.data.name;
    if (typeof parsed.data.isActive === "boolean")
        update.isActive = parsed.data.isActive;

    if (Object.keys(update).length === 0)
        return res.status(400).json({ error: "no_changes" });

    const updated = await Term.findByIdAndUpdate(
        termId,
        { $set: update },
        { new: true },
    ).select("_id name code isActive");
    if (!updated) return res.status(404).json({ error: "not_found" });

    res.json({
        id: updated._id,
        name: updated.name,
        code: updated.code,
        isActive: !!updated.isActive,
    });
});

export default router;
