// src/types/nws.ts

export interface NwsPointsResponse {
  properties: {
    forecast: string;
    [key: string]: unknown;
  };
}

export interface NwsForecastPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
  [key: string]: unknown;
}

export interface NwsForecastResponse {
  properties: {
    periods: NwsForecastPeriod[];
    [key: string]: unknown;
  };
}
