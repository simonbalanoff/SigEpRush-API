import { Schema, model } from "mongoose";

const TermMembershipSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        termId: {
            type: Schema.Types.ObjectId,
            ref: "Term",
            required: true,
            index: true,
        },
        role: {
            type: String,
            enum: ["Admin", "Adder", "Member"],
            required: true,
        },
        joinedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

TermMembershipSchema.index({ userId: 1, termId: 1 }, { unique: true });

export type TermMembershipDoc = {
    _id: any;
    userId: any;
    termId: any;
    role: "Admin" | "Adder" | "Member";
    joinedAt: Date;
};

export const TermMembership = model<TermMembershipDoc>(
    "TermMembership",
    TermMembershipSchema
);