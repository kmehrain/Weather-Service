// src/routes/weatherRoute.ts

import { Router, Request, Response } from "express";
import { getTodayForecastPeriod } from "../services/nwsClient";
import { classifyTemperatureF } from "../services/tempClassifier";
import axios from "axios";

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

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json({
      error: "Query parameters 'lat' and 'lon' are required and must be numbers."
    });
  }

  try {
    const today = await getTodayForecastPeriod(lat, lon);

    const temperature = today.temperature;
    const unit = today.temperatureUnit;

    // For now we assume NWS gives Fahrenheit (it usually does for US units)
    // but you could convert if needed.
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
            console.error("NWS axios error:", {
                message: err.message,
                code: err.code,
                status: err.response?.status,
                data: err.response?.data
            });
        } else {
            console.error("Unexpected error:", err);
        }

        return res.status(502).json({
            error: "Failed to fetch forecast from National Weather Service."
        });
    }
});

export default router;
