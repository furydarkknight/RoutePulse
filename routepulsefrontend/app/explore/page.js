"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { addProductToOrder } from "../../lib/api";
import { getAllProducts } from "../../lib/productsApi";

export default function ExplorePage() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await getAllProducts();

        const productArray = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.products)
          ? response.products
          : Array.isArray(response?.data?.products)
          ? response.data.products
          : [];

        if (active) setProducts(productArray);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to fetch products:", err);
        }
        if (active) setError("Failed to load products. Please try again later.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      active = false;
    };
  }, []);

  // Modal escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSelectedProduct(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAddToCart = async (e, productId) => {
    e.stopPropagation();
    try {
      setAddedId(productId);
      await addProductToOrder(productId);
      setTimeout(() => setAddedId(null), 2000);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to add product to order:", err);
      }
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-[#FAFBF9] dark:bg-stone-950 text-slate-800 dark:text-stone-100 flex flex-col font-sans p-4 sm:p-6 lg:p-8">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100/40 dark:bg-emerald-950/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-lime-100/30 dark:bg-lime-950/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl p-6 shadow-xl shadow-[#162B22]/5 border border-stone-200/80 dark:border-stone-800">
          <div>
            <span className="px-3 py-1 text-xs font-bold text-[#162B22] dark:text-emerald-400 bg-[#162B22]/5 dark:bg-emerald-950/40 rounded-full border border-[#162B22]/15 dark:border-emerald-800">
              Explore Showcase
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
              ✨ Discover Curated Groceries
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              Browse products live from the catalog and add them to your delivery route.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl bg-[#162B22] dark:bg-stone-100 dark:text-stone-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#1f3c2f] self-start sm:self-auto"
          >
            Go to Dashboard &rarr;
          </Link>
        </div>

        {/* Error State */}
        {error && (
          <div role="alert" className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-2xl text-xs sm:text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-72 rounded-3xl bg-stone-100 dark:bg-stone-800/60 animate-pulse border border-stone-200/50 dark:border-stone-800"
              />
            ))}
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const productId = product.id || product._id;
              const productImage =
                product.thumbnail ||
                product.image ||
                product.images?.[0] ||
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800";

              return (
                <div
                  key={productId}
                  onClick={() => setSelectedProduct(product)}
                  className="group relative p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-[#162B22]/50 hover:shadow-xl cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Image Container */}
                    <div className="relative w-full h-44 bg-stone-50 dark:bg-stone-800 rounded-2xl overflow-hidden mb-4 border border-stone-100 dark:border-stone-700 flex items-center justify-center p-3">
                      {product.category && (
                        <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#162B22] dark:text-emerald-300 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md rounded-lg shadow-xs border border-emerald-100 dark:border-emerald-800">
                          {product.category}
                        </span>
                      )}
                      <Image
                        src={productImage}
                        alt={product.title || "Product"}
                        fill
                        unoptimized
                        className="object-cover rounded-xl group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-[#162B22] dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {product.title}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 gap-2">
                    <span className="text-base font-extrabold text-[#162B22] dark:text-emerald-400 shrink-0">
                      ${typeof product.price === "number" ? product.price.toFixed(2) : product.price}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                        }}
                        className="text-xs font-bold text-[#162B22] dark:text-stone-200 bg-[#162B22]/5 dark:bg-stone-800 px-2.5 py-1.5 rounded-xl hover:bg-[#162B22] hover:text-white transition-all duration-300"
                      >
                        Inspect
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(e, Number(productId))}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all duration-300 ${
                          addedId === productId
                            ? "bg-emerald-600 text-white"
                            : "text-[#162B22] dark:text-stone-200 bg-[#162B22]/5 dark:bg-stone-800 hover:bg-[#162B22] hover:text-white"
                        }`}
                      >
                        {addedId === productId ? "✓ Added" : "Add +"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Inspection Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 backdrop-blur-xs p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={selectedProduct.title}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-2xl space-y-4 border border-stone-200 dark:border-stone-800 animate-in fade-in zoom-in-95 duration-200"
          >
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              aria-label="Close modal"
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-2 rounded-full bg-stone-100 dark:bg-stone-800 transition-colors"
            >
              ✕
            </button>

            <div className="relative w-full h-56 bg-stone-50 dark:bg-stone-800 rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-700 flex items-center justify-center">
              <Image
                src={
                  selectedProduct.thumbnail ||
                  selectedProduct.image ||
                  selectedProduct.images?.[0] ||
                  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800"
                }
                alt={selectedProduct.title || "Product"}
                fill
                unoptimized
                className="object-cover"
              />
            </div>

            <div>
              {selectedProduct.category && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#162B22] dark:text-emerald-300 bg-[#162B22]/5 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-[#162B22]/15 dark:border-emerald-800">
                  {selectedProduct.category}
                </span>
              )}
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                {selectedProduct.title}
              </h3>
              <p className="text-lg font-extrabold text-[#162B22] dark:text-emerald-400 mt-1">
                ${typeof selectedProduct.price === "number" ? selectedProduct.price.toFixed(2) : selectedProduct.price}
              </p>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-2 leading-relaxed bg-stone-50 dark:bg-stone-800/50 p-3.5 rounded-xl border border-stone-100 dark:border-stone-800">
                {selectedProduct.description}
              </p>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={(e) => handleAddToCart(e, Number(selectedProduct.id || selectedProduct._id))}
                className="flex-1 rounded-xl bg-[#162B22] hover:bg-[#1f3c2f] dark:bg-stone-100 dark:text-stone-900 py-3 text-sm font-bold text-white transition active:scale-95 shadow-sm"
              >
                Add to Cart 🛒
              </button>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="flex-1 rounded-xl border border-stone-200 dark:border-stone-700 py-3 text-sm font-semibold text-slate-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
