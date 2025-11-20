// src/routes/weatherRoute.ts

import { Router, Request, Response } from "express";
import { z } from "zod";
import logger from "../logger";
import { WeatherService } from "../services/weatherService";

const router = Router();
const weatherService = new WeatherService();

// Shared error strings so tests & behavior stay stable
const INVALID_COORDS_ERROR_MSG =
  "Query parameters 'lat' and 'lon' are required and must be numbers.";
const OUT_OF_RANGE_ERROR_MSG =
  "Latitude must be between -90 and 90, and longitude between -180 and 180.";

// Zod schema for query validation (lat/lon exist & are numeric)
const weatherQuerySchema = z.object({
  lat: z
    .string()
    .transform((v) => parseFloat(v))
    .refine((v) => !Number.isNaN(v), { message: "lat must be a number" }),
  lon: z
    .string()
    .transform((v) => parseFloat(v))
    .refine((v) => !Number.isNaN(v), { message: "lon must be a number" })
});

/**
 * GET /weather?lat=...&lon=...
 *
 * Returns:
 * {
 *   lat: number,
 *   lon: number,
 *   shortForecast: string,
 *   temperature: { value: number, unit: string },
 *   category: "hot" | "cold" | "moderate"
 * }
 */
router.get("/", async (req: Request, res: Response) => {
  // 1) Shape / type validation with Zod
  const result = weatherQuerySchema.safeParse(req.query);

  if (!result.success) {
    logger.warn("Invalid /weather query params", {
      query: req.query,
      issues: result.error.issues
    });

    return res.status(400).json({
      error: INVALID_COORDS_ERROR_MSG
    });
  }

  const { lat, lon } = result.data;

  // 2) Range validation
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return res.status(400).json({
      error: OUT_OF_RANGE_ERROR_MSG
    });
  }

  try {
    // 3) Delegate to OOP-style service
    const summary = await weatherService.getTodaySummary(lat, lon);

    // summary already has { lat, lon, shortForecast, temperature, category }
    return res.json(summary);
  } catch (err) {
    logger.error("Error in /weather handler", {
      err,
      lat,
      lon
    });

    return res.status(502).json({
      error: "Failed to fetch forecast from National Weather Service."
    });
  }
});

export default router;
