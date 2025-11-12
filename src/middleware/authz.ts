import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

type Role = "Admin" | "Adder" | "Member";

type User = {
    id: string;
    role: Role;
    email: string;
    name: string;
};

export type AuthedRequest = Request & { user?: User };

export function requireAuth(
    req: AuthedRequest,
    res: Response,
    next: NextFunction
) {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (!token) return res.status(401).json({ error: "unauthorized" });
    try {
        const payload = verifyToken(token) as {
            sub: string;
            role: Role;
            email: string;
            name: string;
        };
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

export function requireRole(...roles: Role[]) {
    return (req: AuthedRequest, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ error: "unauthorized" });
        if (!roles.includes(req.user.role))
            return res.status(403).json({ error: "forbidden" });
        next();
    };
}
