import jwt from "jsonwebtoken";
import { config } from "../config/env";

export function signToken(sub: string, email: string, name: string) {
    return jwt.sign({ email, name }, config.JWT_SECRET, {
        subject: sub,
        expiresIn: "7d",
    });
}
export function verifyToken(token: string) {
    return jwt.verify(token, config.JWT_SECRET) as {
        sub: string;
        email: string;
        name: string;
    };
}
