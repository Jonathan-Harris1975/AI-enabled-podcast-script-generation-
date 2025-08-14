import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { logger } from "./utils/logger.js";

const PORT = Number(process.env.PORT || 3000);

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, `API listening on port ${PORT}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.warn({ signal }, "Shutting down…");
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
  setTimeout(() => {
    logger.error("Forced shutdown");
    process.exit(1);
  }, 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
