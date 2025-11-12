import dotenv from "dotenv";
dotenv.config();

function required(name: string) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env ${name}`);
    return v;
}

export const config = {
    PORT: parseInt(process.env.PORT || "4000"),
    MONGODB_URI: required("MONGODB_URI"),
    JWT_SECRET: required("JWT_SECRET"),
    ADMIN_SEED_EMAIL: process.env.ADMIN_SEED_EMAIL,
    ADMIN_SEED_PASSWORD: process.env.ADMIN_SEED_PASSWORD,
    S3_BUCKET: required("S3_BUCKET"),
    S3_REGION: required("S3_REGION"),
    S3_ACCESS_KEY: required("S3_ACCESS_KEY"),
    S3_SECRET_KEY: required("S3_SECRET_KEY"),
    S3_PUBLIC_URL_BASE: required("S3_PUBLIC_URL_BASE"),
};