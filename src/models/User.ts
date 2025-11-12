import { Schema, model } from "mongoose";

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
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export type UserDoc = {
    _id: any;
    name: string;
    email: string;
    passwordHash: string;
    isActive: boolean;
};

export const User = model<UserDoc>("User", UserSchema);