import { Router } from "express";
import { z } from "zod";
import {
    requireAuth,
    requireTermMember,
    requireTermRole,
} from "../middleware/authz";
import { PNM } from "../models/PNM";
import { config } from "../config/env";

const router = Router();

router.get(
    "/terms/:termId/pnms",
    requireAuth,
    requireTermMember,
    async (req, res) => {
        const {
            q = "",
            status,
            year,
            sort = "-aggregate.avgScore,-aggregate.countRatings,-updatedAt",
            page = "1",
            limit = "50",
        } = req.query as Record<string, string>;
        const filter: any = { termId: req.params.termId };
        if (status) filter.status = status;
        if (year) filter.classYear = Number(year);
        if (q) {
            const rx = new RegExp(String(q), "i");
            filter.$or = [
                { firstName: rx },
                { lastName: rx },
                { preferredName: rx },
                { major: rx },
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const items = await PNM.find(filter)
            .sort(sort.split(",").join(" "))
            .skip(skip)
            .limit(Number(limit));
        res.json({ items });
    }
);

const createSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    preferredName: z.string().optional(),
    classYear: z.number().int().optional(),
    major: z.string().optional(),
    gpa: z.number().min(0).max(4).optional(),
    phone: z.string().optional(),
    status: z.enum(["new", "invited", "bid", "declined"]).optional(),
});

router.post(
    "/terms/:termId/pnms",
    requireAuth,
    requireTermMember,
    requireTermRole("Admin", "Adder"),
    async (req, res) => {
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json(parsed.error.flatten());
        const doc = await PNM.create({
            ...parsed.data,
            termId: req.params.termId,
        });
        res.json(doc);
    }
);

const patchSchema = createSchema.partial();

router.patch("/pnms/:id", requireAuth, async (req, res) => {
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const doc = await PNM.findByIdAndUpdate(req.params.id, parsed.data, {
        new: true,
    });
    if (!doc) return res.status(404).end();
    res.json(doc);
});

const attachSchema = z.object({ key: z.string().min(1) });

router.post("/pnms/:id/photo/attach", requireAuth, async (req, res) => {
    const parsed = attachSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const photoURL = `${config.S3_PUBLIC_URL_BASE}/${parsed.data.key}`;
    const doc = await PNM.findByIdAndUpdate(
        req.params.id,
        { photoURL },
        { new: true }
    );
    if (!doc) return res.status(404).end();
    res.json({ photoURL });
});

router.delete("/pnms/:id", requireAuth, async (req, res) => {
    await PNM.findByIdAndDelete(req.params.id);
    res.status(204).end();
});

export default router;