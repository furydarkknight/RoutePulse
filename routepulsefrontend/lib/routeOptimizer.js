/**
 * RoutePulse smart route planner (runs fully in the browser, no backend needed).
 *
 * 1. Nearest-neighbour builds a first route from the driver's position.
 * 2. 2-opt local search removes crossing legs and shortens it further.
 * 3. We report distance, ETA and how much was saved vs. the original order.
 */

const EARTH_KM = 6371;
const toRad = (d) => (d * Math.PI) / 180;

/** Great-circle distance in km between [lat, lng] points. */
export function haversineKm(a, b) {
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

/** Average city speeds (km/h) and minutes spent at each drop-off. */
export const TRANSPORT_MODES = {
  bicycle: { label: "Bicycle", icon: "🚲", speedKmh: 14, stopMinutes: 3 },
  motorbike: { label: "Motorbike", icon: "🛵", speedKmh: 28, stopMinutes: 3 },
  truck: { label: "Truck", icon: "🚚", speedKmh: 24, stopMinutes: 5 },
};

// Straight-line distance underestimates real roads; this factor corrects it.
const ROAD_FACTOR = 1.3;

function pathLength(start, stops, order) {
  let total = 0;
  let prev = start;
  for (const idx of order) {
    total += haversineKm(prev, stops[idx].position);
    prev = stops[idx].position;
  }
  return total;
}

function nearestNeighbour(start, stops) {
  const remaining = new Set(stops.map((_, i) => i));
  const order = [];
  let current = start;
  while (remaining.size) {
    let best = -1;
    let bestDist = Infinity;
    for (const i of remaining) {
      const d = haversineKm(current, stops[i].position);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    order.push(best);
    remaining.delete(best);
    current = stops[best].position;
  }
  return order;
}

function twoOpt(start, stops, order) {
  let best = order.slice();
  let bestLen = pathLength(start, stops, best);
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 50) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const candidate = best
          .slice(0, i)
          .concat(best.slice(i, j + 1).reverse(), best.slice(j + 1));
        const len = pathLength(start, stops, candidate);
        if (len + 1e-9 < bestLen) {
          best = candidate;
          bestLen = len;
          improved = true;
        }
      }
    }
  }
  return best;
}

/**
 * @param {[number, number]} start   driver position [lat, lng]
 * @param {{id: string, position: [number, number], label?: string}[]} stops
 * @param {"bicycle"|"motorbike"|"truck"} mode
 */
export function planRoute(start, stops, mode = "bicycle") {
  const cfg = TRANSPORT_MODES[mode] || TRANSPORT_MODES.bicycle;
  if (!start || !stops?.length) {
    return { stops: [], legs: [], totalKm: 0, naiveKm: 0, savedKm: 0, savedPct: 0, etaMinutes: 0, line: [] };
  }

  const naiveOrder = stops.map((_, i) => i);
  const naiveKm = pathLength(start, stops, naiveOrder) * ROAD_FACTOR;

  const order = twoOpt(start, stops, nearestNeighbour(start, stops));
  const totalKm = pathLength(start, stops, order) * ROAD_FACTOR;

  const legs = [];
  let prev = start;
  let elapsed = 0;
  order.forEach((idx, n) => {
    const stop = stops[idx];
    const km = haversineKm(prev, stop.position) * ROAD_FACTOR;
    const minutes = (km / cfg.speedKmh) * 60;
    elapsed += minutes;
    legs.push({
      step: n + 1,
      ...stop,
      km,
      legMinutes: minutes,
      arrivalMinutes: elapsed,
    });
    elapsed += cfg.stopMinutes;
    prev = stop.position;
  });

  const savedKm = Math.max(0, naiveKm - totalKm);
  return {
    stops: legs,
    legs,
    totalKm,
    naiveKm,
    savedKm,
    savedPct: naiveKm > 0 ? (savedKm / naiveKm) * 100 : 0,
    etaMinutes: elapsed,
    line: [start, ...legs.map((l) => l.position)],
  };
}

export function formatMinutes(min) {
  if (!Number.isFinite(min)) return "-";
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}
