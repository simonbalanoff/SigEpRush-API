import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import crypto from "crypto";
import { config } from "../config/env";

type PresignInput = { contentType: string; key?: string; maxBytes?: number };

const s3 = new S3Client({
    region: config.S3_REGION,
    credentials: {
        accessKeyId: config.S3_ACCESS_KEY,
        secretAccessKey: config.S3_SECRET_KEY,
    },
});

export async function presignUpload({
    contentType,
    key,
    maxBytes = 5 * 1024 * 1024,
}: PresignInput) {
    if (!contentType.startsWith("image/"))
        throw new Error("invalid content type");
    const k = key ?? `pnm/${Date.now()}-${crypto.randomUUID()}`;
    const result = await createPresignedPost(s3, {
        Bucket: config.S3_BUCKET,
        Key: k,
        Conditions: [
            ["content-length-range", 1, maxBytes],
            ["starts-with", "$Content-Type", contentType.split(";")[0]],
        ],
        Fields: { "Content-Type": contentType.split(";")[0] },
        Expires: 300,
    });
    const publicUrl = `${config.S3_PUBLIC_URL_BASE}/${k}`;
    return { key: k, url: result.url, fields: result.fields, publicUrl };
}

export async function deleteObject(key: string) {
    await s3.send(
        new DeleteObjectCommand({ Bucket: config.S3_BUCKET, Key: key })
    );
}