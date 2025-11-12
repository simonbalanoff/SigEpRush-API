import { Schema, model, InferSchemaType, HydratedDocument } from "mongoose";

const RatingSchema = new Schema(
    {
        termId: {
            type: Schema.Types.ObjectId,
            ref: "Term",
            required: true,
            index: true,
        },
        pnmId: {
            type: Schema.Types.ObjectId,
            ref: "PNM",
            required: true,
            index: true,
        },
        raterId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        score: { type: Number, min: 0, max: 10, required: true },
        comment: { type: String, maxlength: 500 },
        reactions: { type: Map, of: Number, default: {} },
        isHidden: { type: Boolean, default: false },
    },
    { timestamps: true }
);

RatingSchema.index({ termId: 1, pnmId: 1, raterId: 1 }, { unique: true });
RatingSchema.index({ termId: 1, pnmId: 1, updatedAt: -1 });

type RatingSchemaType = InferSchemaType<typeof RatingSchema>;
export type RatingDoc = HydratedDocument<RatingSchemaType>;

export const Rating = model<RatingDoc>("Rating", RatingSchema);