import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { hashPassword, verifyPassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { config } from "../config/env";
import { AuthedRequest, requireAuth, requireRole } from "../middleware/authz";

const router = Router();

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(5),
});

const inviteSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["Admin", "Adder", "Member"]),
});

router.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    console.log(parsed)
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const { email, password } = parsed.data;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "invalid" });
    const ok = verifyPassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "invalid" });
    user.lastLoginAt = new Date();
    await user.save();
    const token = signToken(String(user._id), user.email, user.name, user.role);
    res.json({
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    });
});

router.post("/invite", requireAuth, requireRole("Admin"), async (req: AuthedRequest, res) => {
    const parsed = inviteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const exists = await User.findOne({ email: parsed.data.email });
    if (exists) return res.status(409).json({ error: "exists" });
    const doc = await User.create({
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: hashPassword(parsed.data.password),
        role: parsed.data.role,
    });
    res.json({ id: doc._id });
});

export default router;