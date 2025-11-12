import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRouter from "./routes/auth";
import pnmsRouter from "./routes/pnms";
import ratingsRouter from "./routes/ratings";
import uploadsRouter from "./routes/uploads";

const app = express();
app.use(cors());
app.use(express.json({ limit: "8mb" }));
app.use(morgan("dev"));
app.use("/auth", authRouter);
app.use(pnmsRouter);
app.use(ratingsRouter);
app.use(uploadsRouter);
app.get('/health', (req, res) => res.json({"ok": true}))
export default app;