// tests/weatherRoute.test.ts

jest.mock("../src/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

import request from "supertest";
import app from "../src/app";
import * as nwsClient from "../src/services/nwsClient";
import { NwsForecastPeriod } from "../src/types/nws";
import logger from "../src/logger";

expect((logger.error as jest.Mock).mock.calls.length).toBe(0);

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
    expect(res.body.error).toBe(
      "Query parameters 'lat' and 'lon' are required and must be numbers."
    );
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


describe("Additional tests for /weather", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns 400 for invalid latitude format", async () => {
    const res = await request(app).get("/weather?lat=abc&lon=-122");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(
      "Query parameters 'lat' and 'lon' are required and must be numbers."
    );
  });

  it("returns 400 for out-of-range values", async () => {
    const res = await request(app).get("/weather?lat=190&lon=200");
    expect(res.status).toBe(400);
  });

  it("returns 502 if NWS client throws axios error", async () => {
    jest.spyOn(nwsClient, "getTodayForecastPeriod").mockRejectedValue({
      isAxiosError: true,
      message: "Network fail"
    });

    const res = await request(app).get("/weather?lat=47&lon=-122");
    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/failed to fetch/i);
  });

  it("classifies temperature as cold when below threshold", async () => {
    const coldPeriod: NwsForecastPeriod = {
      number: 1,
      name: "Today",
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      isDaytime: true,
      temperature: 30,
      temperatureUnit: "F",
      shortForecast: "Freezing Cold"
    };

    jest.spyOn(nwsClient, "getTodayForecastPeriod").mockResolvedValue(coldPeriod);

    const res = await request(app).get("/weather?lat=47&lon=-122");
    expect(res.status).toBe(200);
    expect(res.body.category).toBe("cold");
  });

  it("classifies temperature as hot when above threshold", async () => {
    const hotPeriod: NwsForecastPeriod = {
      number: 1,
      name: "Today",
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      isDaytime: true,
      temperature: 105,
      temperatureUnit: "F",
      shortForecast: "Extreme Heat"
    };

    jest.spyOn(nwsClient, "getTodayForecastPeriod").mockResolvedValue(hotPeriod);

    const res = await request(app).get("/weather?lat=47&lon=-122");
    expect(res.status).toBe(200);
    expect(res.body.category).toBe("hot");
  });

  it("falls back to the first forecast period when no 'Today' exists", async () => {
    const periodsWithoutToday: NwsForecastPeriod = {
      number: 1,
      name: "Tonight",
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      isDaytime: false,
      temperature: 55,
      temperatureUnit: "F",
      shortForecast: "Cool evening"
    };

    jest.spyOn(nwsClient, "getTodayForecastPeriod").mockResolvedValue(periodsWithoutToday);

    const res = await request(app).get("/weather?lat=47&lon=-122");
    expect(res.status).toBe(200);
    expect(res.body.shortForecast).toBe("Cool evening");
  });
});
