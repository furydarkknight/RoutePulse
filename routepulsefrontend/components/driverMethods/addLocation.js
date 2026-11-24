"use client";

import { useState } from "react";
import { getlNeasestOrder, assigneDriverApi } from "../../lib/api";
import dynamic from "next/dynamic";

// Dynamically import the Leaflet map component with SSR disabled
const DeliveryMap = dynamic(() => import("../../components/map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-[#FAFAFC] dark:bg-stone-900 rounded-3xl border border-gray-100 dark:border-stone-800 flex items-center justify-center text-xs text-gray-400">
      Loading Map...
    </div>
  ),
});

export default function UpdateLocation({ onOrderAssigned }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nearestOrder, setNearestOrder] = useState(null);
  const [driverCoords, setDriverCoords] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem("driverLocation");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [selectedLocation, setSelectedLocation] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem("driverLocation");
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed?.lat && parsed?.lng ? { ...parsed, address: "Last Known Location" } : null;
    } catch {
      return null;
    }
  });
  const [isOnline, setIsOnline] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleLocationSelect = (locationInfo) => {
    setSelectedLocation(locationInfo);
  };

  const fetchNearestOrder = async (lng, lat) => {
    setLoading(true);
    setError(null);
    setSuccessMsg("");
    try {
      const result = await getlNeasestOrder(lng, lat);
      if (!result?.success) {
        throw new Error(
          result?.error || result?.message || "Failed to find nearby orders."
        );
      }
      setNearestOrder(result.data);
      setIsOnline(true);
    } catch (err) {
      setError(err?.message || "Failed to find nearby orders.");
    } finally {
      setLoading(false);
    }
  };

  const handleFindNearestWithGPS = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const coords = { lat, lng };

        setDriverCoords(coords);
        setSelectedLocation({ ...coords, address: "Live GPS Position" });
        try {
          localStorage.setItem("driverLocation", JSON.stringify(coords));
        } catch {
          // ignore quota error
        }

        fetchNearestOrder(lng, lat);
      },
      () => {
        setError(
          "Unable to retrieve your location. Please check browser permissions."
        );
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSearchFromSelectedPin = () => {
    if (!selectedLocation) return;
    fetchNearestOrder(selectedLocation.lng, selectedLocation.lat);
  };

  const handleAssigningDriver = async (orderId) => {
    try {
      setLoading(true);
      setError(null);
      await assigneDriverApi(orderId);
      setSuccessMsg(`Order ${orderId} assigned to you successfully! 🚀`);
      setNearestOrder(null);
      setIsOnline(false);
      if (onOrderAssigned) onOrderAssigned(orderId);
    } catch (err) {
      setError(err?.message || "Failed to assign driver to this order.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineOrder = () => {
    setNearestOrder(null);
    setIsOnline(false);
    setSuccessMsg("Order skipped. Select another location on the map or scan GPS again.");
  };

  // Build markers array for the map component
  const mapMarkers = [];
  if (driverCoords) {
    mapMarkers.push({
      position: [driverCoords.lat, driverCoords.lng],
      popupText: "🛵 Your Driver GPS",
      color: "#FF6B35",
      label: "★",
    });
  }

  if (selectedLocation) {
    mapMarkers.push({
      position: [selectedLocation.lat, selectedLocation.lng],
      popupText: `📍 Selected: ${selectedLocation.address}`,
      label: "●",
    });
  }

  if (nearestOrder?.location?.coordinates) {
    const [orderLng, orderLat] = nearestOrder.location.coordinates;
    mapMarkers.push({
      position: [orderLat, orderLng],
      popupText: `🎯 Target Order (${nearestOrder.status || "Ready"})`,
      label: "1",
    });
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#162B22] dark:text-white">
            Driver Dispatch Hub
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Scan your location or tap anywhere on the map to discover the nearest order.
          </p>
        </div>
        <button
          onClick={handleFindNearestWithGPS}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2.5 shadow-sm transition active:scale-95 disabled:opacity-50"
        >
          📍 Scan Live GPS
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div
          role="alert"
          className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-2xl text-xs sm:text-sm"
        >
          {error}
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs sm:text-sm font-semibold"
        >
          {successMsg}
        </div>
      )}

      {/* Map View */}
      <div className="w-full h-[400px] rounded-3xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm">
        <DeliveryMap
          center={driverCoords ? [driverCoords.lat, driverCoords.lng] : [36.7538, 3.0588]}
          zoom={13}
          markers={mapMarkers}
          onLocationSelect={handleLocationSelect}
        />
      </div>

      {selectedLocation && (
        <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Selected Map Pin
            </span>
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
              {selectedLocation.address}
            </p>
            <p className="text-xs text-stone-400 font-mono">
              Lat: {selectedLocation.lat?.toFixed(4)}, Lng: {selectedLocation.lng?.toFixed(4)}
            </p>
          </div>
          <button
            onClick={handleSearchFromSelectedPin}
            disabled={loading}
            className="bg-[#162B22] hover:bg-[#1f3a2e] dark:bg-stone-100 dark:text-stone-900 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer disabled:opacity-50 shrink-0 shadow-sm"
          >
            {loading ? "Searching..." : "Find Nearest Order Here 🎯"}
          </button>
        </div>
      )}

      {/* Order Popup Overlay */}
      {nearestOrder && isOnline && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-[#162B22] border border-[#233d32] w-full max-w-md rounded-3xl p-6 shadow-2xl text-white space-y-4"
          >
            <div className="flex justify-between items-center">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                New Order Available! 🚀
              </span>
              <span className="text-xs font-semibold text-stone-300">
                {nearestOrder.distanceInMeters
                  ? `${(nearestOrder.distanceInMeters / 1000).toFixed(2)} km away`
                  : "Nearby"}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-stone-300 uppercase tracking-wider font-bold">
                  Delivery Address
                </p>
                <p className="text-sm font-medium text-white mt-0.5">
                  {nearestOrder.shippingAddress?.formattedAddress ||
                    nearestOrder.shippingAddress?.street ||
                    "Address not available"}
                </p>
              </div>
              <div className="flex justify-between items-center bg-[#101e17] p-3 rounded-2xl border border-[#233d32]">
                <span className="text-xs text-stone-300">Order Payout</span>
                <span className="text-lg font-bold text-amber-400">
                  ${(nearestOrder.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleDeclineOrder}
                className="w-1/2 bg-red-900/40 hover:bg-red-900/60 text-red-200 font-bold py-3 rounded-2xl border border-red-700/50 transition cursor-pointer text-xs"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => handleAssigningDriver(nearestOrder._id)}
                disabled={loading}
                className="w-1/2 bg-[#2d5242] hover:bg-[#36634f] text-white font-bold py-3 rounded-2xl border border-[#3e6f59] shadow-lg transition cursor-pointer text-xs disabled:opacity-50"
              >
                {loading ? "Assigning..." : "Accept Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
