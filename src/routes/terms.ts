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
    const t = await Term.create({
        name: parsed.data.name,
        code: parsed.data.code.toLowerCase(),
        isActive: true,
        createdBy: req.user!.id,
        inviteCodeHash: hash,
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
    res.json({ id: t._id, code: t.code });
});

router.get("/mine", requireAuth, async (req, res) => {
    const ms = await TermMembership.find({ userId: req.user!.id }).sort({
        createdAt: -1,
    });
    const termIds = ms.map((m) => m.termId);
    const terms = await Term.find({ _id: { $in: termIds } }).select(
        "_id name code isActive createdAt updatedAt"
    );
    const payload = ms.map((m) => {
        const t = terms.find((tt) => String(tt._id) === String(m.termId))!;
        return {
            termId: t._id,
            name: t.name,
            code: t.code,
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
    if (!exists)
        await TermMembership.create({
            termId: term._id,
            userId: req.user!.id,
            role: "Member",
        });
    await Term.updateOne({ _id: term._id }, { $inc: { inviteUses: 1 } });
    res.json({ termId: term._id, code: term.code });
});

export default router;