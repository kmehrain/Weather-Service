// src/services/nwsClient.ts

import axios, { AxiosError } from "axios";
import {
  NwsForecastResponse,
  NwsPointsResponse,
  NwsForecastPeriod
} from "../types/nws";
import { SimpleCache } from "./simpleCache";
import logger from "../logger";

const NWS_BASE_URL = "https://api.weather.gov";

// Simple caches for forecast URL and today's forecast period
const pointsCache = new SimpleCache<string>(5 * 60 * 1000); // 5 minutes
const todayForecastCache = new SimpleCache<NwsForecastPeriod>(5 * 60 * 1000);

/**
 * Build User-Agent header for NWS (they require a UA with contact info).
 * You can override via WEATHER_SERVICE_USER_AGENT env var.
 */
function getUserAgent(): string {
  return (
    process.env.WEATHER_SERVICE_USER_AGENT ||
    "WeatherService/1.0 (contact: you@example.com)"
  );
}

// Axios instance for NWS
const client = axios.create({
  baseURL: NWS_BASE_URL,
  timeout: 5000,
  headers: {
    "User-Agent": getUserAgent(),
    Accept: "application/geo+json"
  }
});

/**
 * Simple retry helper for third-party calls.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delayMs?: number } = {}
): Promise<T> {
  const { retries = 3, delayMs = 300 } = options;

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;

      if (attempt > retries) {
        // Give up
        throw err;
      }

      const delay = delayMs * attempt;
      logger.warn("Retrying NWS request after failure", {
        attempt,
        retries,
        delayMs: delay,
        error: (err as Error).message
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Given lat/lon, fetch the forecast URL from the /points endpoint.
 */
export async function getForecastUrl(lat: number, lon: number): Promise<string> {
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;

  const cached = pointsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const res = await withRetry(() =>
      client.get<NwsPointsResponse>(`/points/${lat},${lon}`)
    );

    const forecastUrl = res.data?.properties?.forecast;
    if (!forecastUrl) {
      throw new Error("NWS points response is missing 'forecast' URL.");
    }

    pointsCache.set(cacheKey, forecastUrl);
    return forecastUrl;
  } catch (err) {
    logAxiosError("getForecastUrl", err, { lat, lon });
    throw err;
  }
}

/**
 * Given a forecast URL, fetch the forecast periods.
 */
export async function getForecastPeriods(
  forecastUrl: string
): Promise<NwsForecastPeriod[]> {
  try {
    // forecastUrl from NWS is usually a full URL, axios can handle that
    const res = await withRetry(() =>
      client.get<NwsForecastResponse>(forecastUrl, {
        headers: {
          "User-Agent": getUserAgent(),
          Accept: "application/geo+json"
        }
      })
    );

    const periods = res.data?.properties?.periods;
    if (!periods || !Array.isArray(periods) || periods.length === 0) {
      throw new Error("NWS forecast response has no periods.");
    }

    return periods;
  } catch (err) {
    logAxiosError("getForecastPeriods", err, { forecastUrl });
    throw err;
  }
}

/**
 * Pick "today" period from NWS periods.
 * Simple heuristic: the first period whose startTime is on today's date.
 */
export function pickTodayPeriod(
  periods: NwsForecastPeriod[]
): NwsForecastPeriod {
  const todayDate = new Date().toDateString();

  const found = periods.find((p) => {
    const start = new Date(p.startTime);
    return start.toDateString() === todayDate;
  });

  // Fallback: first period
  return found ?? periods[0];
}

/**
 * Top-level helper used by the route: returns today's forecast period for lat/lon.
 */
export async function getTodayForecastPeriod(
  lat: number,
  lon: number
): Promise<NwsForecastPeriod> {
  const cacheKey = `today:${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cached = todayForecastCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const forecastUrl = await getForecastUrl(lat, lon);
  const periods = await getForecastPeriods(forecastUrl);
  const today = pickTodayPeriod(periods);

  todayForecastCache.set(cacheKey, today);
  return today;
}

/**
 * Centralized axios error logging so routes stay clean.
 */
function logAxiosError(
  context: string,
  err: unknown,
  extra?: Record<string, unknown>
) {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError;
    logger.error(`NWS axios error in ${context}`, {
      message: axiosErr.message,
      code: axiosErr.code,
      status: axiosErr.response?.status,
      dataPreview: axiosErr.response?.data
        ? JSON.stringify(axiosErr.response.data).slice(0, 400)
        : undefined,
      ...extra
    });
  } else {
    logger.error(`Unexpected error in ${context}`, { err, ...extra });
  }
}
