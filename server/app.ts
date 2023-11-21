import express from "express";
require("dotenv").config();
export const app = express();
import cors from "cors";
import { ErrorMiddleware } from "./Middleware/error";
import userRouter from "./routes/user.routes";
import cookieParser from "cookie-parser";
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.ORIGIN || "http://localhost:3000",
  })
);
app.use("/api/v1", userRouter);

app.all("*", (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl} not found`) as any;
  error.statusCode = 404;
  next(error);
});
app.use(ErrorMiddleware);
