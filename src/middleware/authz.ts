import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (!token) return res.status(401).json({ error: "unauthorized" });
    try {
        const payload = verifyToken(token);
        req.user = {
            id: payload.sub,
            role: payload.role,
            email: payload.email,
            name: payload.name,
        };
        next();
    } catch {
        res.status(401).json({ error: "unauthorized" });
    }
}

export function requireRole(...roles: Array<"Admin" | "Adder" | "Member">) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ error: "unauthorized" });
        if (!roles.includes(req.user.role))
            return res.status(403).json({ error: "forbidden" });
        next();
    };
}