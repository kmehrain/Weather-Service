// src/middleware/rateLimiter.ts
// Very simple in-memory rate limiter per IP. Not production-grade (no clustering, no persistence).

import { Request, Response, NextFunction } from "express";

interface Counter {
  count: number;
  resetAt: number;
}

const windowMs = 60 * 1000;      // 1 minute
const maxRequests = 60;          // 60 requests per minute per IP (tweak as needed)

const buckets = new Map<string, Counter>();

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const now = Date.now();

  let entry = buckets.get(ip);
  if (!entry || now > entry.resetAt) {
    // Start new window
    entry = { count: 0, resetAt: now + windowMs };
    buckets.set(ip, entry);
  }

  entry.count += 1;

  if (entry.count > maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader("Retry-After", retryAfterSeconds.toString());
    return res.status(429).json({
      error: "Too many requests. Please try again later."
    });
  }

  return next();
}
