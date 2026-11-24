import { describe, it, expect } from "vitest";
import { haversineKm, planRoute, formatMinutes } from "../lib/routeOptimizer";

describe("haversineKm", () => {
  it("returns 0 distance for identical coordinates", () => {
    const point = [48.8566, 2.3522]; // Paris
    expect(haversineKm(point, point)).toBe(0);
  });

  it("calculates accurate great-circle distance between two known points", () => {
    // London (51.5074, -0.1278) to Paris (48.8566, 2.3522) is roughly ~343-345 km
    const london = [51.5074, -0.1278];
    const paris = [48.8566, 2.3522];
    const dist = haversineKm(london, paris);
    expect(dist).toBeGreaterThan(340);
    expect(dist).toBeLessThan(346);
  });

  it("is symmetric", () => {
    const a = [40.7128, -74.006]; // NYC
    const b = [34.0522, -118.2437]; // LA
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 6);
  });
});

describe("planRoute", () => {
  const start = [48.8566, 2.3522];

  it("handles empty stops gracefully", () => {
    const result = planRoute(start, []);
    expect(result.stops).toEqual([]);
    expect(result.totalKm).toBe(0);
    expect(result.naiveKm).toBe(0);
    expect(result.savedKm).toBe(0);
    expect(result.etaMinutes).toBe(0);
    expect(result.line).toEqual([]);
  });

  it("handles null / undefined start or stops gracefully", () => {
    expect(planRoute(null, [{ position: [48.85, 2.35] }]).totalKm).toBe(0);
    expect(planRoute(start, null).totalKm).toBe(0);
    expect(planRoute(undefined, undefined).totalKm).toBe(0);
  });

  it("handles a single stop correctly", () => {
    const singleStop = [{ id: "order-1", position: [48.8606, 2.3376], label: "Stop 1" }];
    const result = planRoute(start, singleStop, "bicycle");

    expect(result.stops).toHaveLength(1);
    expect(result.legs).toHaveLength(1);
    expect(result.stops[0].step).toBe(1);
    expect(result.totalKm).toBeGreaterThan(0);
    expect(result.totalKm).toBeCloseTo(result.naiveKm, 5);
    expect(result.savedKm).toBe(0);
    expect(result.etaMinutes).toBeGreaterThan(0);
    expect(result.line).toEqual([start, singleStop[0].position]);
  });

  it("ensures optimised distance is less than or equal to unsorted naive distance", () => {
    // Intentionally zig-zagged unsorted stops
    const stops = [
      { id: "far-east", position: [48.85, 2.45] },
      { id: "near-start", position: [48.857, 2.353] },
      { id: "far-west", position: [48.85, 2.25] },
      { id: "middle-east", position: [48.853, 2.40] },
      { id: "middle-west", position: [48.853, 2.29] },
    ];

    const result = planRoute(start, stops, "motorbike");

    expect(result.stops).toHaveLength(5);
    // Crucial requirement: optimised distance <= unsorted distance
    expect(result.totalKm).toBeLessThanOrEqual(result.naiveKm);
    expect(result.savedKm).toBeGreaterThanOrEqual(0);
    expect(result.savedPct).toBeGreaterThanOrEqual(0);
    expect(result.savedPct).toBeLessThanOrEqual(100);
  });

  it("supports different transport modes with expected speed scaling", () => {
    const stops = [
      { id: "s1", position: [48.86, 2.36] },
      { id: "s2", position: [48.87, 2.37] },
    ];

    const bike = planRoute(start, stops, "bicycle");
    const motor = planRoute(start, stops, "motorbike");

    expect(bike.totalKm).toBeCloseTo(motor.totalKm, 5);
    // Motorbike is faster than bicycle, so etaMinutes should be lower
    expect(motor.etaMinutes).toBeLessThan(bike.etaMinutes);
  });
});

describe("formatMinutes", () => {
  it("formats minutes and hours properly", () => {
    expect(formatMinutes(null)).toBe("-");
    expect(formatMinutes(Infinity)).toBe("-");
    expect(formatMinutes(0)).toBe("0 min");
    expect(formatMinutes(25)).toBe("25 min");
    expect(formatMinutes(60)).toBe("1 h 0 min");
    expect(formatMinutes(95)).toBe("1 h 35 min");
  });
});
