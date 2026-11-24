"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  getOneProductById,
  getAllProducts,
  getAllCategories,
} from "../lib/productsApi";
import { addProductToOrder } from "../lib/api";
import CategoryFilter from "../components/categoryFilter";
import PromoBanner from "../components/PromoBanner";
import { useToast } from "./Toast";

export default function CustomerDashboard() {
  const { toast, showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    let active = true;
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getAllProducts();
        const categoriesData = await getAllCategories();
        if (active) {
          setProducts(data?.products || data || []);
          setCategories(categoriesData || []);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error fetching products", error);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      active = false;
    };
  }, []);

  // Handle modal escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSelectedProduct(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleProductClick = async (id) => {
    try {
      setLoading(true);
      const result = await getOneProductById(id);
      if (result) {
        setSelectedProduct(result);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error handling product click", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAddToCart = async (product) => {
    try {
      setLoading(true);
      const productId = product._id || product.id;
      const result = await addProductToOrder(Number(productId));
      if (result && result.success === false) {
        showToast(result.message || "Could not add item to order", "error");
      } else {
        showToast(`${product.title} added to your order! 🛒`);
      }
      setSelectedProduct(null);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error adding product to order", error);
      }
      showToast("Could not add product. Please retry.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filter products dynamically based on the selected category
  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((product) => product.category === selectedCategory);

  return (
    <main className="relative min-h-screen w-full bg-[#FAFBF9] dark:bg-stone-950 text-slate-800 dark:text-stone-100 flex flex-col overflow-hidden font-sans">
      <PromoBanner
        onExplore={() => {
          window.scrollTo({ top: 400, behavior: "smooth" });
        }}
      />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100/50 dark:bg-emerald-950/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-lime-100/40 dark:bg-lime-950/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="flex-1 w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Main Section Card */}
        <div className="rounded-3xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border border-stone-200/80 dark:border-stone-800 p-5 sm:p-8 shadow-xs">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 border-b border-stone-100 dark:border-stone-800 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-full border border-emerald-200/60 dark:border-emerald-800">
                  Live Grocery Catalog
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                🛒 Supermarket Product Aisle
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-stone-400 max-w-sm">
              Click any item to inspect details and add to your live delivery route.
            </p>
          </div>

          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Dynamic Product Grid */}
          <div className="mt-6 max-h-[550px] sm:max-h-[650px] overflow-y-auto pr-1 sm:pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {filteredProducts.map((product) => {
                const prodId = product._id || product.id;
                const prodImage = product.thumbnail || product.images?.[0];

                return (
                  <div
                    key={prodId}
                    onClick={() => handleProductClick(prodId)}
                    className="group relative p-3.5 rounded-2xl bg-white dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800 hover:border-[#65795C]/60 hover:shadow-lg cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden"
                  >
                    <div>
                      {/* Image Container with Floating Badge */}
                      {prodImage && (
                        <div className="relative w-full h-40 sm:h-44 bg-stone-50/80 dark:bg-stone-800 rounded-xl overflow-hidden mb-3 border border-stone-100 dark:border-stone-700 flex items-center justify-center p-3">
                          <span className="absolute top-2.5 left-2.5 z-10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md rounded-md shadow-xs border border-emerald-100 dark:border-emerald-800">
                            {product.category || "Item"}
                          </span>
                          <Image
                            src={prodImage}
                            alt={product.title}
                            fill
                            unoptimized
                            className="object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                        </div>
                      )}

                      {!prodImage && (
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-md border border-emerald-200/60 dark:border-emerald-800 mb-1.5">
                          {product.category || "Aisle Item"}
                        </span>
                      )}

                      <p className="font-semibold text-slate-800 dark:text-stone-100 text-sm sm:text-base group-hover:text-[#65795C] transition-colors line-clamp-2 px-1">
                        {product.title}
                      </p>
                    </div>

                    {/* Footer Price & Action */}
                    <div className="flex justify-between items-center mt-4 pt-3 px-1 border-t border-stone-100 dark:border-stone-800">
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        ${Number(product.price || 0).toFixed(2)}
                      </span>
                      <span className="text-xs font-semibold text-[#65795C] dark:text-emerald-400 bg-[#65795C]/10 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg group-hover:bg-[#65795C] group-hover:text-white transition-all duration-300 flex items-center gap-1">
                        View &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* POPUP MODAL */}
        {selectedProduct && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-3 sm:p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={selectedProduct.title}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md sm:max-w-lg rounded-3xl bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-stone-200 dark:border-stone-800"
            >
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                aria-label="Close modal"
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-full"
              >
                ✕
              </button>

              {(selectedProduct.thumbnail || selectedProduct.images?.[0]) && (
                <div className="relative w-full h-40 sm:h-48 bg-stone-50 dark:bg-stone-800 rounded-2xl overflow-hidden flex items-center justify-center border border-stone-100 dark:border-stone-700">
                  <Image
                    src={selectedProduct.thumbnail || selectedProduct.images[0]}
                    alt={selectedProduct.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              )}

              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-200/60 dark:border-emerald-800">
                    {selectedProduct.category}
                  </span>
                  <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mt-2">
                    {selectedProduct.title}
                  </h3>
                </div>
                <span className="text-base sm:text-xl font-bold text-[#65795C] dark:text-emerald-400 shrink-0">
                  ${Number(selectedProduct.price || 0).toFixed(2)}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-xl border border-stone-100 dark:border-stone-800">
                {selectedProduct.description}
              </p>

              <div className="pt-3 sm:pt-4 border-t border-stone-100 dark:border-stone-800">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => handleConfirmAddToCart(selectedProduct)}
                    className="w-full sm:flex-1 rounded-xl bg-[#65795C] hover:bg-[#53634b] py-3 text-sm font-bold text-white transition-colors shadow-sm active:scale-95"
                  >
                    Add to Cart
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="w-full sm:flex-1 rounded-xl border border-stone-200 dark:border-stone-700 py-3 text-sm font-semibold text-slate-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors active:scale-95"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-stone-900 text-stone-100 text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl animate-pulse z-50 border border-stone-700/50">
            Updating items...
          </div>
        )}
        {toast}
      </div>
    </main>
  );
}
