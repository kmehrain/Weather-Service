// src/app.ts

import express from "express";
import weatherRoute from "./routes/weatherRoute";
import { rateLimiter } from "./middleware/rateLimiter";

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

export default app;
