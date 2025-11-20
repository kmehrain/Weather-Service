// src/logger.ts

import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }), // include stack traces
    format.json()
  ),
  transports: [
    // For this assignment, just log to console
    new transports.Console()
  ]
});

export default logger;
