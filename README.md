# 🚀 RoutePulse — Smart Grocery Delivery

> **Next.js 16 · React 19 · Tailwind 4 · Leaflet · Supabase Google Auth**

RoutePulse matches every grocery order with the nearest driver and plans the **shortest multi-stop delivery route** in the browser — no extra backend needed for routing.

---

## ✨ Features

| # | Feature | Where |
|---|---------|-------|
| 1 | **Smart Route Planner** — nearest-neighbour + 2-opt, per-vehicle ETA | `lib/routeOptimizer.js` |
| 2 | **Nearest-order matching** for drivers using live GPS | `app/dashboard/driver_orders/` |
| 3 | **Live map checkout** — drop a pin, Nominatim reverse-geocodes the address | `components/map.js` |
| 4 | **Cart badge** in header — synced via `cartUpdated` custom event | `components/siteAnatomy.js` |
| 5 | **Order status timeline** — Placed → Driver assigned → On the way → Delivered | `components/ordersAndRoutes.js` |
| 6 | **Live ETA countdown** with pulsing indicator | `components/ordersAndRoutes.js` |
| 7 | **Driver stats bar** — deliveries / km / estimated earnings | `components/driverview.js` |
| 8 | **Online/offline toggle** for drivers | `components/driverview.js` |
| 9 | **"Start Navigation"** button → opens Google Maps directions | `app/dashboard/driver_orders/page.js` |
| 10 | **Dark mode** (follows `prefers-color-scheme`) | `app/globals.css` |
| 11 | **Keyboard-accessible modals** (Escape key, `aria-modal`, focus rings) | all modals |
| 12 | Full **responsive** layout down to 360 px | Tailwind classes |
| 13 | `next/image` for every product & promo image (LCP optimised) | all pages |

---

## 🏗️ Architecture

```
Browser (Next.js / Render)
│
├─ /app            ← App Router pages (RSC-compatible)
│   ├─ /           ← Landing / auth guard
│   ├─ /auth       ← Login / Register / Google OAuth
│   ├─ /explore    ← Product catalogue (DummyJSON API)
│   └─ /dashboard
│       ├─ /customer_view   ← Customer orders + map checkout
│       ├─ /driver_orders   ← Route planner + navigation
│       └─ /settings
│
├─ /components     ← Shared UI (Header, Sidebar, Map, OrderCards…)
├─ /lib
│   ├─ api.js          ← All 12 fetch calls to the backend
│   ├─ routeOptimizer.js  ← Haversine + nearest-neighbour + 2-opt
│   └─ supabase.js     ← Supabase client (Google OAuth)
├─ /context
│   └─ AuthProvider.js ← User session context
└─ /tests
    └─ routeOptimizer.test.js  ← 9 Vitest unit tests
```

```
Data flow
─────────
Browser ──HTTPS──▶ RoutePulse Backend (newhopoe.vercel.app / Node + MongoDB)
        ──HTTPS──▶ Supabase Auth (Google sign-in)
        ──HTTPS──▶ DummyJSON (product catalogue)
        ──HTTPS──▶ Nominatim (OpenStreetMap reverse-geocode, rate-limited)
```

---

## 📸 Screenshots

> _Add PNG files to `routepulsefrontend/public/screenshots/` and reference them here._

| Explore | Checkout Map | Driver Route |
|---------|-------------|-------------|
| `public/screenshots/explore.png` | `public/screenshots/checkout-map.png` | `public/screenshots/driver-route.png` |

---

## 🎬 3-Minute Demo Script

**Minute 1 — Customer journey**
1. Open the app → "Register" as a **Customer**.
2. Browse **Explore** → add 3 items to cart (badge increments in real time).
3. Go to **Dashboard → Orders** → "Checkout" → drop a pin on the map → submit.
4. Watch the **order status timeline** update: _Placed_ ✅

**Minute 2 — Driver journey**
1. Register (or log in) as a **Driver** → toggle **Online**.
2. Open **Driver Orders** → accept the nearest order → see the optimised multi-stop route.
3. Click **Start Navigation** → Google Maps opens turn-by-turn directions to the first stop.
4. Stats bar: _Deliveries · Km · Est. Earnings_ update live.

**Minute 3 — Live tracking**
1. Switch back to the customer account.
2. Refresh **My Orders** → status advances to _Driver assigned_ → _On the way_.
3. The **live ETA badge** (pulsing dot) shows estimated minutes remaining.
4. Toggle the browser to dark mode → entire UI switches automatically.

---

## 🏃 Run Locally

```bash
git clone https://github.com/furydarkknight/RoutePulse.git
cd RoutePulse/routepulsefrontend
cp .env.example .env.local   # fill in the values
npm install
npm run dev                  # http://localhost:3000
```

