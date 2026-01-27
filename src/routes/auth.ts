import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { verifyPassword, hashPassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { requireAuth } from "../middleware/authz";

const router = Router();

// Hardcoded invitation code - change this to whatever you want
const VALID_INVITATION_CODE = "SIGEP@CSU";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(5),
});

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1).max(100),
    invitationCode: z.string().min(1),
});

router.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const u = await User.findOne({ email: parsed.data.email });
    if (!u) return res.status(401).json({ error: "invalid" });
    const ok = verifyPassword(parsed.data.password, u.passwordHash);
    if (!ok) return res.status(401).json({ error: "invalid" });
    const token = signToken(String(u._id), u.email, u.name, u.role);
    res.json({ token, user: { id: u._id, name: u.name, email: u.email, role: u.role } });
});

router.post("/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());

    if (parsed.data.invitationCode !== VALID_INVITATION_CODE) {
        return res.status(403).json({ error: "Invalid invitation code" });
    }

    const existing = await User.findOne({ email: parsed.data.email });
    if (existing) {
        return res.status(409).json({ error: "User with this email already exists" });
    }

    const passwordHash = hashPassword(parsed.data.password);

    const newUser = await User.create({
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: "Member",
        isActive: true,
    });

    const token = signToken(String(newUser._id), newUser.email, newUser.name, newUser.role);
    res.json({ 
        token, 
        user: { 
            id: newUser._id, 
            name: newUser.name, 
            email: newUser.email, 
            role: newUser.role 
        } 
    });
});

router.get("/me", requireAuth, async (req, res) => {
    const u = await User.findById(req.user!.id);
    if (!u) return res.status(404).json({ error: "not_found" });

    res.json({
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role
    });
});

export default router;