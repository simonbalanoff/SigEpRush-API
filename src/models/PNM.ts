import { Schema, model } from "mongoose";

const PNMSchema = new Schema(
    {
        termId: {
            type: Schema.Types.ObjectId,
            ref: "Term",
            required: true,
            index: true,
        },
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        preferredName: String,
        classYear: Number,
        major: String,
        gpa: { type: Number, min: 0, max: 4 },
        phone: String,
        photoURL: String,
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

PNMSchema.index({ termId: 1, lastName: 1, firstName: 1 });

export type PNMDoc = {
    _id: any;
    termId: any;
    firstName: string;
    lastName: string;
    preferredName?: string;
    classYear?: number;
    major?: string;
    gpa?: number;
    phone?: string;
    photoURL?: string;
    status: "new" | "invited" | "bid" | "declined";
    aggregate?: {
        avgScore: number;
        distScore: Record<string, number>;
        countRatings: number;
        lastRatedAt: Date;
    };
};

/*
struct PNMCreate: Encodable {
    let firstName: String
    let lastName: String
    let preferredName: String?
    let classYear: Int?
    let major: String?
    let gpa: Double?
    let phone: String?
    let status: String?
}
*/

export const PNM = model<PNMDoc>("PNM", PNMSchema);