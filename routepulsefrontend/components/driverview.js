"use client";

import { useState, useEffect } from "react";
import BicycleIllustration from "./driver/BicycleIllustration";
import TruckIllustration from "./driver/TruckIllustration";
import AccountSetupIllustration from "./driver/AccountSetupIllustration";
import UpdateLocation from "./driverMethods/addLocation";
import { getUser } from "../lib/api";
import Link from "next/link";
import MapIllustration from "./driver/MapIllustration";

export default function DriverView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [driver, setDriver] = useState({
    name: "Driver",
    email: "",
    phoneNumber: "",
    Car: "",
    status: "Online",
  });

  // Today's driver metrics
  const todayStats = {
    deliveries: 6,
    totalKm: 28.4,
    estimatedEarnings: 74.5,
  };

  useEffect(() => {
    let active = true;
    const fetchUser = async () => {
      try {
        const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
        if (!token) return;

        const response = await getUser();
        if (active && response && response.data) {
          const userData = response.data;
          setDriver({
            name: userData.name || "Driver",
            email: userData.email || "",
            Car: userData.Car || "Bicycle Courier",
            phoneNumber: userData.phoneNumber || "Not set",
            status: userData.status || "Online",
          });
          if (userData.status) {
            setIsOnline(userData.status.toLowerCase() !== "offline");
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error fetching driver profile:", err);
        }
      }
    };

    fetchUser();
    return () => {
      active = false;
    };
  }, []);

  // Handle modal escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  const toggleOnlineStatus = () => {
    setIsOnline((prev) => !prev);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Driver Header Info Card */}
      <div className="bg-[#162B22] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 font-extrabold text-white text-base">
              🚗
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Hello, {driver.name}! 👋
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-300">
            📧 {driver.email || "Courier account"} {driver.phoneNumber ? `| 📱 ${driver.phoneNumber}` : ""}
          </p>
          <p className="text-xs sm:text-sm text-stone-300">
            🚲 Vehicle Profile: <strong className="text-white">{driver.Car || "Bicycle Courier"}</strong>
          </p>
        </div>

        {/* Online / Offline Toggle Button */}
        <div className="flex items-center gap-4 bg-stone-900/60 p-3 sm:p-4 rounded-2xl border border-stone-800">
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Shift Status
            </p>
            <p className={`text-sm font-extrabold ${isOnline ? "text-emerald-400" : "text-stone-400"}`}>
              {isOnline ? "🟢 Online & Receiving Orders" : "⚪ Offline (Paused)"}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleOnlineStatus}
            aria-pressed={isOnline}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              isOnline ? "bg-emerald-600" : "bg-stone-700"
            }`}
          >
            <span className="sr-only">Toggle Online Status</span>
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isOnline ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Today's Driver Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xl font-bold">
            📦
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Completed Today
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {todayStats.deliveries} <span className="text-xs font-normal text-stone-400">stops</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 text-xl font-bold">
            🧭
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Distance Covered
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {todayStats.totalKm} <span className="text-xs font-normal text-stone-400">km</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-xl font-bold">
            💵
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Estimated Earnings
            </p>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
              ${todayStats.estimatedEarnings.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Driver Workspace Container */}
      <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
            Delivery Workspace & Quick Actions
          </h2>
          <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm mt-1">
            Scan for nearest orders or manage your route optimization profiles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Bicycle Mode Section */}
          <div className="space-y-3 group">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold tracking-wider uppercase text-stone-400">
                Eco-Transit Mode
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
                Available
              </span>
            </div>
            <div className="w-full overflow-hidden rounded-3xl bg-[#FAFBF9] dark:bg-stone-800/40 p-4 border border-stone-100 dark:border-stone-800 transition-all duration-300 group-hover:shadow-md">
              <BicycleIllustration className="w-full h-auto transition-transform duration-500 group-hover:scale-105" />
            </div>
          </div>

          {/* Truck Mode Section */}
          <div className="space-y-3 group">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold tracking-wider uppercase text-stone-400">
                Heavy Cargo Mode
              </span>
              <span className="px-2.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs font-bold rounded-full">
                Standby
              </span>
            </div>
            <div className="w-full overflow-hidden rounded-3xl bg-[#FAFBF9] dark:bg-stone-800/40 p-4 border border-stone-100 dark:border-stone-800 transition-all duration-300 group-hover:shadow-md">
              <TruckIllustration className="w-full h-auto transition-transform duration-500 group-hover:scale-105" />
            </div>
          </div>

          {/* Location Dispatch Hub Trigger */}
          <div className="space-y-3 group flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center px-1 mb-3">
                <span className="text-xs font-bold tracking-wider uppercase text-stone-400">
                  Route Hub
                </span>
                <span className="px-2.5 py-0.5 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 text-xs font-bold rounded-full">
                  Interactive
                </span>
              </div>
              <Link href="/dashboard/driver_orders" className="block w-full">
                <div className="w-full overflow-hidden rounded-3xl bg-[#FAFBF9] dark:bg-stone-800/40 p-4 border border-stone-100 dark:border-stone-800 transition-all duration-300 group-hover:shadow-md">
                  <AccountSetupIllustration className="w-full h-auto transition-transform duration-500 group-hover:scale-105" />
                </div>
              </Link>
            </div>

            <div className="bg-[#FAFBF9] dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-100 dark:border-stone-800 text-center space-y-3">
              <div className="w-full max-w-[200px] mx-auto overflow-hidden rounded-xl border border-stone-100 dark:border-stone-700">
                <MapIllustration />
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-4 text-xs transition shadow-sm active:scale-95 focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                Launch Dispatch Scanner 🎯
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Popup Overlay */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Dispatch Location Scanner"
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-stone-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 relative shadow-2xl border border-stone-100 dark:border-stone-800"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close modal"
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-800 w-9 h-9 rounded-full flex items-center justify-center transition font-bold"
            >
              ✕
            </button>

            <UpdateLocation onOrderAssigned={() => setIsModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
