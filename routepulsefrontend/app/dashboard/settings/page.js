'use client';

import { useState } from 'react';
import { useAuth } from '../../../context/AuthProvider';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [preferredTransport, setPreferredTransport] = useState('bicycle');
  const [themeMode, setThemeMode] = useState('system');

  if (loading) {
    return (
      <div className="p-8 text-stone-500 dark:text-stone-400 text-sm flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#162B22] dark:border-stone-400 border-t-transparent" />
        Loading profile settings...
      </div>
    );
  }

  const userRole = user?.role?.trim() || 'Customer';

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-stone-400">
          Manage your personal preferences, notifications, and delivery options.
        </p>
      </div>

      {saved && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 p-4 text-sm font-semibold text-emerald-800 dark:text-emerald-300 transition-all shadow-sm"
        >
          ✓ Preferences saved successfully!
        </div>
      )}

      {/* Profile Overview Card */}
      <section className="rounded-3xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white text-xl font-bold shadow-md shadow-orange-500/20">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'RP'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {user?.name || 'RoutePulse User'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-stone-400">
                {user?.email || 'Logged in via session'}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-950/60 px-3.5 py-1 text-xs font-bold text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
            Role: {userRole}
          </span>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-stone-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                defaultValue={user?.name || ''}
                readOnly
                className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-slate-600 dark:text-stone-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-stone-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                defaultValue={user?.email || ''}
                readOnly
                className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-slate-600 dark:text-stone-300"
              />
            </div>
          </div>

          {/* Role-Specific Configuration */}
          {userRole === 'Driver' ? (
            <div className="space-y-4 pt-4 border-t border-stone-100 dark:border-stone-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Driver & Vehicle Preferences
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1.5">
                    Vehicle Type
                  </label>
                  <select
                    value={preferredTransport}
                    onChange={(e) => setPreferredTransport(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#65795C]"
                  >
                    <option value="bicycle">🚲 Bicycle Courier</option>
                    <option value="motorbike">🛵 Motorbike Rapid</option>
                    <option value="truck">🚚 Cargo Truck</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1.5">
                    Max Delivery Radius
                  </label>
                  <select
                    defaultValue="15"
                    className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#65795C]"
                  >
                    <option value="5">Within 5 km</option>
                    <option value="15">Within 15 km (Recommended)</option>
                    <option value="30">Within 30 km</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-4 border-t border-stone-100 dark:border-stone-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Customer Delivery Preferences
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1.5">
                    Default Drop-off Instructions
                  </label>
                  <input
                    type="text"
                    defaultValue="Leave at front door or reception"
                    className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#65795C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1.5">
                    Delivery Speed Preference
                  </label>
                  <select
                    defaultValue="fastest"
                    className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#65795C]"
                  >
                    <option value="fastest">⚡ Pulse Priority (Fastest)</option>
                    <option value="eco">🌱 Eco-Friendly (Consolidated)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* System & Notifications */}
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              System & Appearance
            </h3>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-stone-200">
                  Live Dispatch Notifications
                </p>
                <p className="text-xs text-slate-500 dark:text-stone-400">
                  Get real-time audio and visual alerts when route or order changes occur.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="h-5 w-5 accent-[#65795C] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-stone-200">
                  Color Theme
                </p>
                <p className="text-xs text-slate-500 dark:text-stone-400">
                  Adapts automatically to system dark mode (prefers-color-scheme).
                </p>
              </div>
              <select
                value={themeMode}
                onChange={(e) => setThemeMode(e.target.value)}
                className="rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-white"
              >
                <option value="system">Auto (prefers-color-scheme)</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-stone-100 dark:border-stone-800">
            <Link
              href="/dashboard"
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-stone-200 transition-colors"
            >
              ← Back to Dashboard
            </Link>
            <button
              type="submit"
              className="rounded-xl bg-[#162B22] hover:bg-[#1f3c2f] dark:bg-stone-100 dark:text-stone-900 px-6 py-2.5 text-sm font-bold text-white transition-all shadow-sm active:scale-95 focus-visible:ring-2 focus-visible:ring-[#65795C]"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
