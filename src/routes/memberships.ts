import { Router } from "express";
import { z } from "zod";
import {
    requireAuth,
    requireTermMember,
    requireTermRole,
} from "../middleware/authz";
import { TermMembership } from "../models/TermMembership";

const router = Router();

router.get(
    "/:termId/members",
    requireAuth,
    requireTermMember,
    requireTermRole("Admin"),
    async (req, res) => {
        const rows = await TermMembership.find({
            termId: req.params.termId,
        }).populate("userId", "name email");
        res.json({
            items: rows.map((r) => ({
                userId: r.userId,
                role: r.role,
                joinedAt: r.joinedAt,
            })),
        });
    }
);

const roleSchema = z.object({
    userId: z.string().min(1),
    role: z.enum(["Admin", "Adder", "Member"]),
});

router.patch(
    "/:termId/members/role",
    requireAuth,
    requireTermMember,
    requireTermRole("Admin"),
    async (req, res) => {
        const parsed = roleSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json(parsed.error.flatten());
        const r = await TermMembership.findOneAndUpdate(
            { termId: req.params.termId, userId: parsed.data.userId },
            { role: parsed.data.role },
            { new: true }
        );
        if (!r) return res.status(404).end();
        res.json({ ok: true });
    }
);

export default router;