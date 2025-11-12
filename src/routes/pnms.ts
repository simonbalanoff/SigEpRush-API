import { Router } from "express";
import { z } from "zod";
import { PNM } from "../models/PNM";
import { AuthedRequest, requireAuth, requireRole } from "../middleware/authz";
import { config } from "../config/env";
import { deleteObject } from "../services/storage";

const router = Router();

const upsertSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    preferredName: z.string().optional(),
    classYear: z.number().int().optional(),
    major: z.string().optional(),
    gpa: z.number().min(0).max(4).optional(),
    phone: z.string().optional(),
    photoURL: z.string().url().optional(),
    status: z.enum(["new", "invited", "bid", "declined"]).optional(),
});

router.post(
    "/pnms",
    requireAuth,
    requireRole("Admin", "Adder"),
    async (req: AuthedRequest, res) => {
        const parsed = upsertSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json(parsed.error.flatten());
        const doc = await PNM.create(parsed.data);
        res.json(doc);
    }
);

router.patch(
    "/pnms/:id",
    requireAuth,
    requireRole("Admin", "Adder"),
    async (req: AuthedRequest, res) => {
        const parsed = upsertSchema.partial().safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json(parsed.error.flatten());
        const doc = await PNM.findByIdAndUpdate(req.params.id, parsed.data, {
            new: true,
        });
        if (!doc) return res.status(404).end();
        res.json(doc);
    }
);

router.get("/pnms", requireAuth, async (req: AuthedRequest, res) => {
    const {
        q = "",
        status,
        year,
        sort = "-aggregate.avgScore,-aggregate.countRatings,-updatedAt",
        page = "1",
        limit = "50",
    } = req.query as Record<string, string>;
    const filter: any = {};
    if (status) filter.status = status;
    if (year) filter.classYear = Number(year);
    if (q) {
        const rx = new RegExp(q, "i");
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
});

router.get("/pnms/:id", requireAuth, async (req: AuthedRequest, res) => {
    const doc = await PNM.findById(req.params.id);
    if (!doc) return res.status(404).end();
    res.json(doc);
});

router.delete(
    "/pnms/:id",
    requireAuth,
    requireRole("Admin"),
    async (req: AuthedRequest, res) => {
        await PNM.findByIdAndDelete(req.params.id);
        res.status(204).end();
    }
);

const attachSchema = z.object({ key: z.string().min(1) });

router.post(
    "/pnms/:id/photo/attach",
    requireAuth,
    requireRole("Admin", "Adder"),
    async (req: AuthedRequest, res) => {
        const parsed = attachSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json(parsed.error.flatten());
        const pnm = await PNM.findById(req.params.id);
        if (!pnm) return res.status(404).end();
        const newKey = parsed.data.key;
        const newURL = `${config.S3_PUBLIC_URL_BASE}/${newKey}`;
        const oldKey = pnm.photoKey;
        pnm.photoKey = newKey;
        pnm.photoURL = newURL;
        await pnm.save();
        if (oldKey && oldKey !== newKey) {
            try {
                await deleteObject(oldKey);
            } catch {}
        }
        res.json({ photoURL: newURL });
    }
);

export default router;
