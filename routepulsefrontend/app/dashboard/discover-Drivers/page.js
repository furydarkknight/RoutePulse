"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAllOrders, getAssignedDriverForClient } from "../../../lib/api";

// The backend response shape isn't fixed, so read the driver from the common places.
const pickDriver = (res) => res?.driver || res?.data?.driver || res?.data || null;

export default function DiscoverDrivers() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState({}); // orderId -> driver | "none" | "error"
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await getAllOrders();
      setOrders(res?.success ? res.data || [] : []);
      setLoading(false);
    })();
  }, []);

  const reveal = async (orderId) => {
    setBusyId(orderId);
    const res = await getAssignedDriverForClient(orderId);
    const driver = pickDriver(res);
    setDrivers((d) => ({ ...d, [orderId]: res ? driver || "none" : "error" }));
    setBusyId(null);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900">Your Driver</h1>
          <p className="text-sm text-stone-500">See who is delivering each of your orders.</p>
        </div>
        <Link href="/dashboard" className="text-sm font-semibold text-[#65795C] hover:underline">
          &larr; Dashboard
        </Link>
      </div>

      {loading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-stone-100" />
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          You have no orders yet. Add items from the aisle and confirm an order to get a driver.
        </div>
      ) : (
        orders.map((order) => {
          const info = drivers[order._id];
          return (
            <div key={order._id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-stone-400">Order</p>
                  <p className="truncate font-mono text-sm font-bold text-slate-800">{order._id}</p>
                  <p className="text-xs capitalize text-stone-500">{order.status || "processing"}</p>
                </div>
                <button
                  onClick={() => reveal(order._id)}
                  disabled={busyId === order._id}
                  className="shrink-0 rounded-xl bg-[#162B22] px-4 py-2 text-xs font-bold text-white hover:bg-[#1e3b2f] disabled:opacity-50"
                >
                  {busyId === order._id ? "Checking..." : info ? "Refresh" : "Find my driver"}
                </button>
              </div>

              {info === "none" && (
                <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                  No driver has picked this order up yet. We will assign the nearest one soon.
                </p>
              )}
              {info === "error" && (
                <p className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                  Could not load driver details. Please try again.
                </p>
              )}
              {info && typeof info === "object" && (
                <dl className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-emerald-50 p-4 text-sm">
                  <div>
                    <dt className="text-[11px] font-bold uppercase text-emerald-700">Driver</dt>
                    <dd className="font-semibold text-slate-900">{info.name || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold uppercase text-emerald-700">Phone</dt>
                    <dd className="font-semibold text-slate-900">{info.phoneNumber || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold uppercase text-emerald-700">Vehicle</dt>
                    <dd className="font-semibold text-slate-900">{info.Car || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold uppercase text-emerald-700">Status</dt>
                    <dd className="font-semibold text-slate-900">{info.status || "On the way"}</dd>
                  </div>
                </dl>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
