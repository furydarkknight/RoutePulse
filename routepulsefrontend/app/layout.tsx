import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#162B22",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: { default: "RoutePulse - smart grocery delivery", template: "%s | RoutePulse" },
  description:
    "RoutePulse matches every grocery order with the nearest driver and plans the shortest multi-stop delivery route.",
  applicationName: "RoutePulse",
  openGraph: {
    title: "RoutePulse - smart grocery delivery",
    description: "Nearest-driver matching and optimised delivery routes.",
    type: "website",
  },
  icons: {
    icon: "/gemini-svg.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // suppressHydrationWarning prevents React from complaining when
      // the browser's dark-mode class (or cookie-based theme) differs
      // from the server-rendered HTML on first hydration.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
