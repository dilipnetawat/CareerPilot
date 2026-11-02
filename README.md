# CareerPilot AI — AI-Powered Career Intelligence, Mock Interviews & Job Application Tracker

CareerPilot AI is an end-to-end, full-stack AI career intelligence platform. It analyzes resumes against target job descriptions, identifies skill gaps, creates personalized 4-week roadmaps, provides an AI Mock Interview Engine with rigorous 100-point rubric evaluations, and features a complete Job Application Tracker with recruitment funnel analytics.

---

## Tech Stack & Architecture

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript + Vite | Responsive Single-Page Application (SaaS design) with SPA fallback routing |
| **Styling** | Tailwind CSS v4 & Lucide Icons | Utility-first responsive dark-mode styling with score gauges and progress meters |
| **Backend** | Python 3.10+ & FastAPI | Asynchronous REST API with Pydantic v2 schemas and JWT Bearer security |
| **PDF Extraction**| PyMuPDF (v2.0) | In-memory text extraction, page validation (<= 15 pages), size enforcement (<= 5MB) |
| **AI Engine** | Google GenAI SDK (`google-genai`) | Structured output with Gemini models (`gemini-3.6-flash` / fallback models) |
| **Auth** | PBKDF2-HMAC-SHA256 & PyJWT | Password hashing (100,000 rounds + salt), signed JWT tokens, strict user isolation |
| **Database** | SQLAlchemy 2.0 (Dual SQLite / PostgreSQL) | SQLite for zero-config local dev; Supabase PostgreSQL with `psycopg3` for production |
| **Migrations** | Alembic | Authoritative database migrations with idempotent schema initialization |

---

## System Modules & Capabilities

### 1. Genuine Authentication & Account Isolation
- Secure user registration (`POST /api/auth/signup`) rejecting duplicate emails (409 Conflict).
- Password hashing using PBKDF2-HMAC-SHA256 with 100,000 iterations and cryptographic salt.
- Login (`POST /api/auth/login`) issuing signed JWT access tokens with 7-day expiration.
- Instant evaluation demo access (`POST /api/auth/demo-login`).
- Strict user-level data isolation: All personal analyses, interview sessions, roadmap progress, and job applications filter strictly by the authenticated `user_id`.

### 2. Resume & Career Fit Intelligence
- Upload validation: PDF format, magic byte check, <=5MB, <=15 pages.
- Job description validation (>=20 characters) and role validation (>=2 characters).
- Overall fit score (0–100) with evidence citations directly quoting the resume.
- 3-tier skill categorization (*Demonstrated*, *Partially Demonstrated*, *Skills Not Evidenced in Resume*).
- Prioritized skill gaps with severity ratings and expected impact.
- Personalized 4-week step-by-step roadmap with weekly deliverables.
- 3 tailored portfolio projects addressing identified gaps.

### 3. AI Mock Interview Practice
- Generates 5 tailored questions derived from the candidate's career fit report and skill gaps.
- Granular 100-point rubric evaluation strictly summing to 100:
  - Technical Accuracy: 25 pts
  - Relevance: 20 pts
  - Depth of Explanation: 20 pts
  - Problem Solving: 20 pts
  - Communication Clarity: 15 pts
- Comprehensive feedback: highlights what was done well, blindspots, incorrect reasoning, and exemplar model answer.
- Executive synthesis upon completion with overall score and competency breakdown.

### 4. Roadmap Progress & Adaptive Plan
- Real-time task toggle with completion timestamps.
- Overall and weekly completion percentage calculation.
- Gemini-powered adaptive replanning that preserves completed tasks verbatim while targeting newly identified interview blindspots.

### 5. Job Application Tracker & Analytics
- Complete CRUD for tracking job applications across pipeline stages (`Saved`, `Applied`, `Assessment`, `Interview`, `Offer`, `Rejected`).
- Category filtering and search by company name and job title.
- Real recruitment funnel analytics: application response rate, interview conversion rate, category performance, and guidance threshold messaging (at 5+ applications).

---

