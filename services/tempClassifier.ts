// src/services/tempClassifier.ts

export type TemperatureCategory = "hot" | "cold" | "moderate";

/**
 * Classify Fahrenheit temperature into hot / cold / moderate.
 * You can adjust thresholds as you like.
 */
export function classifyTemperatureF(tempF: number): TemperatureCategory {
  if (tempF >= 85) return "hot";
  if (tempF <= 45) return "cold";
  return "moderate";
}
