import type { NextConfig } from "next";

// Backend base URL. Set NEXT_PUBLIC_API_BASE_URL in Render (or .env.local).
// `url_base` is kept so older code that reads process.env.url_base keeps working.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://newhopoe.vercel.app";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  env: {
    url_base: API_BASE_URL,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.dummyjson.com" },
      { protocol: "https", hostname: "i.dummyjson.com" },
      { protocol: "https", hostname: "dummyjson.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "unpkg.com" },
      // Nominatim tile server (OpenStreetMap)
      { protocol: "https", hostname: "tile.openstreetmap.org" },
    ],
  },
  // Security headers applied to every response
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
