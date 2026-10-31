# VAYA Admin Panel & Firebase Backend Documentation

A production-ready private administration dashboard and serverless backend for VAYA, built with Next.js 14 App Router, Firebase Authentication (Google provider), Cloud Firestore, and Recharts.

---

## 1. Architecture Overview

- **Public Client (`/`)**: Existing landing page visuals, GSAP animations, Three.js earth, and styling are 100% preserved. Includes a non-blocking tracking provider (`/api/track`) and a subtle "Admin" footer link.
- **Serverless Backend (`/api/*`)**: Runs on Node.js runtime (`export const runtime = "nodejs"`). Enforces cryptographic session verification via `firebase-admin`, honeypot bot filtering, and in-memory rate limiting.
- **Private Admin (`/admin`)**:
  - `/admin/login`: Google OAuth Popup via Firebase Client SDK. Restricted exclusively to `chotimonino1@gmail.com`.
  - `/admin`: High-level analytics overview, 4 KPI cards with % delta vs previous period, Traffic & Growth line charts (Daily/Weekly/Monthly), New vs Returning activity, and live recent submissions.
  - `/admin/waitlist`: Comprehensive table with live updates via Firestore `onSnapshot`, debounced prefix search, status/date filters, cursor pagination, slide-over detail drawer, and Excel-safe UTF-8 BOM CSV streaming export.

---

## 2. Step-by-Step Setup Instructions

### Step 1: Firebase Project Configuration
1. Open the [Firebase Console](https://console.firebase.google.com/) and navigate to your project (`vaya-57d51`).
2. Go to **Build > Firestore Database** and click **Create Database** (Start in **production mode**, choose your preferred region e.g. `asia-south1`).

### Step 2: Enable Google Authentication
1. Go to **Build > Authentication > Sign-in method**.
2. Click **Add new provider** and select **Google**.
3. Enable Google sign-in and set the project support email.
4. Under **Settings > Authorized domains**, verify that `localhost` is listed, and add your production Vercel/custom domain.

### Step 3: Generate Service Account Key
1. Go to **Project Settings (Gear icon) > Service accounts**.
2. Click **Generate new private key** and download the JSON file.
3. Extract:
   - `client_email` -> `FIREBASE_CLIENT_EMAIL`
   - `private_key` -> `FIREBASE_PRIVATE_KEY`

### Step 4: Environment Variables Setup
Copy `.env.example` to `.env.local` and fill in your secrets:

```env
# Public Firebase Config (Client SDK)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC5ZSxgJAoY4g0ZEzSUiwJh5Z0cvXIXzms
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=vaya-57d51.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=vaya-57d51
NEXT_PUBLIC_FIREBASE_APP_ID=1:597181430540:web:acd5a62ae90be572f82729

# Server-only Firebase Admin SDK (Private)
FIREBASE_PROJECT_ID=vaya-57d51
FIREBASE_CLIENT_EMAIL=your-service-account@vaya-57d51.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFA...\n-----END PRIVATE KEY-----\n"

# Admin Access Control
ADMIN_EMAIL=chotimonino1@gmail.com

# Tracking & Security Salt
VISITOR_HASH_SALT=your-random-salt-string
```

### Step 5: Deploy Security Rules & Indexes
Install Firebase CLI if needed:
```bash
npm install -g firebase-tools
firebase login
firebase use vaya-57d51
```

Deploy Firestore Security Rules and compound query indexes:
```bash
firebase deploy --only firestore
```

The security rules enforce:
- Direct client access is denied for all visitor tracking collections.
- Only the verified administrator (`chotimonino1@gmail.com`) is granted direct client read permissions on `waitlist_submissions` for real-time listeners.
- All database mutations are strictly performed via server-side Admin SDK.

### Step 6: Seed Test Data (Optional)
To populate 30 days of synthetic visitor data, page views, and 40 waitlist candidates:
```bash
npx tsx scripts/seed.ts
```

To clean up seeded records without affecting production submissions:
```bash
npx tsx scripts/clear-seed.ts
```

---

## 3. Firestore Collections Schema

### 1) `waitlist_submissions/{docId}`
- `docId`: `sha256(lowercase trimmed email)` — enforces email uniqueness at database level.
- `name`: string
- `nameLower`: string (indexed for prefix search)
- `email`: string
- `emailLower`: string (indexed for prefix search)
- `phone`: string
- `phoneDigits`: string (digits only, indexed for phone search)
- `role`: `'traveller' | 'local-guide'`
- `problem`: string (biggest travel challenge)
- `travelInterest`: string
- `destination`: string
- `status`: `'new' | 'reviewed'` (indexed with `createdAt`)
- `visitorId`: string | null (links to `visitors` collection)
- `createdAt`: Firestore Timestamp (UTC)
- `createdDay`: string (Asia/Kolkata `YYYY-MM-DD`)

### 2) `visitors/{visitorId}`
- `firstSeenAt`: Firestore Timestamp
- `firstSeenDay`: string (IST `YYYY-MM-DD`)
- `lastSeenAt`: Firestore Timestamp
- `lastSeenDay`: string (IST `YYYY-MM-DD`)
- `visitDays`: number (increments only when visited on distinct IST calendar days)
- `device`: `'desktop' | 'mobile' | 'tablet'`
- `referrer`: string
- `utmSource`: string
- `utmMedium`: string
- `utmCampaign`: string
- `hasJoined`: boolean (set to `true` upon waitlist registration)

### 3) `visitor_days/{YYYY-MM-DD_visitorId}`
- `day`: string (IST `YYYY-MM-DD`, indexed)
- `visitorId`: string
- `isReturning`: boolean (`true` if `firstSeenDay < todayIST`)
- `createdAt`: Firestore Timestamp

### 4) `analytics_daily/{YYYY-MM-DD}`
- `pageViews`: number (atomic increment via `FieldValue.increment`)
- `signups`: number (atomic increment via `FieldValue.increment`)

---

## 4. Free-Tier Quota Protection & Performance

- **Server-Side Caching**: Analytics aggregates are wrapped in a 60-second in-memory server cache.
- **Query Bounding**: Custom date ranges are strictly capped at 365 days to prevent excessive document reads.
- **Streamed CSV Export**: Paged in batches of 500 documents directly through a `ReadableStream` with UTF-8 BOM and formula injection protection.
- **Real-Time Efficiency**: The client listener binds exclusively to the latest single submission on the first page, avoiding broad continuous reads.
