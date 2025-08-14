import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import morgan from "morgan";

import { router as apiRouter } from "./routes/index.js";
import { logger } from "./utils/logger.js";

const app = express();

// Core middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

// Logs
app.use(pinoHttp({ logger }));
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Basic rate limiter (per IP)
const limiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Mount API
app.use("/", apiRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

// Error handler (last)
app.use((err, req, res, _next) => {
  logger.error({ err }, "Unhandled error");
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal Server Error",
    code: err.code || "internal_error"
  });
});

export default app;
