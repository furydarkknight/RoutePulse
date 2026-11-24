"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { getDriversOrdersApi } from "../../../lib/api";
import { TRANSPORT_MODES, formatMinutes, planRoute } from "../../../lib/routeOptimizer";

// Leaflet only works in the browser
const DeliveryMap = dynamic(() => import("../../../components/map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-[#FAFAFC] dark:bg-stone-900 rounded-3xl border border-gray-100 dark:border-stone-800 flex items-center justify-center text-xs text-gray-400">
      Loading Map...
    </div>
  ),
});

const DEFAULT_CENTER = [36.7538, 3.0588];

// Orders store coordinates as GeoJSON [lng, lat]; Leaflet wants [lat, lng].
const toLatLng = (order) => {
  const c = order?.location?.coordinates;
  return Array.isArray(c) && c.length === 2 ? [c[1], c[0]] : null;
};

export default function DriverOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [driverPos, setDriverPos] = useState(null);
  const [geoDenied, setGeoDenied] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [mode, setMode] = useState("bicycle");
  const [showPlan, setShowPlan] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await getDriversOrdersApi();
      if (!active) return;
      if (!result) setError("Could not load your orders. Check your connection and try again.");
      const list = result?.data || (Array.isArray(result) ? result : []);
      setOrders(Array.isArray(list) ? list : []);
      setLoading(false);
    })();

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (active) setDriverPos([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          if (active) setGeoDenied(true);
        },
        { enableHighAccuracy: true }
      );
    }

    return () => {
      active = false;
    };
  }, []);

  // Modal escape key listener
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setSelectedOrder(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---- Smart route plan: nearest-neighbour + 2-opt over every assigned order ----
  const plan = useMemo(() => {
    const stops = orders
      .map((o) => ({
        id: o._id,
        position: toLatLng(o),
        label: o.shippingAddress?.formattedAddress || o.shippingAddress?.street || "Delivery stop",
      }))
      .filter((s) => s.position);
    const start = driverPos || stops[0]?.position;
    return planRoute(start, stops, mode);
  }, [orders, driverPos, mode]);

  const stepById = useMemo(() => Object.fromEntries(plan.stops.map((s) => [s.id, s])), [plan]);

  // Next stop for direct turn-by-turn navigation
  const nextStop = plan.stops[0];

  const handleStartNavigation = (stop) => {
    const target = stop || nextStop;
    if (!target?.position) return;
    const [lat, lng] = target.position;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // ---- Map for the selected order ----
  const orderPos = toLatLng(selectedOrder);
  const markers = [];
  if (orderPos) markers.push({ position: orderPos, popupText: `📍 ${selectedOrder.shippingAddress?.street || "Destination"}` });
  if (driverPos) markers.push({ position: driverPos, popupText: "🚗 Your live location", color: "#FF6B35", label: "★" });
  const mapCenter = orderPos || driverPos || DEFAULT_CENTER;

  // ---- Map for the whole optimised route ----
  const planMarkers = plan.stops.map((s) => ({ position: s.position, popupText: `${s.step}. ${s.label}`, label: s.step }));
  if (driverPos) planMarkers.unshift({ position: driverPos, popupText: "🚗 You are here", color: "#FF6B35", label: "★" });

  const estimatedEarnings = plan.totalKm * 1.75 + plan.stops.length * 4.0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      {/* Top Header with Online Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white">Assigned Orders & Routes</h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Optimized multi-stop routing with live Google Maps navigation.
          </p>
        </div>

        {/* Online / Offline status toggle */}
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold ${isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-stone-400"}`}>
            {isOnline ? "🟢 Online" : "⚪ Offline"}
          </span>
          <button
            type="button"
            onClick={() => setIsOnline(!isOnline)}
            aria-pressed={isOnline}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              isOnline ? "bg-emerald-600" : "bg-stone-400 dark:bg-stone-700"
            }`}
          >
            <span className="sr-only">Toggle shift status</span>
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ${
                isOnline ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Driver Daily Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Active Deliveries" value={orders.length} />
        <Stat label="Total Route Km" value={`${plan.totalKm.toFixed(1)} km`} />
        <Stat label="Estimated Time" value={formatMinutes(plan.etaMinutes)} />
        <Stat
          label="Estimated Payout"
          value={`$${estimatedEarnings.toFixed(2)}`}
          hint={plan.stops.length > 0 ? `${plan.stops.length} drops` : "0 orders"}
          accent
        />
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-900 p-4 text-xs sm:text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-800" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 p-10 text-center text-stone-500 dark:text-stone-400">
          <p className="font-bold text-base text-stone-800 dark:text-stone-200">No active orders assigned yet</p>
          <p className="text-xs sm:text-sm mt-1">Use the Dispatch Hub on your dashboard to pick up the nearest order.</p>
        </div>
      ) : (
        <>
          {/* Route planner banner */}
          {plan.stops.length > 0 && (
            <section className="rounded-3xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-sm sm:p-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-stone-900 dark:text-white">🧭 Smart Route Optimizer</h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    2-Opt TSP heuristic calculated on-device. Saves fuel and travel time.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex gap-1 rounded-2xl bg-stone-100 dark:bg-stone-800 p-1" role="group" aria-label="Transport mode">
                    {Object.entries(TRANSPORT_MODES).map(([key, m]) => (
                      <button
                        key={key}
                        onClick={() => setMode(key)}
                        aria-pressed={mode === key}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                          mode === key
                            ? "bg-[#162B22] text-white dark:bg-stone-100 dark:text-stone-900 shadow"
                            : "text-stone-600 dark:text-stone-400 hover:bg-white dark:hover:bg-stone-700"
                        }`}
                      >
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Start Navigation CTA */}
                  {nextStop && (
                    <button
                      type="button"
                      onClick={() => handleStartNavigation(nextStop)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95"
                    >
                      🚀 Start Navigation
                    </button>
                  )}
                </div>
              </div>

              {geoDenied && (
                <p className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                  Location access is off, so the route starts from your first order. Enable GPS for live accuracy.
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Total Stops" value={plan.stops.length} />
                <Stat label="Optimized Distance" value={`${plan.totalKm.toFixed(1)} km`} />
                <Stat label="Total Route ETA" value={formatMinutes(plan.etaMinutes)} />
                <Stat
                  label="Saved vs Unsorted"
                  value={`${plan.savedKm.toFixed(1)} km`}
                  hint={plan.savedPct >= 1 ? `${Math.round(plan.savedPct)}% shorter` : "optimal sequence"}
                  accent
                />
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setShowPlan((v) => !v)}
                  className="text-xs font-bold text-[#65795C] dark:text-emerald-400 hover:underline"
                >
                  {showPlan ? "Hide route map ▲" : "Show route map ▼"}
                </button>
                {nextStop && (
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    Next Stop: <strong className="text-stone-800 dark:text-stone-200">{nextStop.label}</strong>
                  </span>
                )}
              </div>

              {showPlan && (
                <div className="mt-3">
                  <DeliveryMap center={plan.line[0] || DEFAULT_CENTER} zoom={12} markers={planMarkers} route={plan.line} />
                </div>
              )}
            </section>
          )}

          {/* Order Cards List (Sorted by TSP Sequence) */}
          <div className="grid gap-3">
            {[...orders]
              .sort((a, b) => (stepById[a._id]?.step ?? 999) - (stepById[b._id]?.step ?? 999))
              .map((order) => {
                const step = stepById[order._id];
                return (
                  <div
                    key={order._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-sm transition-all hover:border-[#65795C]/60 hover:shadow-md sm:p-5"
                  >
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#162B22] dark:bg-emerald-700 text-sm font-black text-white">
                        {step ? step.step : "•"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-stone-800 dark:text-white text-sm sm:text-base">
                          {order.shippingAddress?.formattedAddress || order.shippingAddress?.street || "Address unavailable"}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                          <span>
                            Status: <strong className="capitalize text-stone-800 dark:text-stone-200">{order.status || "Assigned"}</strong>
                          </span>
                          {step && (
                            <>
                              <span>{step.km.toFixed(1)} km leg</span>
                              <span>ETA {formatMinutes(step.arrivalMinutes)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {step?.position && (
                        <button
                          type="button"
                          onClick={() => handleStartNavigation(step)}
                          className="rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 px-3 py-2 text-xs font-bold text-slate-800 dark:text-stone-200 transition"
                          title="Open Google Maps Directions"
                        >
                          Navigate 📍
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-stone-300 transition"
                      >
                        View Pin 🗺️
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}

      {/* Selected Order Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Order Location Details"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-4">
                <h2 className="text-lg font-bold text-stone-800 dark:text-white">Order Destination Pin</h2>
                <p className="truncate text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {selectedOrder.shippingAddress?.formattedAddress || selectedOrder.shippingAddress?.street}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 font-bold text-stone-600 dark:text-stone-300 transition-colors hover:bg-stone-200 dark:hover:bg-stone-700"
              >
                ✕
              </button>
            </div>
            <DeliveryMap center={mapCenter} zoom={15} markers={markers} />
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  const pos = toLatLng(selectedOrder);
                  if (pos) {
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${pos[0]},${pos[1]}`, "_blank", "noopener,noreferrer");
                  }
                }}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 transition"
              >
                Open in Google Maps 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, hint, accent }) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        accent
          ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800"
          : "border-stone-200/80 bg-stone-50 dark:bg-stone-800/50 dark:border-stone-800"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">{label}</p>
      <p className={`text-lg font-black ${accent ? "text-emerald-800 dark:text-emerald-300" : "text-stone-900 dark:text-white"}`}>
        {value}
      </p>
      {hint && <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">{hint}</p>}
    </div>
  );
}
