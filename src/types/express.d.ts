import "express-serve-static-core";
import type { Role } from "./auth";

declare module "express-serve-static-core" {
    interface Request {
        user?: {
            id: string;
            role: Role;
            email: string;
            name: string;
        };
    }
}