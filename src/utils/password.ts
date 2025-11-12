import bcrypt from "bcryptjs";

export function hashPassword(p: string) {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(p, salt);
}

export function verifyPassword(p: string, hash: string) {
    return bcrypt.compareSync(p, hash);
}