// src/services/nwsClient.ts

import axios from "axios";
import { NwsForecastResponse, NwsPointsResponse, NwsForecastPeriod } from "../types/nws";
import { SimpleCache } from "./simpleCache";

const NWS_BASE_URL = "https://api.weather.gov";

// Simple caches for forecast URL and today's forecast period
const pointsCache = new SimpleCache<string>(5 * 60 * 1000);          // 5 minutes
const todayForecastCache = new SimpleCache<NwsForecastPeriod>(5 * 60 * 1000);

function getUserAgent(): string {
  // You can override this with WEATHER_SERVICE_USER_AGENT in your env
  return (
    process.env.WEATHER_SERVICE_USER_AGENT ??
    "weather-service (your-email@example.com)" // <-- replace with real email if you want
  );
}

const client = axios.create({
  baseURL: NWS_BASE_URL,
  headers: {
    "User-Agent": getUserAgent(),
    // Either ld+json or geo+json is fine; using geo+json is common in examples
    "Accept": "application/geo+json"
  },
  timeout: 10_000
});

/**
 * Given lat/lon, fetch the forecast URL from the /points endpoint.
 */
export async function getForecastUrl(lat: number, lon: number): Promise<string> {
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;

  // Cache lookup
  const cached = pointsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const res = await client.get<NwsPointsResponse>(`/points/${lat},${lon}`);
  const data: any = res.data;


  if (
    !data ||
    typeof data !== "object" ||
    !data.properties ||
    typeof data.properties.forecast !== "string"
  ) {
    console.error("Unexpected NWS /points response", {
      status: res.status,
      preview:
        typeof data === "string"
          ? data.slice(0, 400)
          : JSON.stringify(data).slice(0, 400)
    });
    throw new Error("Forecast URL not found in NWS /points response");
  }

  const forecastUrl: string = data.properties.forecast;

  // Cache set
  pointsCache.set(cacheKey, forecastUrl);

  return forecastUrl;
}

/**
 * Given a forecast URL, fetch the forecast periods.
 */
export async function getForecastPeriods(forecastUrl: string): Promise<NwsForecastPeriod[]> {
  const res = await client.get<NwsForecastResponse>(forecastUrl);
  const data: any = res.data;
  const periods: any = data?.properties?.periods;

  if (!Array.isArray(periods) || periods.length === 0) {
    console.error("Unexpected NWS forecast response", {
      status: res.status,
      preview: JSON.stringify(data).slice(0, 400)
    });
    throw new Error("No forecast periods returned from NWS");
  }

  return periods as NwsForecastPeriod[];
}

/**
 * Pick "today" period from the list (or fall back to the first period).
 */
export function pickTodayPeriod(periods: NwsForecastPeriod[]): NwsForecastPeriod {
  const today = periods.find((p) =>
    p.name.toLowerCase().includes("today")
  );

  return today ?? periods[0];
}

/**
 * High-level helper: from lat/lon, fetch today's forecast period.
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
