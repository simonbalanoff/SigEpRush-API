import { Request, Response, NextFunction } from "express";
import { TermMembership } from "../models/TermMembership";

export async function withMembership(
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