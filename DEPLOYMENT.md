# CarbonWise — Production Deployment Guide

This document outlines the step-by-step instructions for deploying the CarbonWise AI-Powered Carbon Intelligence Platform to production environments.

---

## 1. Database Provisioning (Supabase)

CarbonWise uses PostgreSQL. Follow these steps to provision the production database on Supabase:

1. **Create a Project**: Go to [Supabase](https://supabase.com) and create a new project.
2. **Retrieve Connection String**:
   - Navigate to **Project Settings** > **Database**.
   - Copy the Connection String under the **URI** format.
   - Set the port to `6543` (Connection Pooler - Transaction mode) or `5432` (Direct Connection).
3. **Escaping Special Characters**:
   - If your database password contains special characters (like `@`, `:`, `/`, or `?`), they **must** be URL-encoded in the connection string (e.g., replacing `@` with `%40`).
4. **Run Database Migrations & Seeds**:
   - Set the `DATABASE_URL` environment variable on your local machine:
     ```bash
     $env:DATABASE_URL="postgresql://postgres.your-ref-id:encoded-password@aws-1-region.pooler.supabase.com:6543/postgres"
     ```
   - Run the migration and seeding scripts:
     ```bash
     npm run db:migrate
     npm run db:seed
     ```

---

## 2. Backend Hosting (Render)

The backend service is hosted on Render at `https://carbonwise-ai-i3xp.onrender.com`.

### Configuration Settings

- **Service Type**: Web Service
- **Repository Root Directory**: _Leave blank_ (execute from the workspace root directory so it can access packages/shared)
- **Environment**: `Node`
- **Build Command**:
  ```bash
  npm ci --include=dev && npm run build:shared && npm run build:server
  ```
- **Start Command**:
  ```bash
  npm run db:migrate:prod --workspace=server && npm run start --workspace=server
  ```
- **Health Check Path**: `/api/v1/health`

### Environment Variables

- `DATABASE_URL`: Your Supabase connection string.
- `JWT_SECRET`: A secure 32+ character random string for access tokens.
- `JWT_REFRESH_SECRET`: A secure 32+ character random string for refresh tokens.
- `JWT_ACCESS_EXPIRY`: `15m`
- `JWT_REFRESH_EXPIRY`: `7d`
- `CORS_ORIGIN`: Your production Vercel client URL (e.g. `https://carbon-wise-ai-client.vercel.app`).
- `NODE_ENV`: `production`
- `PORT`: `10000` (Render will automatically bind to this)

---

## 3. Frontend Hosting (Vercel)

The React client application is hosted on Vercel.

### Project Setup & Build Settings

- **Framework Preset**: `Vite`
- **Root Directory**: _Leave blank_ (execute from the repository root directory)
- **Build Command**:
  ```bash
  npm run build:shared && npm run build:client
  ```
- **Output Directory**: `client/dist`
- **Install Command**:
  > [!IMPORTANT]
  > You **must** override the default Install Command on Vercel to force dependency resolution at the monorepo root.
  >
  > - Under **Build & Development Settings**, turn **ON** the override toggle for **Install Command**.
  > - Enter `npm install` in the text box.
  > - This ensures Vercel installs the dependencies (like `typescript` and `tsc`) at the root level, avoiding compilation failures.

### Environment Variables

- `VITE_API_URL`: The URL of your Render backend (e.g., `https://carbonwise-ai-i3xp.onrender.com`).

---

## 4. Docker Production Execution (Local)

To run the complete production stack locally using Docker:

1. **Build and Run Containers**:
   ```bash
   docker-compose -f docker/docker-compose.yml up --build
   ```
2. **Access the Application**:
   - Client is available at `http://localhost:5173`.
   - Server API is available at `http://localhost:3000`.
