import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/authz";
import { presignUpload } from "../services/storage";

const router = Router();

const bodySchema = z.object({
    contentType: z.string().min(1),
    key: z.string().min(1).optional(),
    maxBytes: z.number().int().positive().optional(),
});

router.post("/uploads/presign", requireAuth, async (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    try {
        const data = await presignUpload(parsed.data);
        res.json(data);
    } catch {
        res.status(400).json({ error: "presign_failed" });
    }
});

export default router;