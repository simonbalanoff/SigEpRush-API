import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { verifyPassword } from "../utils/password";
import { signToken } from "../utils/jwt";

const router = Router();

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

router.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const u = await User.findOne({ email: parsed.data.email });
    if (!u) return res.status(401).json({ error: "invalid" });
    const ok = verifyPassword(parsed.data.password, u.passwordHash);
    if (!ok) return res.status(401).json({ error: "invalid" });
    const token = signToken(String(u._id), u.email, u.name);
    res.json({ token, user: { id: u._id, name: u.name, email: u.email } });
});

export default router;