# Weather-Service
weather service
# Weather Service (NWS-based)

Simple Node/TypeScript HTTP service that returns the **short forecast** and
a basic temperature classification (`hot`, `cold`, `moderate`) for the
current day at a given latitude/longitude.

Data source: [National Weather Service API](https://www.weather.gov/documentation/services-web-api).

> **Note Weather service app**
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
 - npm run dev
 - PS C:\Users\v-kmehrain\Src\weather-service> curl "http://localhost:3000/weather?lat=47.6062&lon=-122.3321"
{"lat":47.6062,"lon":-122.3321,"shortForecast":"Patchy Fog then Partly Sunny","temperature":{"value":52,"unit":"F"},"category":"moderate"}

## Test
Run the full test suite:

 - npm test
