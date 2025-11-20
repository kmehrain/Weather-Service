// src/app.ts

import express from "express";
import weatherRoute from "./routes/weatherRoute";
import { rateLimiter } from "./middleware/rateLimiter";
import logger from "./logger";

const app = express();

// Simple health endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// --- ADDED: apply rate limiter to all routes (or you can do only /weather) ---
app.use(rateLimiter);
// ------------------------------------------------------------------------------

// Our main weather endpoint
app.use("/weather", weatherRoute);

// ----- 404 handler -----
app.use((req, res) => {
  logger.warn("Route not found", { method: req.method, url: req.url });

  return res.status(404).json({
    error: "Route not found. Please use /weather?lat=...&lon=..."
  });
});

export default app;
