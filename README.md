# CarbonWise AI — AI-Powered Carbon Intelligence Platform

An intelligent, type-safe monorepo platform designed to help individuals understand, track, and reduce their carbon footprint through simple everyday actions and personalized AI-powered coaching.

---

## 1. Challenge Chosen

**Carbon Footprint Tracking & Sustainability Challenge**  
Empowering individuals with actionable insights, virtual twin projections, and time-series predictions to drive behavioral changes towards a net-zero future.

---

## 2. Problem Statement

> "Help individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights."

Most carbon tracking tools suffer from three core issues:

1. **Low Engagement**: Static spreadsheets or basic calculators that don't motivate behavioral changes.
2. **Generic Advice**: Generic tips like "turn off the lights" that don't match the user's actual lifestyle.
3. **Broken User Journey**: Clunky logging, poor session management, and single-session interactions that fail to establish long-term tracking.

---

## 3. Solution Overview

CarbonWise AI solves this through a feature-rich, high-performance web app:

- **Carbon Footprint Tracking**: Log daily activities across four categories: Transportation (commutes, flights), Home & Energy (electricity, gas, water), Food (diet type, meals), and Lifestyle (shopping, plastic).
- **Personalized Analytics**: Recharts-powered interactive charts displaying daily emission trends (with continuous dates padding) and category breakdown percentages.
- **Sustainability Twin**: Compare your weekly average profile against a virtual "Ideal Carbon Twin" to visualize gap differences, impact metrics (equivalent trees planted, cost savings), and prioritized actions.
- **What-If Simulator**: Predict potential carbon offset reductions before committing to changes (e.g. going vegetarian, swapping a car ride for walking).
- **Carbon Forecasting**: A linear regression forecasting engine showing 7-day and 30-day emission projections with confidence bounds.
- **Reports**: Generate downloadable, detailed carbon impact reports.

---

## 4. AI Coach Functionality

The **AI Coach** acts as a personal sustainability assistant powered by the Gemini AI API:

- Analyzes the user's historical carbon logging behavior.
- Generates 4 tailored recommendation cards categorizing suggestions into Easy, Medium, and Hard difficulty levels.
- Recommends personalized reductions (e.g., shifting commute modes or trying meatless days) mapping to actual user logs.
- Enables users to save recommended actions as active "Goals" in a single click, bridging the gap between insight and commitment.

---

## 5. Technology Stack

- **Frontend**: React (Vite, TypeScript, TailwindCSS, Recharts, Lucide, Framer Motion)
- **State Management**: Zustand (with Persist middleware and custom rehydration gates)
- **Backend**: Express (Node.js, TypeScript, PostgreSQL, ts-node/tsc compilation)
- **Database**: PostgreSQL (pg pool, parameterization, raw migrations)
- **Validation**: Zod (environment variables validation & request body sanitization)
- **Security**: Helmet, CORS, Refresh Token Rotation, bcrypt password hashing, express-rate-limit
- **Testing**: Jest (Server integration/unit tests) & Vitest (Client unit tests)
- **Containerization**: Docker & Docker Compose

---

## 6. Setup Instructions

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL database instance

### Installation

1. Clone the repository and navigate to the project folder:
   ```bash
   cd CarbonWise-AI
   ```
2. Install dependencies at the workspace root:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Copy `.env.example` to `server/.env` and edit connection URIs and API keys:
   ```bash
   cp .env.example server/.env
   ```

### Running the Application Locally

1. Run database migrations:
   ```bash
   npm run db:migrate
   ```
2. Seed baseline database entries (optional):
   ```bash
   npm run db:seed
   ```
3. Start the application in development mode:
   ```bash
   npm run dev
   ```
   - Client is available at `http://localhost:5173`.
   - Server is available at `http://localhost:3001`.

---

## 7. Deployment Instructions

### Database (Supabase)

1. Register a PostgreSQL database on Supabase.
2. Retrieve the transaction pooler connection URI and configure it under `DATABASE_URL`.

### Backend (Render)

1. Create a Web Service on Render from your repository.
2. Build Command: `npm ci --include=dev && npm run build:shared && npm run build:server`
3. Start Command: `npm run db:migrate:prod --workspace=server && npm run start --workspace=server`
4. Health Check Endpoint: `/api/v1/health`

### Frontend (Vercel)

1. Add a Vite project on Vercel.
2. Set Build Command to `npm run build:shared && npm run build:client` and output to `client/dist`.
3. Override Vercel's default Install Command to `npm install` (under Build settings) to compile typescript workspaces.

---

## 8. Assumptions

- **Baseline Daily Emissions**: If the user has not logged data, a national baseline of `12.87 kg CO₂/day` is used as a neutral average.
- **Emission Factor Constants**: Standard factors (e.g. `0.21` for gasoline car, `0.05` for electric car, `2.4` for poultry diet) are extracted from verified GHG protocols and stored in the shared workspace.
- **Conversion Equivalents**: mature trees offset `22 kg` carbon/year; domestic flights produce `150 kg` carbon; average savings are estimated at `$0.15` per kg saved.

---

## 9. Validation Screenshots

All E2E validation artifacts, recordings, and screenshots are stored in the local brain directory at `C:\Users\thiru\.gemini\antigravity-ide\brain\6c564b42-83a5-4c02-9924-233c84f6c72c`:

- **Landing Page**: `landing_page_1781288011177.png`
- **Dashboard Overview**: `dashboard_updated_1781288098868.png`
- **AI Recommendation Engine**: `ai_recommendations_loaded_1781288134922.png`
- **E2E Video Recording**: `e2e_live_validation_1781287958844.webp`

---

## 10. Future Improvements

- **Live Utility APIs**: Directly pull monthly energy metrics from smart meters.
- **Receipt OCR Engine**: Scan grocery receipts and automatically calculate diet category footprints.
- **Mobile Companion App**: Native iOS/Android clients using shared validators.
