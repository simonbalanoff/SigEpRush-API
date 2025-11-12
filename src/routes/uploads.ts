import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/authz.js";
import { presignUpload } from "../services/storage.js";

const router = Router();

const bodySchema = z.object({
    contentType: z.string().min(1),
    prefix: z.string().optional(),
    maxBytes: z.number().int().positive().optional(),
});

router.post("/uploads/presign", requireAuth, async (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    try {
        const data = await presignUpload(parsed.data);
        res.json(data);
    } catch (e) {
        res.status(400).json({ error: "presign_failed" });
    }
});

export default router;