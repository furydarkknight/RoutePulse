"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  getAllOrders,
  deleteProductFromOrderApi,
  handleUpdateQuantity,
} from "../lib/api";
import { getOneProductById } from "../lib/productsApi";

const TIMELINE_STEPS = [
  { id: "placed", label: "Placed", icon: "📝" },
  { id: "assigned", label: "Driver assigned", icon: "🛵" },
  { id: "transit", label: "On the way", icon: "🚀" },
  { id: "delivered", label: "Delivered", icon: "✓" },
];

function getTimelineIndex(order) {
  const status = (order.status || "").toLowerCase();
  if (status.includes("deliver") || status.includes("complet")) return 3;
  if (status.includes("transit") || status.includes("way") || status.includes("route")) return 2;
  if (status.includes("assign") || order.driverId || order.driver) return 1;
  return 0; // Placed
}

function calculateLiveEta(order, timelineIdx) {
  if (timelineIdx === 3) return "Completed";
  const created = new Date(order.createdAt || Date.now()).getTime();
  const now = Date.now();
  const elapsedMinutes = Math.floor((now - created) / 60000);

  // Dynamic estimate based on progress
  let remainingMin = 25 - elapsedMinutes;
  if (timelineIdx === 2) remainingMin = Math.max(8, remainingMin);
  else if (timelineIdx === 1) remainingMin = Math.max(16, remainingMin);
  else remainingMin = Math.max(22, remainingMin);

  const etaTime = new Date(now + remainingMin * 60000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `~${remainingMin} min (by ${etaTime})`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchOrdersWithProducts = async () => {
      try {
        const result = await getAllOrders();
        if (!active) return;
        if (result && result.success) {
          const enrichedOrders = await Promise.all(
            (result.data || []).map(async (order) => {
              if (!order.items) return order;

              const enrichedItems = await Promise.all(
                order.items.map(async (item) => {
                  try {
                    const productData = await getOneProductById(item.productId);
                    return {
                      ...item,
                      title: productData?.title || "Groceries Item",
                      price: productData?.price || 0,
                      thumbnail:
                        productData?.thumbnail ||
                        productData?.images?.[0] ||
                        "",
                    };
                  } catch {
                    return item;
                  }
                })
              );

              return { ...order, items: enrichedItems };
            })
          );

          if (active) setOrders(enrichedOrders);
        } else {
          if (active) setError(result?.message || "Failed to fetch orders");
        }
      } catch {
        if (active) setError("An unexpected error occurred while fetching orders.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchOrdersWithProducts();
    return () => {
      active = false;
    };
  }, []);

  const handleDeleteProduct = async (productId) => {
    try {
      setDeletingId(productId);
      const result = await deleteProductFromOrderApi(productId);

      if (result && result.success && result.data) {
        const updatedOrder = result.data;

        if (updatedOrder.items) {
          const enrichedItems = await Promise.all(
            updatedOrder.items.map(async (item) => {
              const existingOrder = orders.find(
                (o) => o._id === updatedOrder._id
              );
              const existingItem = existingOrder?.items?.find(
                (i) =>
                  (i.productId || i._id || i.id) ===
                  (item.productId || item._id || item.id)
              );

              if (existingItem?.title && existingItem.title !== "Groceries Item") {
                return {
                  ...item,
                  title: existingItem.title,
                  price: existingItem.price,
                  thumbnail: existingItem.thumbnail,
                };
              }
              try {
                const productData = await getOneProductById(item.productId);
                return {
                  ...item,
                  title: productData?.title || "Groceries Item",
                  price: productData?.price || 0,
                  thumbnail:
                    productData?.thumbnail || productData?.images?.[0] || "",
                };
              } catch {
                return item;
              }
            })
          );
          updatedOrder.items = enrichedItems;
        }

        setOrders((prev) =>
          prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
        );
      }
    } catch {
      // quiet fail
    } finally {
      setDeletingId(null);
    }
  };

  const handleQuantityUpdate = async (orderId, productId, change) => {
    try {
      setUpdatingId(productId);
      const result = await handleUpdateQuantity(productId, orderId, change);

      if (result && result.success && result.data) {
        const updatedOrder = result.data;

        if (updatedOrder.items) {
          const enrichedItems = await Promise.all(
            updatedOrder.items.map(async (item) => {
              const existingOrder = orders.find(
                (o) => o._id === updatedOrder._id
              );
              const existingItem = existingOrder?.items?.find(
                (i) =>
                  (i.productId || i._id || i.id) ===
                  (item.productId || item._id || item.id)
              );

              if (existingItem?.title && existingItem.title !== "Groceries Item") {
                return {
                  ...item,
                  title: existingItem.title,
                  price: existingItem.price,
                  thumbnail: existingItem.thumbnail,
                };
              }
              try {
                const productData = await getOneProductById(item.productId);
                return {
                  ...item,
                  title: productData?.title || "Groceries Item",
                  price: productData?.price || 0,
                  thumbnail:
                    productData?.thumbnail || productData?.images?.[0] || "",
                };
              } catch {
                return item;
              }
            })
          );
          updatedOrder.items = enrichedItems;
        }

        setOrders((prev) =>
          prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
        );
      }
    } catch {
      // quiet fail
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBF9] dark:bg-stone-950 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#162B22] dark:border-white border-t-transparent"></div>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium tracking-wide">
            Loading your orders & routes...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6 mt-10 bg-rose-50/50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 rounded-2xl text-rose-600 dark:text-rose-300">
        <p className="font-semibold text-sm">Unable to load orders</p>
        <p className="text-xs text-rose-500 mt-0.5">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBF9] dark:bg-stone-950 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-800 dark:text-stone-100">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <header className="flex items-center justify-between bg-white/90 dark:bg-stone-900 backdrop-blur-md px-6 py-5 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              My Orders & Live Route Status
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-stone-400 mt-0.5">
              Live tracking timeline, ETA, and cart dispatch controls.
            </p>
          </div>
          <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-3.5 py-1.5 rounded-full border border-emerald-200/60 dark:border-emerald-800">
            {orders.length} {orders.length === 1 ? "Order" : "Orders"}
          </span>
        </header>

        {/* Empty State */}
        {orders.length === 0 ? (
          <div className="text-center py-16 sm:py-20 bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 shadow-xs px-4">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200/60 dark:border-emerald-800">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-slate-900 dark:text-white font-bold text-base">No orders found</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-stone-400 mt-1 max-w-sm mx-auto leading-relaxed">
              When you place grocery orders, they will appear here with live multi-stop tracking.
            </p>
          </div>
        ) : (
          /* Orders List */
          <div className="space-y-6">
            {orders.map((order) => {
              const isActive = (order.status || "").toLowerCase() === "active";
              const timelineIdx = getTimelineIndex(order);
              const liveEta = calculateLiveEta(order, timelineIdx);

              return (
                <div
                  key={order._id}
                  className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-3xl p-5 sm:p-7 shadow-xs hover:shadow-md hover:border-[#65795C]/40 transition-all duration-300 space-y-6"
                >
                  {/* Order Meta Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
                    <div>
                      <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-semibold block">
                        Order Identifier
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-stone-200 font-mono mt-0.5">
                        {order._id}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Live ETA Badge */}
                      <span className="inline-flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-xs font-bold px-3 py-1 rounded-full">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </span>
                        ETA: {liveEta}
                      </span>

                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${
                          isActive
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800"
                            : "bg-stone-100 dark:bg-stone-800 text-slate-600 dark:text-stone-300 border border-stone-200/50 dark:border-stone-700"
                        }`}
                      >
                        {order.status || "Processing"}
                      </span>
                    </div>
                  </div>

                  {/* Order Status Timeline: Placed -> Driver assigned -> On the way -> Delivered */}
                  <div className="pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
                      Order Progress Timeline
                    </p>
                    <div className="relative flex items-center justify-between">
                      {/* Connecting Line */}
                      <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-stone-100 dark:bg-stone-800 z-0">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${(timelineIdx / 3) * 100}%` }}
                        />
                      </div>

                      {TIMELINE_STEPS.map((step, idx) => {
                        const isDone = idx < timelineIdx;
                        const isCurrent = idx === timelineIdx;

                        return (
                          <div key={step.id} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-xs font-bold transition-all shadow-xs ${
                                isDone
                                  ? "bg-emerald-500 text-white"
                                  : isCurrent
                                  ? "bg-[#162B22] text-white dark:bg-white dark:text-stone-900 ring-4 ring-emerald-100 dark:ring-emerald-950"
                                  : "bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
                              }`}
                            >
                              {isDone ? "✓" : step.icon}
                            </div>
                            <span
                              className={`mt-2 text-[10px] sm:text-xs font-semibold ${
                                isCurrent
                                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                                  : isDone
                                  ? "text-slate-700 dark:text-stone-300"
                                  : "text-stone-400"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Items List Strip */}
                  {order.items && order.items.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                        Ordered Items
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {order.items.map((item, idx) => {
                          const currentProductId = item.productId || item._id || item.id;
                          const isUpdating = updatingId === currentProductId;

                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-3 bg-stone-50/70 dark:bg-stone-800/50 p-3 rounded-2xl border border-stone-200/60 dark:border-stone-800 hover:bg-stone-100/60 dark:hover:bg-stone-800 transition-colors relative group"
                            >
                              {/* Item Thumbnail */}
                              {item.thumbnail ? (
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-white shrink-0">
                                  <Image
                                    src={item.thumbnail}
                                    alt={item.title || "Item"}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 bg-stone-200/70 dark:bg-stone-700 rounded-xl flex items-center justify-center text-[10px] text-stone-400 font-medium shrink-0">
                                  No img
                                </div>
                              )}

                              {/* Item Info */}
                              <div className="overflow-hidden flex-1 pr-6">
                                <p className="text-xs font-bold text-slate-800 dark:text-stone-100 truncate" title={item.title}>
                                  {item.title}
                                </p>
                                <p className="text-xs text-[#65795C] dark:text-emerald-400 font-extrabold mt-0.5">
                                  ${Number(item.price || 0).toFixed(2)}
                                </p>

                                {/* Quantity Increment / Decrement Controls */}
                                {isActive && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <button
                                      type="button"
                                      onClick={() => handleQuantityUpdate(order._id, currentProductId, -1)}
                                      disabled={isUpdating}
                                      className="w-6 h-6 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 hover:border-[#65795C] text-slate-600 dark:text-stone-200 hover:text-[#65795C] rounded-lg flex items-center justify-center text-xs font-bold shadow-xs transition-all disabled:opacity-50 active:scale-95"
                                      title="Decrease quantity"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs font-bold text-slate-700 dark:text-stone-300 min-w-[16px] text-center">
                                      {item.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleQuantityUpdate(order._id, currentProductId, 1)}
                                      disabled={isUpdating}
                                      className="w-6 h-6 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 hover:border-[#65795C] text-slate-600 dark:text-stone-200 hover:text-[#65795C] rounded-lg flex items-center justify-center text-xs font-bold shadow-xs transition-all disabled:opacity-50 active:scale-95"
                                      title="Increase quantity"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Remove Item Button */}
                              {isActive && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(currentProductId)}
                                  disabled={deletingId === currentProductId}
                                  className="absolute top-3 right-3 text-stone-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                                  title="Remove item"
                                >
                                  {deletingId === currentProductId ? (
                                    <span className="text-[10px] font-bold text-stone-400">...</span>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Integrated Bottom Checkout Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Ready to complete your purchase?</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Proceed to finalize all pending order items on the interactive map</p>
          </div>
          <Link
            href="/checkout"
            className="w-full sm:w-auto bg-[#65795C] hover:bg-[#53634b] text-white text-xs font-bold px-6 py-3 rounded-2xl shadow-md shadow-[#65795C]/25 transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
          >
            <span>Proceed to Checkout</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
