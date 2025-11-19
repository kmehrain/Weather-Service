// tests/weatherRoute.test.ts

import request from "supertest";
import app from "../src/app";
import * as nwsClient from "../src/services/nwsClient";
import { NwsForecastPeriod } from "../src/types/nws";

describe("GET /weather", () => {
  const mockPeriod: NwsForecastPeriod = {
    number: 1,
    name: "Today",
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    isDaytime: true,
    temperature: 90,
    temperatureUnit: "F",
    shortForecast: "Hot and sunny"
  };

  beforeAll(() => {
    // Mock the high-level helper so we don't call the real API
    jest.spyOn(nwsClient, "getTodayForecastPeriod").mockResolvedValue(mockPeriod);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("returns 400 when lat/lon are missing", async () => {
    const res = await request(app).get("/weather");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/lat.*lon/i);
  });

  it("returns forecast and classification for valid lat/lon", async () => {
    const res = await request(app).get("/weather?lat=47.6&lon=-122.3");
    expect(res.status).toBe(200);

    expect(res.body).toMatchObject({
      lat: 47.6,
      lon: -122.3,
      shortForecast: "Hot and sunny",
      temperature: {
        value: 90,
        unit: "F"
      },
      category: "hot"
    });
  });
});
