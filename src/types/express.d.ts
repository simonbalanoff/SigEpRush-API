import "express";

declare module "express-serve-static-core" {
    interface Request {
        user?: {
            id: string;
            name: string;
            email: string;
        };
        membership?: {
            termId: string;
            role: "Admin" | "Adder" | "Member";
        };
    }
}