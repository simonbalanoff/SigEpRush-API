import { Schema, model } from "mongoose";

const PNMSchema = new Schema(
    {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        preferredName: String,
        classYear: Number,
        major: String,
        gpa: { type: Number, min: 0, max: 4 },
        phone: String,
        photoURL: String,
        photoKey: String,
        tags: [String],
        status: {
            type: String,
            enum: ["new", "invited", "bid", "declined"],
            default: "new",
        },
        aggregate: {
            avgScore: Number,
            distScore: { type: Map, of: Number },
            countRatings: Number,
            lastRatedAt: Date,
        },
    },
    { timestamps: true }
);

PNMSchema.index({ lastName: 1, firstName: 1 });

export type PNMDoc = {
    _id: any;
    firstName: string;
    lastName: string;
    preferredName?: string;
    classYear?: number;
    major?: string;
    gpa?: number;
    phone?: string;
    photoURL?: string;
    photoKey?: string;
    tags?: string[];
    status: "new" | "invited" | "bid" | "declined";
    aggregate?: {
        avgScore: number;
        distScore: Record<string, number>;
        countRatings: number;
        lastRatedAt: Date;
    };
};

export const PNM = model<PNMDoc>("PNM", PNMSchema);