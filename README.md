# Business Discovery and Enrichment

Production-style full-stack demo app for business discovery, lead enrichment, and structured export.

This project is designed as a **business discovery and enrichment tool powered by the Google Maps Platform Places API**. It uses official API requests (no browser automation or HTML scraping of Google Maps pages).

## Stack

- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS + shadcn-style UI components + lucide-react
- Backend: FastAPI (Python 3.11+) + httpx + pydantic + pandas + tenacity + beautifulsoup4

## Core Features

- Search businesses by category and city
- Live Google mode for production-style discovery
- Random search presets (category + city), with optional auto-run
- Results table with:
  - Filters: website, phone, minimum rating
  - Sorting: rating, review count, name
  - Row selection for enrichment/export
  - Per-row user notes
- AI enrichment for selected rows:
  - Summary
  - Likely target customer
  - Lead quality score (1-10)
  - Outreach angle
  - First-contact message draft
  - Optional website signal extraction (emails/social links/extra phones)
- Export:
  - JSON copy flow
  - CSV download flow
  - Optional Google Sheets webhook push

## Project Structure

```text
business-discovery/
|-- frontend/
|   |-- app/
|   |-- components/
|   |   |-- search/
|   |   |-- results/
|   |   |-- enrichment/
|   |   `-- ui/
|   |-- lib/
|   |-- hooks/
|   |-- types/
|   |-- public/
|   |-- package.json
|   `-- .env.example
|-- backend/
|   |-- app/
|   |   |-- main.py
|   |   |-- api/
|   |   |-- services/
|   |   |-- models/
|   |   |-- presets/
|   |   |-- utils/
|   |   `-- core/
|   |-- tests/
|   |-- requirements.txt
|   `-- .env.example
`-- README.md
```

## Backend Setup

1. Create and activate a Python 3.11+ virtual environment.
2. Install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

3. Create `.env` from `.env.example` and set values:

```env
GOOGLE_MAPS_API_KEY=your_google_maps_places_api_key
BACKEND_CORS_ORIGINS=http://localhost:3000
```

4. Run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

Health check:

- `GET http://localhost:8000/health`

## Frontend Setup

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Create `.env.local` from `.env.example`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

3. Run frontend:

```bash
npm run dev
```

4. Open:

- `http://localhost:3000`

## Render + Vercel Deployment

To connect a Vercel frontend to a Render backend:

1. Set Vercel frontend environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-name.onrender.com
```

2. Set Render backend environment variables:

```env
BACKEND_CORS_ORIGINS=https://your-app.vercel.app
# Optional: allow all Vercel preview deployments
BACKEND_CORS_ORIGIN_REGEX=https://.*\.vercel\.app
```

3. Redeploy both services after updating environment variables.

### Troubleshooting `ERR_CONNECTION_REFUSED`

If the frontend shows `net::ERR_CONNECTION_REFUSED`, check:

1. Vercel env `NEXT_PUBLIC_API_BASE_URL` points to your Render URL (for example `https://your-backend-name.onrender.com`).
2. Render backend service is live and responds on `/health`.
3. Render env `BACKEND_CORS_ORIGINS` contains your exact Vercel domain without trailing slash (for example `https://your-app.vercel.app`).
4. Both services were redeployed after env changes.

In production, this app now throws a clear error when `NEXT_PUBLIC_API_BASE_URL` is missing instead of silently defaulting to localhost.

## API Endpoints

- `GET /api/presets`
- `POST /api/search`
- `POST /api/random-search`
- `POST /api/enrich`
- `POST /api/export/json`
- `POST /api/export/csv`
- `POST /api/export/sheets` (optional webhook integration)

## Live Search Implementation Notes

- Uses Google Places API (New) Text Search with query format: `"<category> in <city>"`
- Uses Place Details per place ID
- Uses field masks to request only needed fields
- Supports pagination via `nextPageToken`
- Deduplicates by:
  1. `place_id`
  2. normalized `name + address`
- Handles invalid key/quota/timeouts with typed errors and API-safe responses

## Export Behavior

- Conservative export structure:
  - `place_id`
  - search query metadata
  - user-authored notes
  - AI enrichment
  - provider data kept separate from internal enrichment

## Tests

Backend unit tests are included under `backend/tests/` for presets, normalization, and export shaping.
