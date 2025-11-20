// src/services/weatherService.ts

import { getTodayForecastPeriod } from "./nwsClient";
import { classifyTemperatureF } from "./tempClassifier";
import { NwsForecastPeriod } from "../types/nws";

export type TemperatureCategory = "hot" | "cold" | "moderate";

export interface WeatherSummary {
  lat: number;
  lon: number;
  shortForecast: string;
  temperature: {
    value: number;
    unit: string;
  };
  category: TemperatureCategory;
}

export class WeatherService {
  // In the future you could inject dependencies into the constructor,
  // e.g. a different client implementation, logger, etc.

  public async getTodaySummary(
    lat: number,
    lon: number
  ): Promise<WeatherSummary> {
    const today: NwsForecastPeriod = await getTodayForecastPeriod(lat, lon);

    const temperature = today.temperature;
    const unit = today.temperatureUnit;

    // Classify in Fahrenheit
    const tempInF =
      unit.toUpperCase() === "F"
        ? temperature
        : (temperature * 9) / 5 + 32;

    const category = classifyTemperatureF(tempInF);

    return {
      lat,
      lon,
      shortForecast: today.shortForecast,
      temperature: {
        value: temperature,
        unit
      },
      category
    };
  }
}
