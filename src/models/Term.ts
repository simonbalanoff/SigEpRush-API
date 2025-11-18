import { Schema, model } from "mongoose";

const TermSchema = new Schema(
    {
        name: { type: String, required: true },
        code: { type: String, required: true, unique: true, index: true },
        isActive: { type: Boolean, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        inviteCodeHash: String,
        inviteCode: String, // Admin only
        inviteExpiresAt: Date,
        inviteMaxUses: Number,
        inviteUses: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export type TermDoc = {
    _id: any;
    name: string;
    code: string;
    isActive: boolean;
    createdBy: any;
    inviteCodeHash?: string;
    inviteCode?: string;
    inviteExpiresAt?: Date;
    inviteMaxUses?: number;
    inviteUses: number;
};

export const Term = model<TermDoc>("Term", TermSchema);
