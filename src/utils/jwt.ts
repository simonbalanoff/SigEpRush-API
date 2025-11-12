import jwt from "jsonwebtoken";
import { config } from "../config/env";

type Role = "Admin" | "Adder" | "Member";

export function signToken(
    sub: string,
    email: string,
    name: string,
    role: Role
) {
    return jwt.sign({ email, name, role }, config.JWT_SECRET, {
        subject: sub,
        expiresIn: "7d",
    });
}

export function verifyToken(token: string) {
    return jwt.verify(token, config.JWT_SECRET) as {
        sub: string;
        email: string;
        name: string;
        role: Role;
    };
}