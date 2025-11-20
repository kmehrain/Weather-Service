// src/routes/weatherRoute.ts

import { Router, Request, Response } from "express";
import axios from "axios";
import { getTodayForecastPeriod } from "../services/nwsClient";
import { classifyTemperatureF } from "../services/tempClassifier";
import logger from "../logger";

const router = Router();

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
  const lat = parseFloat(String(req.query.lat));
  const lon = parseFloat(String(req.query.lon));

  // 1) basic numeric validation
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json({
      error: "Query parameters 'lat' and 'lon' are required and must be numbers."
    });
  }

  // 2) range validation (valid lat/lon for Earth)
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return res.status(400).json({
      error: "Latitude must be between -90 and 90, and longitude between -180 and 180."
    });
  }

  try {
    const today = await getTodayForecastPeriod(lat, lon);

    const temperature = today.temperature;
    const unit = today.temperatureUnit;

    const category =
      unit.toUpperCase() === "F"
        ? classifyTemperatureF(temperature)
        : classifyTemperatureF(temperature); // TODO: convert C->F if needed

    return res.json({
      lat,
      lon,
      shortForecast: today.shortForecast,
      temperature: {
        value: temperature,
        unit
      },
      category
    });
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      logger.error("NWS axios error in /weather handler", {
        message: err.message,
        code: err.code,
        status: err.response?.status,
        dataPreview: err.response?.data
          ? JSON.stringify(err.response.data).slice(0, 400)
          : undefined
      });
    } else {
      logger.error("Unexpected error in /weather handler", { err });
    }

    return res.status(502).json({
      error: "Failed to fetch forecast from National Weather Service."
    });
  }
});

export default router;
