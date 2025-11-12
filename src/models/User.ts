import { Schema, model } from "mongoose";

type Role = "Admin" | "Adder" | "Member";

const UserSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            index: true,
            trim: true,
        },
        passwordHash: { type: String, required: true },
        role: {
            type: String,
            enum: ["Admin", "Adder", "Member"],
            required: true,
        },
        isActive: { type: Boolean, default: true },
        lastLoginAt: Date,
    },
    { timestamps: true }
);

export type UserDoc = {
    _id: any;
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
    isActive: boolean;
    lastLoginAt?: Date;
};

export const User = model<UserDoc>("User", UserSchema);