## API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | System health and database connectivity | No |
| `POST` | `/api/auth/signup` | Register new account with hashed password | No |
| `POST` | `/api/auth/login` | Authenticate and issue JWT access token | No |
| `POST` | `/api/auth/demo-login` | Instant evaluation login with demo token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes (Bearer) |
| `POST` | `/api/analysis/analyze` | Upload PDF and execute Gemini fit analysis | Yes (Bearer) |
| `GET` | `/api/analysis/{id}` | Retrieve saved analysis by ID | Yes (Bearer) |
| `GET` | `/api/analysis` | List recent analyses for current user | Yes (Bearer) |
| `POST` | `/api/interviews/start` | Generate 5 mock interview questions | Yes (Bearer) |
| `GET` | `/api/interviews` | List interview sessions for current user | Yes (Bearer) |
| `GET` | `/api/interviews/{id}` | Get session details, questions, evaluations | Yes (Bearer) |
| `POST` | `/api/interviews/{id}/answer` | Submit answer for 100-point rubric evaluation | Yes (Bearer) |
| `POST` | `/api/interviews/{id}/complete` | Finalize interview and generate synthesis | Yes (Bearer) |
| `GET` | `/api/roadmap/{id}/progress` | Get persisted task completion metrics | Yes (Bearer) |
| `POST` | `/api/roadmap/{id}/toggle-task` | Toggle completion state of a task | Yes (Bearer) |
| `POST` | `/api/roadmap/{id}/update-plan` | Adaptive update of future roadmap tasks | Yes (Bearer) |
| `GET` | `/api/roadmap/{id}/revisions` | List roadmap revision history | Yes (Bearer) |
| `POST` | `/api/applications` | Create tracked job application | Yes (Bearer) |
| `GET` | `/api/applications` | List applications with status/category filters | Yes (Bearer) |
| `GET` | `/api/applications/analytics`| Calculate funnel and conversion metrics | Yes (Bearer) |
| `GET` | `/api/applications/{id}` | Get single application details | Yes (Bearer) |
| `PUT` | `/api/applications/{id}` | Update application record | Yes (Bearer) |
| `PATCH`| `/api/applications/{id}/status`| Update application pipeline status | Yes (Bearer) |
| `DELETE`| `/api/applications/{id}` | Delete job application | Yes (Bearer) |

---

## Local Development Workflow

### 1. Backend Setup (SQLite)

```bash
cd backend
python -m venv .venv

# On Windows:
.\.venv\Scripts\Activate.ps1
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
python -m alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Local database defaults to SQLite (`careerpilot.db`) without requiring PostgreSQL credentials.

### 2. Frontend Setup (Vite)

```bash
cd frontend
npm install
npm run dev
```

Frontend will run at `http://localhost:5173`.

---

## Automated Test Verification

Run all unit, integration, and regression tests:

```bash
cd backend
python -m pytest -v
```

To run the essential account regression and data isolation suite:

```bash
python -m pytest tests/test_final_regression.py -v
```

---

## Production Deployment Guide

### Architecture Overview

```
[ Vercel: React 19 Frontend ]
             │ (HTTPS REST API Requests with JWT)
             ▼
[ Render: FastAPI Backend (0.0.0.0:$PORT) ]
             │ (psycopg3 SSL Pooler)
             ▼
[ Supabase: Managed PostgreSQL Database ]
```

### 1. Database Setup: Supabase PostgreSQL
1. Create a new project in [Supabase](https://supabase.com).
2. Go to **Project Settings** > **Database** > **Connection Pooling**.
3. Select **Session Pooler** (Port `5432`). Do not use Transaction Pooler (Port 6543) with this deployment configuration.
4. Copy the connection string in URI format with `sslmode=require`.
5. Apply migrations authoritatively using Alembic:
   ```bash
   cd backend
   $env:DATABASE_URL="postgresql+psycopg://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require"
   python -m alembic upgrade head
   ```

### 2. Backend Setup: Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your Git repository (Render detects `render.yaml` automatically).
3. Service settings:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt && python -m alembic upgrade head`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables in Render Dashboard:
   - `ENVIRONMENT`: `production`
   - `DEBUG`: `false`
   - `DATABASE_URL`: `postgresql+psycopg://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require`
   - `JWT_SECRET`: Generated automatically by Render (or 32+ character random secret)
   - `GEMINI_API_KEY`: `[your-google-gemini-api-key]`
   - `GEMINI_MODEL`: `gemini-3.6-flash`
   - `CORS_ORIGINS`: `["https://[your-actual-vercel-app].vercel.app"]` (configure once Vercel URL is known)

### 3. Frontend Setup: Vercel
1. Import your Git repository in [Vercel](https://vercel.com).
2. Configure project settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-render-backend-name.onrender.com`
4. Deploy. Vercel will build the React SPA using `frontend/vercel.json` for SPA rewrites.
