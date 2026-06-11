# Production Deployment Guide — CarbonWise

This guide provides step-by-step instructions to deploy the CarbonWise platform in a production environment. 

---

## Architecture Overview
CarbonWise is structured as a TypeScript monorepo using npm workspaces:
- **`packages/shared`**: Common types, schemas, and static data.
- **`server`**: Node.js/Express backend API connected to PostgreSQL.
- **`client`**: Vite/React frontend application.

---

## 1. Database Provisioning (Supabase)
Supabase provides a managed PostgreSQL database that is perfect for hosting the CarbonWise data tier.

### Setup Instructions
1. Sign in to [Supabase](https://supabase.com) and create a new project.
2. Choose a project name, database password, and select your region.
3. Once the project is provisioned, navigate to **Project Settings** > **Database**.
4. Scroll to the **Connection string** section, select **URI** (under the Transaction Pooler mode or Session Pooler mode), and copy the URI.
   - Format: `postgresql://postgres.[your-project-ref]:[your-password]@aws-0-[region].pooler.supabase.com:6543/postgres`
   - *Note*: Ensure you replace `[your-password]` with your actual database password.
5. Set this connection URI as the `DATABASE_URL` environment variable in your backend hosting platform.

---

## 2. Backend API Hosting (Render)
Render is used to host the Express server. It will build the packages, run SQL migrations, and serve the API.

### Setup Instructions
1. Sign in to [Render](https://render.com) and click **New** > **Web Service**.
2. Connect your Git repository.
3. Configure the following settings for the web service:
   - **Name**: `carbonwise-api`
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run db:migrate:prod && npm start`
   - **Port**: `3001` (Render will automatically detect/forward requests to `PORT`)
4. In the **Advanced** settings, set the **Health Check Path** to: `/api/v1/health`
5. Under **Environment Variables**, define the following variables:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: *(Your Supabase connection URI)*
   - `JWT_SECRET`: *(A secure 32+ character random string)*
   - `JWT_REFRESH_SECRET`: *(Another secure 32+ character random string)*
   - `CORS_ORIGIN`: *(The URL of your deployed Vercel frontend)*
   - `GEMINI_API_KEY`: *(Optional — Gemini API key for AI Coaching)*
   - `RESEND_API_KEY`: *(Optional — Resend API key for forgot-password emails)*
   - `EMAIL_FROM`: `noreply@carbonwise.app` (or your verified domain sender)
6. Click **Create Web Service**. Render will build the codebase and run database migrations before going live.

---

## 3. Frontend Web Hosting (Vercel)
Vercel is optimized for building and serving static frontends like our Vite React client.

### Setup Instructions
1. Sign in to [Vercel](https://vercel.com) and click **Add New** > **Project**.
2. Import your Git repository.
3. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build` (or `vite build`)
   - **Output Directory**: `dist`
4. Under **Environment Variables**, define the API endpoint variable:
   - `VITE_API_URL`: *(Your Render backend URL followed by `/api/v1`, e.g., `https://carbonwise-api.onrender.com/api/v1`)*
5. Click **Deploy**. Vercel will build the frontend client and host it.
   - *Note*: We have included [client/vercel.json](file:///c:/Users/thiru/OneDrive/Tài liệu/Main challenge 3/client/vercel.json) in the project, which automatically handles routing for Single Page Applications (SPA) by rewriting all page requests to `index.html`.

---

## 4. Local Production Dry-Run (Docker)
To verify your deployment configuration locally before committing to cloud providers, you can execute a production build using Docker.

### Prerequisites
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Execution Commands
1. Navigate to the root directory of the project.
2. Build and spin up the production container network:
   ```bash
   docker compose -f docker/docker-compose.yml up --build
   ```
3. This command starts:
   - **`postgres`**: A local PostgreSQL instance pre-configured for the platform.
   - **`server`**: The Express API server compiled in production mode.
   - **`client`**: An Nginx container serving the compiled React build on port `5173`.
4. Open `http://localhost:5173` in your browser to verify the complete end-to-end functionality.
