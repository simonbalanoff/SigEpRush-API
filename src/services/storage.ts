import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import crypto from "crypto";
import { config } from "../config/env.js";

type PresignInput = {
    contentType: string;
    prefix?: string;
    maxBytes?: number;
};

const s3 = new S3Client({
    region: config.S3_REGION,
    credentials: {
        accessKeyId: config.S3_ACCESS_KEY,
        secretAccessKey: config.S3_SECRET_KEY,
    },
});

export async function presignUpload({
    contentType,
    prefix = "pnm",
    maxBytes = 5 * 1024 * 1024,
}: PresignInput) {
    if (!contentType.startsWith("image/"))
        throw new Error("invalid content type");
    const key = `${prefix}/${Date.now()}-${crypto.randomUUID()}`;
    const result = await createPresignedPost(s3, {
        Bucket: config.S3_BUCKET,
        Key: key,
        Conditions: [
            ["content-length-range", 1, maxBytes],
            ["starts-with", "$Content-Type", contentType.split(";")[0]],
        ],
        Fields: {
            "Content-Type": contentType.split(";")[0],
        },
        Expires: 300,
    });
    const publicUrl = `${config.S3_PUBLIC_URL_BASE}/${key}`;
    return { key, url: result.url, fields: result.fields, publicUrl };
}