# PolicyIntelligence Platform — Frontend Application

High-assurance, accessible (WCAG 2.2 AA), responsive frontend application for the **Government Policies & Reports Analyser**. Built with React 19, TypeScript, Vite, modern vanilla CSS design tokens, and comprehensive automated accessibility and component test suites.

---

## 1. Quickstart & Commands

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (v9.0.0 or higher)

### Setup & Installation
```bash
# Clone or navigate to the frontend directory
cd "Downloads/frontend person 2"

# Install dependencies
npm install
```

### Available Scripts

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run dev` | Development Server | Starts Vite dev server with Hot Module Replacement (HMR) at `http://localhost:5173` |
| `npm run build` | Production Build | Runs TypeScript type checking (`tsc -b`) and bundles production assets via Vite with route-level code splitting |
| `npm test` | Run Test Suite | Executes all 80 unit, component, user-flow, and axe-core accessibility tests via Vitest |
| `npm run lint` | Lint Codebase | Scans all TypeScript and TSX files using Oxlint (0 warnings, 0 errors across 83 files) |
| `npm run preview` | Preview Production Build | Serves the generated `dist/` directory locally |

---

## 2. Environment Variables

Configuration is handled via standard Vite environment files (`.env`, `.env.example`).

```ini
# Base URL for Express backend REST API service (Person 3)
VITE_API_BASE_URL=http://localhost:5000/api

# Enable mock mode (true) or connect to real Express backend (false)
VITE_USE_MOCK_API=true
```

> **Security Guarantee**: Frontend environment variables prefixed with `VITE_` are bundled into client-side JavaScript. **Never put private keys, Gemini API tokens, MongoDB connection URIs, or JWT secrets in frontend environment files.**

---

## 3. Mock Mode Architecture

The frontend contains a full-fidelity offline simulation layer (`src/services/mock/`):
- **Toggle**: Controlled via `VITE_USE_MOCK_API=true`.
- **Purpose**: Enables independent development, testing, and stakeholder demonstrations without requiring a running Express or MongoDB backend.
- **Realistic Policy Data**: Pre-seeded with authentic government policies:
  - *National Green Hydrogen Mission Guidelines* (Ministry of New and Renewable Energy)
  - *National Semiconductor Mission Guidelines* (Ministry of Electronics and Information Technology)
  - *Digital Personal Data Protection Act, 2023 Rules* (MeitY)
  - *PM e-Bus Sewa Scheme Implementation Plan* (Ministry of Housing and Urban Affairs)
- **Stateful Ingestion Simulation**: Simulates upload, OCR text extraction, semantic chunking, vector indexing, and policy synthesis pipelines with realistic asynchronous delays and status stage transitions.
- **Strict Boundary (No Mock Fallback on Real API Failure)**: When `VITE_USE_MOCK_API=false`, any error from the backend service propagates directly to the UI error notifications and retry states. The frontend will **never** silently fall back to mock data if the backend encounters an error.

---

## 4. Authentication Assumptions & Session Management

- **Endpoints**:
  - `POST /api/auth/login` — Authenticates user credentials (`email`, `password`).
  - `POST /api/auth/register` — Creates a new policy researcher account.
  - `GET /api/auth/me` — Fetches profile for current bearer token.
  - `POST /api/auth/logout` — Revokes session.
- **Token Passing**:
  - The client transmits the JWT in the standard HTTP header: `Authorization: Bearer <token>`.
  - Credentials mode is configured to `'same-origin'` (compatible with CORS credentials).
- **Storage**:
  - By default, tokens are saved in `sessionStorage` (cleared on tab close).
  - If the user selects "Keep me signed in", the token persists in `localStorage`.
- **Automatic 401 Session Teardown**:
  - On HTTP `401 Unauthorized` from any endpoint, the client purges stored tokens, emits a system `auth:unauthorized` event, and redirects to `/login?redirectTo=<current_url>`.
- **Password Complexity Assumption**:
  - The frontend enforces a baseline length requirement (≥ 8 characters, maximum 128 characters) and matching confirm-password validation. Deeper organizational password policies (special characters, uppercase, regex) are deferred to Person 3's backend validation.

---

## 5. API Contracts & Architectural Principles

1. **Zero Direct Cloud or Database Access**:
   The frontend communicates exclusively with the Express API service; it never directly accesses MongoDB, Gemini SDKs, or cloud storage buckets.
2. **Strict 4-State Lifecycle**:
   The frontend normalizes any backend document status into:
   `'uploaded' | 'processing' | 'ready' | 'failed'`.
3. **Data Envelope Tolerance**:
   API responses wrapped in `{ "data": ... }` or returned as raw JSON objects are automatically unwrapped and handled transparently.
4. **Verifiable Grounding & Citation Standards**:
   All AI-synthesized findings, stakeholder impacts, and comparison rows must include verifiable citations with physical `pageNumber`, `sectionHeading`, and verbatim `excerptQuote`. Claims without evidence are flagged or omitted.
5. **Persistent Error Handling**:
   Critical errors persist until dismissed by the user or retried via `[Try Again]` actions, ensuring vital statutory warnings are never missed.

---

## 6. Known Backend Dependencies (Person 3 Hand-off)

The following backend capabilities must be provided by Person 3 (Express, MongoDB, Gemini) for end-to-end functionality when `VITE_USE_MOCK_API=false`:

1. **CORS Middleware**: Must allow origin `http://localhost:5173` with headers `Authorization`, `Content-Type`, `Accept` and `credentials: true`.
2. **Multipart Upload Handler**: `POST /api/documents/upload` parsing `multipart/form-data` with file size validation (up to 50MB) and format restrictions (PDF, DOCX, TXT).
3. **Processing Pipeline**: Background job updating status stages: `upload` -> `ocr_extraction` -> `chunking` -> `indexing` -> `synthesis`.
4. **AI Policy Analysis**: `POST /api/documents/:id/analyze` invoking Gemini with prompt engineering that extracts structured JSON containing findings, citations, and stakeholder impacts.
5. **Grounded Q&A**: `POST /api/questions/query` retrieving vector context from MongoDB and querying Gemini for evidence-backed answers.
6. **Cross-Policy Comparison**: `POST /api/analysis/cross-policy` synthesizing similarities, differences, and per-criterion comparison rows across selected documents.
7. **Research Brief Generator**: `POST /api/research-brief/generate` compiling executive memoranda from documents and topics.
8. **Sanitized Error Responses**: Standardized JSON errors `{ "statusCode": number, "message": string }` catching all unhandled exceptions and never leaking stack traces to the browser.
