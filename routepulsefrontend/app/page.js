"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getAllCategories, getAllProducts, getOneProductById } from "../lib/productsApi";
import { addProductToOrder } from "../lib/api";
import CategoryFilter from "../components/categoryFilter";
import { useToast } from "../components/Toast";

const SORTS = {
  featured: { label: "Featured", fn: null },
  priceAsc: { label: "Price: low to high", fn: (a, b) => a.price - b.price },
  priceDesc: { label: "Price: high to low", fn: (a, b) => b.price - a.price },
  rating: { label: "Top rated", fn: (a, b) => (b.rating || 0) - (a.rating || 0) },
};

const STEPS = [
  { icon: "🛒", title: "Order", text: "Pick groceries and drop a pin on the map." },
  { icon: "🧭", title: "Pulse routing", text: "Nearby drivers get the closest order first, with a smart multi-stop route." },
  { icon: "📍", title: "Track", text: "See who is delivering and how long it will take." },
];

export default function Home() {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("featured");
  const [loadingList, setLoadingList] = useState(true);
  const [busy, setBusy] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
        if (active) setHasToken(Boolean(token));
        const [data, cats] = await Promise.all([getAllProducts(), getAllCategories()]);
        if (!active) return;
        setProducts(data?.products || data || []);
        setCategories(cats || []);
      } catch (error) {
        if (!active) return;
        if (process.env.NODE_ENV !== "production") {
          console.error("Error fetching products", error);
        }
        showToast("Could not load the catalogue. Please refresh.", "error");
      } finally {
        if (active) setLoadingList(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [showToast]);

  // Close the modal with Escape.
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setSelectedProduct(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleProductClick = async (id) => {
    setBusy(true);
    const result = await getOneProductById(id);
    if (result) setSelectedProduct(result);
    setBusy(false);
  };

  // Previously this never added anything - it only redirected. Now it really adds to the order.
  const handleConfirmAddToCart = async (product) => {
    if (!sessionStorage.getItem("token")) {
      showToast("Log in to add items to your order", "info");
      router.push("/auth/log");
      return;
    }
    setBusy(true);
    const result = await addProductToOrder(product._id || product.id);
    setBusy(false);
    if (!result || result.success === false) {
      showToast(result?.message || "Could not add item. Try again.", "error");
      return;
    }
    showToast(`${product.title} added to your order`);
    setSelectedProduct(null);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter(
      (p) =>
        (selectedCategory === "all" || p.category === selectedCategory) &&
        (!q || p.title?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)),
    );
    const sorter = SORTS[sortKey].fn;
    if (sorter) list = [...list].sort(sorter);
    return list;
  }, [products, selectedCategory, query, sortKey]);

  return (
    <main className="relative min-h-screen w-full bg-[#FAFBF9] text-slate-800 flex flex-col overflow-hidden font-sans">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-lime-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top navigation */}
      <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-sm font-bold text-white shadow-md shadow-orange-500/20">
              RP
            </span>
            <span className="text-base font-extrabold tracking-tight text-stone-900">RoutePulse</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3 text-sm font-semibold">
            {hasToken ? (
              <Link href="/dashboard" className="rounded-xl bg-[#162B22] px-4 py-2 text-white hover:bg-[#1e3b2f]">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/log" className="rounded-xl px-4 py-2 text-stone-700 hover:bg-stone-100">
                  Log in
                </Link>
                <Link href="/auth" className="rounded-xl bg-[#162B22] px-4 py-2 text-white hover:bg-[#1e3b2f]">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <div className="flex-1 w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Hero */}
        <section className="rounded-3xl bg-[#162B22] p-6 sm:p-10 text-white shadow-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Smart last-mile delivery
          </span>
          <h1 className="mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">
            Groceries that arrive on the <span className="text-orange-400">shortest route</span>.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-stone-300 sm:text-base">
            RoutePulse matches every order with the nearest driver and plans the fastest multi-stop route, so food gets
            there fresher, and drivers waste less time and fuel.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Step {i + 1}
                </p>
                <p className="mt-1 font-bold">
                  {s.icon} {s.title}
                </p>
                <p className="mt-1 text-xs text-stone-300">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Catalogue */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-stone-200/80 p-5 sm:p-8 shadow-xl shadow-stone-900/5">
          <div className="flex flex-col gap-4 mb-6 border-b border-stone-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 rounded-full border border-emerald-200/60">
                Live Catalog
              </span>
              <h2 className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                🛒 Supermarket Product Aisle
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {loadingList ? "Loading products..." : `${visible.length} products`}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[#65795C] focus:outline-none focus:ring-2 focus:ring-[#65795C]/30 sm:w-64"
              />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                aria-label="Sort products"
                className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#65795C] focus:outline-none"
              >
                {Object.entries(SORTS).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          <div className="mt-6 max-h-[550px] sm:max-h-[650px] overflow-y-auto pr-1 sm:pr-2">
            {loadingList ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-56 animate-pulse rounded-2xl bg-stone-100" />
                ))}
              </div>
            ) : visible.length === 0 ? (
              <p className="py-16 text-center text-sm text-stone-500">No products match your search.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {visible.map((product) => {
                  const prodId = product._id || product.id;
                  const prodImage = product.thumbnail || product.images?.[0];
                  return (
                    <button
                      type="button"
                      key={prodId}
                      onClick={() => handleProductClick(prodId)}
                      className="group relative p-4 text-left rounded-2xl bg-white border border-stone-200/70 hover:border-[#65795C]/50 hover:shadow-xl hover:shadow-stone-900/5 cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden"
                    >
                      <div>
                        {prodImage && (
                          <div className="relative w-full h-32 sm:h-36 bg-stone-50 rounded-xl overflow-hidden mb-3.5 border border-stone-100 flex items-center justify-center">
                            <Image
                              src={prodImage}
                              alt={product.title}
                              fill
                              unoptimized
                              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            />
                          </div>
                        )}
                        <span className="inline-block px-2.5 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50/80 rounded-md border border-emerald-200/60 mb-1.5">
                          {product.category || "Aisle Item"}
                        </span>
                        <p className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-[#65795C] transition-colors truncate">
                          {product.title}
                        </p>
                        {product.rating ? (
                          <p className="text-xs text-amber-600">★ {Number(product.rating).toFixed(1)}</p>
                        ) : null}
                      </div>
                      <div className="flex justify-between items-center mt-3 sm:mt-4 pt-3 border-t border-stone-100">
                        <span className="text-xs sm:text-sm font-bold text-[#65795C]">${product.price}</span>
                        <span className="text-[11px] sm:text-xs font-medium text-stone-400 group-hover:text-[#65795C]">
                          View Details &rarr;
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Product modal */}
        {selectedProduct && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-3 sm:p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={selectedProduct.title}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md sm:max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-stone-200"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                aria-label="Close"
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1"
              >
                ✕
              </button>

              {(selectedProduct.thumbnail || selectedProduct.images?.[0]) && (
                <div className="relative w-full h-40 sm:h-48 bg-stone-50 rounded-2xl overflow-hidden flex items-center justify-center border border-stone-100">
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
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
                    {selectedProduct.category}
                  </span>
                  <h3 className="text-lg sm:text-2xl font-bold text-slate-900 mt-2">{selectedProduct.title}</h3>
                </div>
                <span className="text-base sm:text-xl font-bold text-[#65795C] shrink-0">${selectedProduct.price}</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                {selectedProduct.description}
              </p>

              <div className="pt-3 sm:pt-4 border-t border-stone-100 flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => handleConfirmAddToCart(selectedProduct)}
                  disabled={busy}
                  className="w-full sm:flex-1 rounded-xl bg-[#65795C] py-3 text-sm font-bold text-white hover:bg-[#53634b] transition-colors shadow-sm active:scale-[0.99] disabled:opacity-60"
                >
                  {busy ? "Adding..." : "Add to Cart"}
                </button>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="w-full sm:flex-1 rounded-xl border border-stone-200 py-3 text-sm font-semibold text-slate-700 hover:bg-stone-50 transition-colors active:scale-[0.99]"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        )}

        {busy && !selectedProduct && (
          <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-stone-900 text-stone-100 text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl animate-pulse z-50">
            Fetching item...
          </div>
        )}
        {toast}
      </div>

      <footer className="border-t border-stone-200/70 py-6 text-center text-xs text-stone-500">
        © 2026 RoutePulse - smart supermarket delivery
      </footer>
    </main>
  );
}
