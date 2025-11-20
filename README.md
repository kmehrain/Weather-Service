# Weather-Service Project
weather service
# Weather Service (NWS-based)

Simple Node/TypeScript HTTP service that returns the **short forecast** and
a basic temperature classification (`hot`, `cold`, `moderate`) for the
current day at a given latitude/longitude. Only **Fahrenheit** temp is supported for now.  
<img width="524" height="414" alt="image" src="https://github.com/user-attachments/assets/9d95376f-0dac-49f7-98e7-a6d67b20028a" />

Data source: [National Weather Service API](https://www.weather.gov/documentation/services-web-api).

## Requirements
We user docker, express, nodejs, typescript, javascript, winson log, rate limiter, cache, async model

Write an HTTP server that serves the forecasted weather.  
Your server should expose an endpoint that:

1. **Accepts** latitude and longitude coordinates.
2. **Returns** the short forecast for that area for **today** (e.g., “Partly Cloudy”).
3. **Returns** a characterization of whether the temperature is **“hot”**, **“cold”**, or **“moderate”**  
   (you may choose the exact temperature thresholds).
4. **Uses** the [National Weather Service API](https://www.weather.gov/documentation/services-web-api) as the data source.


> **Note Weather service app**: only supports the Fahrenheit temp. return since it is for NW, however in a bigger project you can use the location of the user through browser permission and convert temp based on user's location.
---

### Implementation Notes

- Uses `https://api.weather.gov/points/{lat},{lon}` to discover the correct grid forecast URL, then calls that URL and picks a "today" period.
- Adds a simple in-memory cache (5 min TTL) for:
  - the forecast URL for given coordinates, and
  - the "today" forecast period result.
- If the NWS response shape is unexpected, the service logs a short preview and returns a `502` with a friendly error message.
- Uses a lightweight in-memory rate limiter (60 requests per minute per IP) to protect the API.
- Uses a simple in-memory cache (5-minute TTL).  
- In production, this would be moved to Redis or a distributed cache.
- This project supports **winston** logger and it is added to the server side.



## Requirements

- Node.js 18+
- npm or yarn
- For real-world usage, you’d move cache + rate limits to Redis, a gateway, or a dedicated service

Optional environment variable:

- `WEATHER_SERVICE_USER_AGENT` – custom User-Agent header used when calling
  the NWS API (recommended by NWS).

---

## Setup & Run
 - npm install
 - npm run build
 - npm run dev
 - PS C:\Users\kmehrain\Src\weather-service> curl "http://localhost:3000/weather?lat=47.6062&lon=-122.3321"
{"lat":47.6062,"lon":-122.3321,"shortForecast":"Patchy Fog then Partly Sunny","temperature":{"value":52,"unit":"F"},"category":"moderate"}

---

## Build and Run local using Docker
- Build: docker build -t weather-service:local .
- Run: docker run --rm -p 3000:3000 weather-service:local

---

## Test
Run the full test suite:
 - npm test
 
<img width="539" height="344" alt="image" src="https://github.com/user-attachments/assets/65f12e76-2126-4730-8bf5-d51b6cc77f03" />


