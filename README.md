# Velora Store

![Velora](public/velora-hero.webp)

**An Arabic-first cosmetics storefront for the Egyptian market** — catalog, cart, cash-on-delivery and wallet checkout, promotions with scheduled windows, and a role-based admin dashboard, all backed by Firebase.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel)](https://vercel.com)

## Live

- **Storefront:** https://velora-store-navy.vercel.app
- **Admin dashboard:** https://velora-store-navy.vercel.app/admin (restricted to provisioned admin accounts)

## Features

### Storefront
- Arabic (RTL) catalog with categories, filters, search, product pages with shade/size selection, and wishlist
- Cart with server-reconciled prices, free-shipping progress bar, and promo code box
- Checkout supporting **cash on delivery** and **mobile wallet transfer**, with Egyptian governorate/phone validation
- Order confirmation with optional WhatsApp handoff
- Scheduled campaign banners (e.g. Black Friday countdown that appears and disappears on a fixed Cairo-time window)

### Admin dashboard (`/admin`)
- Email/password sign-in (Firebase Auth) with role-based access: **owner**, **manager**, **staff**, **notifier**
- Orders: status pipeline (`pending → confirmed → preparing → ready → out_for_delivery → delivered`, with cancellation), payment status, internal notes
- Products, categories, and inventory with stock tracking and per-change audit logs
- **Promotions:** percent or fixed-amount codes with minimum order, usage limits, start/end windows (`startsAt` / `expiresAt`), and usage counters
- Store settings (shipping fee, free-shipping threshold, minimum order, payment methods, social links)
- Every privileged write is paired with an `adminLogs` entry in the same batch

### Order notifications
- `POST /api/notify-order` (Vercel serverless function) sends a Telegram alert to the store owner for each new order
- The function trusts nothing from the caller: it takes only an order id, reads the order from Firestore using a **least-privilege `notifier` service account**, and records a once-only marker in `orderNotifications/{id}` so each order alerts exactly once

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, Tailwind CSS 3, React Router 7, lucide-react, Recharts |
| Backend | Cloud Firestore (data + security rules), Firebase Authentication |
| Serverless | Vercel Functions (`/api/notify-order`) |
| Hosting | Vercel (SPA with history-API rewrites and strict CSP headers) |
| Alerts | Telegram Bot API |
| Testing | Firestore security-rules suite on the local emulator (100 assertions) |

## Security model

The client is never trusted. Enforcement lives in `firestore.rules` on the server:

- Visitors can **create** a valid order — nothing else. No read, update, or delete on any order, including their own.
- Every order field is re-validated server-side: Egyptian mobile format, governorate whitelist, item count (max 4 lines), per-line quantity (max 10), **prices re-read from product documents**, shipping re-derived from store settings, discount recomputed from the promotion document, `status = pending`, server-side `createdAt`.
- Promo codes are validated on write: active flag, `startsAt` / `expiresAt` window, minimum order, and usage limit must all hold, and the claimed discount must match the rule's own computation.
- Admin writes require an active document in `admins/{uid}` with the right role, plus a fresh audit-log entry in the same batch.
- The `notifier` role can read a single order by id and create its notification marker — nothing more.
- No secrets in the repo. The web `apiKey` is non-secret by design; protection comes from the rules, App Check (reCAPTCHA v3), and API-key restrictions in Google Cloud.

## Getting started

### Prerequisites
- Node.js 20+
- A Firebase project with Firestore (production mode) and Email/Password auth enabled

### Setup

```bash
npm install
cp .env.example .env.local   # fill in your Firebase web app values
npm run dev
```

Deploy the security rules before taking orders (without them, order creation fails closed):

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project YOUR_PROJECT_ID
```

Seed the initial catalog (products, categories, store settings); idempotent — creates only what is missing:

```bash
ACCESS_TOKEN=<oauth-token> node scripts/seed.mjs
```

### Security-rules tests

Runs the full rules suite against the local Firestore emulator (requires a JRE):

```bash
npm run test:rules
```

## Environment variables

### Frontend (`VITE_*`, set in Vercel and `.env.local`)

| Variable | Purpose |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project id |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender id |
| `VITE_FIREBASE_APP_ID` | Firebase app id |
| `VITE_WHATSAPP_NUMBER` | Optional. Store WhatsApp in international format; enables the WhatsApp checkout option |
| `VITE_WALLET_NUMBER` | Optional. Mobile wallet number; enables the wallet payment option |
| `VITE_RECAPTCHA_SITE_KEY` | Optional, recommended. reCAPTCHA v3 site key for App Check |
| `VITE_USE_EMULATOR` | Dev only. Point the client at the local Firestore emulator |
| `VITE_FIRESTORE_EMULATOR_PORT` | Dev only. Emulator port |
| `VITE_APPCHECK_DEBUG_TOKEN` | Dev only. App Check debug token |

### Serverless function (Vercel project env)

| Variable | Purpose |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Bot token for order alerts |
| `TELEGRAM_CHAT_ID` | Recipient chat id for alerts |
| `NOTIFIER_EMAIL` | Service-account email with the `notifier` role |
| `NOTIFIER_PASSWORD` | Service-account password |
| `VITE_FIREBASE_API_KEY` / `VITE_FIREBASE_PROJECT_ID` | Reused by the function for Firebase sign-in |

### Seed script

| Variable | Purpose |
| --- | --- |
| `ACCESS_TOKEN` | OAuth access token for the Firestore REST API |
| `PROJECT_ID` | Optional project override (defaults to `velora-10`) |

## Deployment

- **Frontend + function:** push to `main`; Vercel builds and deploys automatically. `vercel.json` provides the SPA rewrite and security headers (CSP, frame, referrer, permissions policies).
- **Firestore rules:** deploy manually after any change to `firestore.rules`:
  ```bash
  npx firebase-tools deploy --only firestore:rules --project YOUR_PROJECT_ID
  ```
- **Telegram function:** set the serverless env vars above, then the storefront calls `/api/notify-order` after each order is created.

## Repository structure

```
├── api/
│   └── notify-order.js        # Vercel function: Telegram order alerts (least-privilege notifier)
├── public/                    # Static assets (logo, hero, product images)
├── scripts/
│   └── seed.mjs               # Idempotent Firestore seed (products, categories, settings)
├── src/
│   ├── admin/                 # Admin dashboard (auth context, pages, RBAC-aware writes, audit logs)
│   ├── components/            # Storefront components (layout, catalog, product, cart)
│   ├── config/                # Store constants derived from env
│   ├── context/               # Catalog, cart, and store contexts
│   ├── data/                  # Product model mapping
│   ├── firebase/              # Firebase client init (with optional emulator/App Check)
│   ├── pages/                 # Storefront pages (home, catalog, product, checkout, order, info)
│   ├── services/              # Order creation service
│   └── utils/                 # Storage, sanitization, WhatsApp helpers
├── tests/
│   └── firestore.rules.test.mjs  # Security-rules test suite (emulator)
├── firestore.rules            # All server-side authorization and validation
├── firebase.json              # Firestore rules + emulator config
└── vercel.json                # SPA rewrite + security headers
```
