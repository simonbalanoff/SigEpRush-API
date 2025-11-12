import "express";

declare module "express-serve-static-core" {
    interface Request {
        user?: {
            id: string;
            role: "Admin" | "Adder" | "Member";
            email: string;
            name: string;
        };
    }
}
