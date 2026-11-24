'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAllOrders } from '../lib/api';

export function Footer() {
  return (
    <footer className="border-t border-stone-200/60 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 backdrop-blur-md py-5 px-6 sm:px-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-xs text-stone-500 dark:text-stone-400 gap-4">
      <p className="font-medium">
        © 2026 <span className="text-stone-700 dark:text-stone-200 font-semibold">RoutePulse</span> & Smart Supermarket System. All rights reserved.
      </p>
      <div className="flex items-center space-x-6 font-medium">
        <Link href="/" className="hover:text-orange-600 transition-colors">
          Storefront
        </Link>
        <Link href="/dashboard" className="hover:text-orange-600 transition-colors">
          Dashboard
        </Link>
        <Link href="/dashboard/settings" className="hover:text-orange-600 transition-colors">
          Settings
        </Link>
      </div>
    </footer>
  );
}

const NAV_ITEMS = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/dashboard/ordersAndRoutes', icon: '📦', label: 'Orders & Routes' },
  { href: '/dashboard/discover-Drivers', icon: '🚚', label: 'My Driver' },
  { href: '/dashboard/settings', icon: '⚙️', label: 'Settings' },
];

export function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-68 border-r border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl p-5 sm:p-6 flex flex-col min-h-screen shrink-0 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:min-h-[calc(100vh-4rem)] shadow-xl md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile Close Header */}
        <div className="flex items-center justify-between md:hidden mb-6 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/20">
              RP
            </div>
            <span className="font-bold text-stone-900 dark:text-white text-sm tracking-tight">Navigation</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Navigation Menu Links */}
        <div className="space-y-1.5">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">
            Platform Menu
          </p>
          
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex items-center space-x-3 rounded-xl px-3.5 py-2.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                  active
                    ? 'bg-orange-50/80 dark:bg-orange-950/40 font-semibold text-orange-950 dark:text-orange-200 border border-orange-200/50 dark:border-orange-800/50 shadow-2xs'
                    : 'font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100/70 dark:hover:bg-stone-800/70 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <span className="text-base group-hover:scale-110 transition-transform">{item.icon}</span>
                <span>{item.label}</span>
                {active && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-orange-500" />}
              </Link>
            );
          })}
        </div>

        {/* Bottom Help Card */}
        <div className="mt-auto pt-6 border-t border-stone-100 dark:border-stone-800">
          <div className="rounded-2xl bg-gradient-to-br from-stone-50 to-orange-50/30 dark:from-stone-800/50 dark:to-orange-950/20 p-4 border border-stone-200/60 dark:border-stone-800 shadow-2xs">
            <p className="text-xs font-bold text-stone-900 dark:text-white">Dispatcher Support</p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
              Multi-stop 2-opt TSP routing with live driver updates.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

function CartBadge() {
  const [count, setCount] = useState(0);

  const refreshCart = async () => {
    try {
      if (typeof window === "undefined") return;
      const token = sessionStorage.getItem("token");
      if (!token) return;

      const res = await getAllOrders();
      if (res && res.success && Array.isArray(res.data)) {
        let total = 0;
        res.data.forEach((order) => {
          if (order.status?.toLowerCase() === "active" && Array.isArray(order.items)) {
            total += order.items.reduce((acc, it) => acc + (it.quantity || 1), 0);
          }
        });
        setCount(total);
      }
    } catch {
      // quiet fail
    }
  };

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) refreshCart();
    }, 0);

    const onUpdate = () => {
      if (active) refreshCart();
    };

    window.addEventListener("cartUpdated", onUpdate);
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener("cartUpdated", onUpdate);
    };
  }, []);

  return (
    <Link
      href="/dashboard/ordersAndRoutes"
      className="relative inline-flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-stone-200 hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400 transition shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
      title="View Active Cart and Orders"
    >
      <span aria-hidden="true">🛒</span>
      <span className="hidden sm:inline">Cart</span>
      {count > 0 && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-600 px-1 text-[11px] font-black text-white animate-pulse">
          {count}
        </span>
      )}
    </Link>
  );
}

export function Header({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-stone-200/80 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 px-4 sm:px-8 backdrop-blur-xl shadow-xs">
      <div className="flex items-center space-x-3.5">
        {/* Mobile Hamburger Trigger */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          aria-label="Open Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link href="/" className="flex items-center space-x-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            RP
          </div>
          <div>
            <span className="text-sm sm:text-base font-extrabold tracking-tight text-stone-900 dark:text-white block leading-tight">
              RoutePulse
            </span>
            <span className="text-[10px] font-medium text-stone-400 dark:text-stone-500 tracking-wider uppercase block">
              Logistics & Fleet
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center space-x-3">
        {/* Header Cart Badge */}
        <CartBadge />

        {/* Online Status Pill */}
        <div className="inline-flex items-center rounded-full bg-emerald-50/80 dark:bg-emerald-950/50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800 shadow-2xs backdrop-blur-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse shadow-xs shadow-emerald-500/50"></span>
          <span className="hidden sm:inline">System </span>Online
        </div>
      </div>
    </header>
  );
}
