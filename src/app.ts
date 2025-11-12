import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRouter from "./routes/auth.js";
import pnmsRouter from "./routes/pnms.js";
import ratingsRouter from "./routes/ratings.js";
import uploadsRouter from "./routes/uploads.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "8mb" }));
app.use(morgan("dev"));
app.use("/auth", authRouter);
app.use(pnmsRouter);
app.use(ratingsRouter);
app.use(uploadsRouter);
export default app;