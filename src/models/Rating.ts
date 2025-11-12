import { Schema, model, Types } from "mongoose";

const RatingSchema = new Schema(
    {
        pnmId: {
            type: Types.ObjectId,
            ref: "PNM",
            required: true,
            index: true,
        },
        raterId: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        score: { type: Number, min: 0, max: 10, required: true },
        comment: { type: String, maxlength: 500 },
    },
    { timestamps: true }
);

RatingSchema.index({ pnmId: 1, raterId: 1 }, { unique: true });

export type RatingDoc = {
    _id: any;
    pnmId: any;
    raterId: any;
    score: number;
    comment?: string;
};

export const Rating = model<RatingDoc>("Rating", RatingSchema);