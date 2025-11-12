import { Schema, model } from "mongoose";

const ReactionSchema = new Schema(
    {
        ratingId: {
            type: Schema.Types.ObjectId,
            ref: "Rating",
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        emoji: { type: String, required: true },
    },
    { timestamps: true }
);

ReactionSchema.index({ ratingId: 1, userId: 1, emoji: 1 }, { unique: true });

export type ReactionDoc = {
    _id: any;
    ratingId: any;
    userId: any;
    emoji: string;
};

export const Reaction = model<ReactionDoc>("Reaction", ReactionSchema);