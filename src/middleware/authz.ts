import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { TermMembership } from "../models/TermMembership";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (!token) return res.status(401).json({ error: "unauthorized" });
    try {
        const payload = verifyToken(token);
        req.user = {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            role: payload.role
        };
        next();
    } catch {
        res.status(401).json({ error: "unauthorized" });
    }
}

export async function requireTermMember(
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (!req.user) return res.status(401).json({ error: "unauthorized" });
    const termId = (req.params.termId ||
        req.query.term ||
        req.body.termId) as string;
    if (!termId) return res.status(400).json({ error: "term_required" });
    const m = await TermMembership.findOne({ termId, userId: req.user.id });
    if (!m) return res.status(403).json({ error: "not_a_member" });
    req.membership = { termId, role: m.role as any };
    next();
}

export function requireTermRole(...roles: Array<"Admin" | "Adder" | "Member">) {
    return (req: any, res: any, next: any) => {
        if (!req.membership)
            return res.status(401).json({ error: "unauthorized" });
        if (!roles.includes(req.membership.role))
            return res.status(403).json({ error: "forbidden" });
        next();
    };
}