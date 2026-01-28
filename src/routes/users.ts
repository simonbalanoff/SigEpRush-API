import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { requireAuth } from "../middleware/authz";

const router = Router();

const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.user || req.user.role !== "Admin") {
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
};

router.get("/", requireAuth, requireAdmin, async (req, res) => {
    const q = (req.query.q as string) || "";
    
    let query: any = {};
    if (q.trim()) {
        const regex = new RegExp(q.trim(), "i");
        query = {
            $or: [
                { name: regex },
                { email: regex },
                { role: regex }
            ]
        };
    }
    
    const users = await User.find(query)
        .select("_id name email role isActive createdAt")
        .sort({ name: 1 })
        .limit(100);
    
    const items = users.map(u => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
    }));
    
    res.json({ items });
});

const updateRoleSchema = z.object({
    role: z.enum(["Admin", "Adder", "Member"])
});

router.patch("/:userId/role", requireAuth, requireAdmin, async (req, res) => {
    const { userId } = req.params;
    const parsed = updateRoleSchema.safeParse(req.body);
    
    if (!parsed.success) {
        return res.status(400).json(parsed.error.flatten());
    }

    if (userId === req.user!.id && req.user!.role === "Admin" && parsed.data.role !== "Admin") {
        return res.status(400).json({ error: "Cannot remove your own admin privileges" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    
    user.role = parsed.data.role;
    await user.save();
    
    res.json({
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
    });
});

router.delete("/me", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    
    if (user.role === "Admin") {
        const adminCount = await User.countDocuments({ role: "Admin", isActive: true });
        if (adminCount <= 1) {
            return res.status(400).json({ 
                error: "Cannot delete account. You are the last admin. Please assign another admin first." 
            });
        }
    }
    
    user.isActive = false;
    await user.save();
    
    res.json({ success: true, message: "Account deleted successfully" });
});

export default router;