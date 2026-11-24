'use client';

import { useSyncExternalStore } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const emptySubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Numbered stop pin used by the route planner (marker.label = stop number).
const numberedIcon = (label, color = '#162B22') =>
  L.divIcon({
    className: '',
    html: `<div style="background:${color};color:#fff;width:28px;height:28px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font:700 13px sans-serif;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

// Rate-limited Nominatim reverse geocode (max 1 request/sec + proper User-Agent/Referer).
let lastReverseGeocodeTime = 0;
let pendingTimeout = null;
const geocodeCache = new Map();

async function rateLimitedReverseGeocode(lat, lng) {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  const now = Date.now();
  const timeSinceLast = now - lastReverseGeocodeTime;
  const delay = timeSinceLast < 1000 ? 1000 - timeSinceLast : 0;

  return new Promise((resolve) => {
    if (pendingTimeout) clearTimeout(pendingTimeout);
    pendingTimeout = setTimeout(async () => {
      lastReverseGeocodeTime = Date.now();
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          {
            headers: {
              Accept: 'application/json',
              'User-Agent': 'RoutePulse-DeliveryApp/1.0 (https://routepulse.onrender.com)',
            },
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const address = data.display_name || 'Selected Location';
        geocodeCache.set(cacheKey, address);
        resolve(address);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Reverse geocode fallback:', err?.message || err);
        }
        resolve('Custom Selected Location');
      }
    }, delay);
  });
}

function LocationClickHandler({ onLocationSelect }) {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      const formattedAddress = await rateLimitedReverseGeocode(lat, lng);
      if (onLocationSelect) {
        onLocationSelect({ lat, lng, address: formattedAddress });
      }
    },
  });

  return null;
}

export default function DeliveryMap({ center = [36.7538, 3.0588], zoom = 13, markers = [], route = null, onLocationSelect }) {
  const isMounted = useIsClient();

  if (!isMounted) {
    return (
      <div className="w-full h-[550px] bg-[#FAFAFC] dark:bg-stone-900 rounded-3xl border border-gray-100 dark:border-stone-800 flex items-center justify-center text-xs text-gray-400">
        Loading Map...
      </div>
    );
  }

  return (
    // Increased height to h-[550px] for a much larger map view
    <div className="w-full h-[550px] rounded-3xl overflow-hidden border border-gray-100 shadow-xs z-10 relative">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={false} 
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationClickHandler onLocationSelect={onLocationSelect} />

        {route && route.length > 1 && (
          <Polyline positions={route} pathOptions={{ color: '#FF6B35', weight: 4, opacity: 0.85, dashArray: '8 8' }} />
        )}

        {markers.map((marker, index) => (
          <Marker key={index} position={marker.position} icon={marker.label ? numberedIcon(marker.label, marker.color) : customIcon}>
            {marker.popupText && (
              <Popup>
                <div className="text-xs font-medium text-gray-800">
                  {marker.popupText}
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}