### Run tests
```bash
npm test          # 9 Vitest unit tests (routeOptimizer)
```

### Production build (simulates Render)
```powershell
# Windows PowerShell
$env:PORT = "10000"; npm run build; npm run start
```
```bash
# Linux / macOS (Render environment)
PORT=10000 npm run build && npm run start
```

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | ✅ | Backend URL — no trailing slash. Default: `https://newhopoe.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase public anon key |

> **⚠️ Build-time inlining**: `NEXT_PUBLIC_*` vars are baked into the JS bundle at build time.  
> **Redeploy** after changing any of them.

Copy `.env.example` → `.env.local` for local dev. Never commit `.env.local`.

---

## 🚀 Deploy on Render

### Option A — Blueprint (recommended, uses `render.yaml`)

1. Push this repo to GitHub.
2. Render Dashboard → **New** → **Blueprint** → select the repo.
3. Render reads `render.yaml` automatically:
   - Root Dir: `routepulsefrontend`
   - Build: `npm ci && npm run build`
   - Start: `npm run start`
   - Node 22, PORT injected automatically
4. Enter `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` when prompted.
5. Click **Apply** → Render builds and deploys.

### Option B — Manual Web Service

| Setting | Value |
|---------|-------|
| Runtime | **Node** |
| Root Directory | `routepulsefrontend` |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm run start` |
| Health Check Path | `/` |
| NODE_VERSION | `22` |

Add all 3 env vars in **Environment** tab.

### Post-deploy checklist

- [ ] **Supabase** → Authentication → URL Configuration:
  - Site URL: `https://<your-app>.onrender.com`
  - Redirect URL: `https://<your-app>.onrender.com/auth/callback`
- [ ] **Backend CORS** (`newhopoe.vercel.app`): allow your Render origin.
- [ ] Free tier sleeps after ~15 min idle — first cold start ≈ 30-60 s.

---

## 🔐 Security Notes

### sessionStorage vs httpOnly Cookies

The JWT token returned by `/api/login` is stored in **`sessionStorage`** (cleared on tab close).

| | sessionStorage | httpOnly Cookie |
|--|---------------|----------------|
| XSS risk | ⚠️ JS-readable | ✅ Not accessible to JS |
| CSRF risk | ✅ Not sent automatically | ⚠️ Needs CSRF token |
| Tab close | ✅ Cleared | ❌ Persists until expiry |
| SSR hydration | ✅ No mismatch | Needs careful handling |

**Trade-off accepted**: `sessionStorage` is acceptable for a demo/MVP because the token expires with the tab and there is no sensitive PII beyond the delivery address. For production with real payments, migrate to `httpOnly` cookies set by the backend.

### What is NOT committed
- `.env.local` — blocked by `.gitignore`
- Any secret keys — only `NEXT_PUBLIC_*` dummy values in `.env.example`
- Node modules, build artifacts (`.next/`, `out/`)

---

## 📂 Project Layout

```
RoutePulse/                     ← repo root (render.yaml here)
└── routepulsefrontend/         ← Next.js app root (package.json here)
    ├── app/                    ← App Router pages + layouts
    ├── components/             ← Shared React components
    ├── context/                ← AuthProvider (React context)
    ├── lib/                    ← api.js, routeOptimizer.js, supabase.js
    ├── tests/                  ← Vitest unit tests
    ├── public/                 ← Static assets
    ├── .env.example            ← Environment variable template
    ├── next.config.ts          ← Next.js config (image domains, headers)
    └── render.yaml             ← (at repo root) Render Blueprint
```

---

## 🧪 Backend Endpoints

| Method | Path | Used by |
|--------|------|---------|
| POST | `/api/register` | Auth page |
| POST | `/api/login` | Auth page |
| GET | `/api/user` | AuthProvider |
| POST | `/api/google-auth` | Supabase callback |
| POST | `/api/add-product` | Add to cart |
| DELETE | `/api/delete-product/:id` | Remove from cart |
| GET | `/api/get-orders` | Customer orders |
| PATCH | `/api/update-product-quantity/:id` | Quantity update |
| POST | `/api/confirm-order` | Checkout |
| POST | `/api/nearest-order` | Driver matching |
| POST | `/api/assign-driver` | Assign driver |
| GET | `/api/get_orders` | Driver orders (fallback) |
| POST | `/api/see-driver` | Customer driver tracking |

Backend hosted at `https://newhopoe.vercel.app` (Node.js + MongoDB).

---

*Made with ❤️ — Next.js 16 · React 19 · Tailwind 4 · Leaflet · Supabase*
