export type Role = "Admin" | "Adder" | "Member";

export interface UserPayload {
    sub: string;
    role: Role;
    email: string;
    name: string;
}