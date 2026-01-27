import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRouter from "./routes/auth";
import termsRouter from "./routes/terms";
import membershipsRouter from "./routes/memberships";
import pnmsRouter from "./routes/pnms";
import ratingsRouter from "./routes/ratings";
import uploadsRouter from "./routes/uploads";
import reactionsRouter from "./routes/reactions";

const app = express();
app.use(cors());
app.use(express.json({ limit: "8mb" }));
app.use(morgan("dev"));

app.get('/', (req, res) => res.send(200));
app.use("/auth", authRouter);
app.use("/terms", termsRouter);
app.use("/memberships", membershipsRouter);
app.use(pnmsRouter);
app.use(ratingsRouter);
app.use(uploadsRouter);
app.use(reactionsRouter);

export default app;