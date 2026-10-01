# Backend Requirements for Person 3

**Platform**: Government Policies & Reports Analyser  
**Audience**: Person 3 (Backend Engineer: Express, MongoDB, Gemini Services)  
**Maintained by**: Person 2 (Frontend Engineer: React / Vite)  
**Status**: Hand-off Specification — FOR PERSON 3 IMPLEMENTATION  
> **CRITICAL DIRECTIVE**: This document defines the exact contract required from the backend service. **Do NOT implement any of this backend functionality in the frontend codebase.** The frontend is fully built with type-safe client services and mock simulation layers.

---

## 1. Architectural Principles & Boundaries

1. **Zero Direct Cloud or Database Access from Client**:
   The frontend browser client communicates strictly and exclusively with your Express REST API. It never calls the Gemini SDK, MongoDB drivers, or cloud storage directly.
2. **Zero-Hallucination Evidence Grounding**:
   Every policy finding, stakeholder impact, comparison cell, and Q&A answer **must** include verifiable source citations (`pageNumber`, `sectionHeading`, verbatim `excerptQuote`). Claims lacking grounded evidence must be omitted or flagged with low confidence.
3. **Data Envelope Tolerance**:
   The frontend can receive responses either wrapped in `{ "data": ... , "meta": ... }` envelopes or as raw JSON objects. However, returning a consistent `{ "data": T }` envelope is recommended.
4. **No Quiet Mock Fallback**:
   When `VITE_USE_MOCK_API=false`, any network or server failure will display real error states and retry buttons to the user. The client will **never** silently substitute mock data if your backend returns an error.

---

## 2. Authentication & Session Management

### Endpoints

| Method | Endpoint | Description | Expected Status Codes |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user credentials | `200`, `400`, `401` |
| `POST` | `/api/auth/register` | Register a new policy analyst account | `201`, `400`, `409` |
| `GET` | `/api/auth/me` | Fetch active session profile | `200`, `401` |
| `POST` | `/api/auth/logout` | Revoke active token/session | `200` |

### Formats & Schemas

#### `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "analyst@cabinet.gov.in",
    "password": "SecurePassword123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "user": {
        "id": "usr-001",
        "name": "Dr. Sunita Sharma",
        "email": "analyst@cabinet.gov.in",
        "role": "analyst",
        "ministry": "Cabinet Secretariat / Policy Research",
        "createdAt": "2024-01-15T08:00:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2026-10-02T14:00:00.000Z"
    }
  }
  ```

#### `POST /api/auth/register`
- **Request Body**:
  ```json
  {
    "name": "Vikram Seth",
    "email": "v.seth@meity.gov.in",
    "password": "SecurePassword123!",
    "confirmPassword": "SecurePassword123!",
    "ministry": "Ministry of Electronics and Information Technology"
  }
  ```
- **Response `201 Created`**: Same structure as login.

#### `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**: Returns the `User` object (or wrapped in `data`).

### Cookie / Token Behavior
- **Bearer Token Header**: The frontend sends `Authorization: Bearer <token>` with every authenticated HTTP request.
- **Cookie Support**: Frontend `fetch` runs with `credentials: 'same-origin'` (or `'include'`). If you prefer HTTP-only session cookies (`Set-Cookie: token=...; HttpOnly; Secure; SameSite=Lax`), the frontend client will automatically support them as long as CORS credentials are enabled.
- **401 Session Teardown**:
  Whenever the backend returns HTTP `401 Unauthorized`:
  1. The frontend immediately wipes tokens from both `sessionStorage` and `localStorage`.
  2. The application broadcasts an `auth:unauthorized` event.
  3. The user is redirected to `/login?redirectTo=<current_url>`.
  Ensure expired tokens or invalid JWT signatures consistently return HTTP 401 (not 403 or 500).

---

## 3. Documents Management

### Endpoints

| Method | Endpoint | Description | Expected Status Codes |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/documents/upload` | Multipart file upload with statutory metadata | `201`, `400`, `413`, `422` |
| `GET` | `/api/documents` | List documents with query filters | `200` |
| `GET` | `/api/documents/:id` | Retrieve single document metadata | `200`, `404` |
| `GET` | `/api/documents/:id/status` | Poll processing pipeline status & stages | `200`, `404` |
| `POST` | `/api/documents/:id/retry` | Restart failed ingestion pipeline | `200`, `404` |

### Ingestion & Upload (`POST /api/documents/upload`)
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: Binary file (PDF, DOCX, TXT). Maximum size: **50MB**.
  - `title`: string (min 3 chars, required)
  - `issuingMinistry`: string (required)
  - `category`: string (e.g., `energy`, `technology_ai`, `environmental`, `healthcare`, `finance_trade`, `infrastructure`, `education`, `general`)
  - `publicationDate`: ISO date string `YYYY-MM-DD` (required)
- **Response `201 Created`**:
  ```json
  {
    "data": {
      "id": "doc-gov-2024-009",
      "title": "National Green Hydrogen Mission Guidelines",
      "issuingMinistry": "Ministry of New and Renewable Energy",
      "category": "energy",
      "publicationDate": "2024-03-15",
      "fileSize": 4280192,
      "pageCount": 68,
      "status": "processing",
      "uploadedAt": "2024-10-01T12:00:00.000Z",
      "stages": [
        { "stage": "upload", "label": "File Upload & Verification", "status": "completed" },
        { "stage": "ocr_extraction", "label": "PDF Text Extraction", "status": "in_progress" },
        { "stage": "chunking", "label": "Semantic Chunking", "status": "pending" },
        { "stage": "indexing", "label": "Vector Indexing", "status": "pending" },
        { "stage": "synthesis", "label": "Policy Intelligence Synthesis", "status": "pending" }
      ]
    }
  }
  ```

### Document Status Lifecycle & Normalization
Backend statuses may include: `'uploaded' | 'extracting' | 'chunking' | 'ready' | 'analyzing' | 'analyzed' | 'failed'`.
The frontend adapts these into a strict 4-state lifecycle:
- `ready` / `analyzed` -> `ready`
- `extracting` / `chunking` / `analyzing` / `processing` -> `processing`
- `failed` -> `failed`
- `uploaded` -> `uploaded`

### Processing Pipeline Polling (`GET /api/documents/:id/status`)
- **Response `200 OK`**:
  ```json
  {
    "status": "processing",
    "stages": [
      { "stage": "upload", "label": "File Upload & Verification", "status": "completed", "startedAt": "2024-10-01T12:00:00Z", "completedAt": "2024-10-01T12:00:03Z" },
      { "stage": "ocr_extraction", "label": "PDF Text Extraction", "status": "completed", "startedAt": "2024-10-01T12:00:03Z", "completedAt": "2024-10-01T12:00:15Z" },
      { "stage": "chunking", "label": "Semantic Chunking", "status": "in_progress", "startedAt": "2024-10-01T12:00:15Z" },
      { "stage": "indexing", "label": "Vector Indexing", "status": "pending" },
      { "stage": "synthesis", "label": "Policy Intelligence Synthesis", "status": "pending" }
    ],
    "failureReason": null
  }
  ```

---

## 4. Policy Analysis (Gemini-Powered Intelligence)

### Endpoints

| Method | Endpoint | Description | Expected Status Codes |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/documents/:id/analyze` | Trigger asynchronous policy analysis | `200`, `202`, `400`, `404` |
| `GET` | `/api/documents/:id/analysis` | Fetch extracted intelligence and citations | `200`, `400` (if not ready), `404` |

### Trigger Analysis (`POST /api/documents/:id/analyze`)
- **Response `200 OK` or `202 Accepted`**:
  ```json
  {
    "success": true,
    "message": "Analysis pipeline initiated for document doc-gov-2024-001",
    "status": "processing"
  }
  ```

### Analysis Output (`GET /api/documents/:id/analysis`)
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "documentId": "doc-gov-2024-001",
      "executiveSummary": "The National Green Hydrogen Mission sets a comprehensive statutory framework...",
      "analyzedAt": "2024-10-01T12:15:00.000Z",
      "modelVersion": "Gemini-1.5-Pro-Policy-Tuned-v2",
      "keyPoints": [
        "Sets 5 MMT green hydrogen production target by 2030.",
        "Allocates ₹17,490 crore for the SIGHT programme.",
        "Waives interstate transmission system (ISTS) charges for 25 years."
      ],
      "findings": [
        {
          "id": "prov-1",
          "title": "Component I: Electrolyser Manufacturing Subsidy",
          "summary": "Direct capital incentives for domestic electrolyser manufacturing plants...",
          "mandateLevel": "mandatory",
          "effectiveDate": "2024-06-01",
          "enforcingAgency": "Solar Energy Corporation of India (SECI)",
          "penaltiesOrConsequences": "Revocation of performance bank guarantee and debarment.",
          "citations": [
            {
              "id": "cit-01",
              "documentId": "doc-gov-2024-001",
              "documentTitle": "National Green Hydrogen Mission Guidelines",
              "pageNumber": 14,
              "sectionHeading": "Section 4.2: Eligibility Criteria",
              "paragraphNumber": 3,
              "excerptQuote": "The bidder must commit to a minimum local value addition (LVA) of 40% in Year 1...",
              "confidenceScore": 0.98
            }
          ]
        }
      ],
      "insights": [
        {
          "id": "ins-1",
          "title": "Interstate Transmission Open Access Coordination",
          "category": "enforcement_gap",
          "severity": "high",
          "description": "Lack of uniform state-level open access regulations threatens timeline.",
          "suggestedRemediation": "Issue binding statutory directions under Section 107 of the Electricity Act.",
          "citations": [
            {
              "id": "cit-02",
              "pageNumber": 22,
              "sectionHeading": "Section 6.1: Grid Connectivity",
              "excerptQuote": "State Electricity Regulatory Commissions shall notify open access regulations within 60 days...",
              "confidenceScore": 0.94
            }
          ]
        }
      ],
      "stakeholderImpacts": [
        {
          "id": "stk-1",
          "groupName": "Domestic Electrolyser Manufacturers",
          "impactType": "positive",
          "description": "Direct financial incentives of ₹4,440 per kW capacity.",
          "complianceDeadline": "2024-12-31",
          "citations": []
        }
      ],
      "extractedMetrics": [
        {
          "label": "Total Financial Outlay",
          "value": "19,744",
          "unit": "₹ Crore"
        }
      ],
      "limitations": [
        "Analysis based on gazette notification dated March 2024; does not reflect subsequent state-level tariff orders."
      ]
    }
  }
  ```

---

## 5. Evidence-Grounded Q&A

### Endpoint

| Method | Endpoint | Description | Expected Status Codes |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/questions/query` | Submit evidence-grounded research question | `200`, `400` |

### Query Specification (`POST /api/questions/query`)
- **Request Body**:
  ```json
  {
    "question": "What are the mandatory local value addition requirements for electrolyser bidders?",
    "documentIds": ["doc-gov-2024-001"],
    "scope": "single_document"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "id": "qr-001",
      "question": "What are the mandatory local value addition requirements for electrolyser bidders?",
      "answer": "Bidders must demonstrate a minimum local value addition (LVA) of 40% in Year 1, escalating to 50% in Year 2 and 60% in Year 3 to qualify for direct capital incentives under SIGHT Component I.",
      "documentIds": ["doc-gov-2024-001"],
      "confidence": 0.98,
      "generatedAt": "2024-10-01T12:20:00.000Z",
      "evidence": [
        {
          "id": "ev-q-1",
          "documentId": "doc-gov-2024-001",
          "documentTitle": "National Green Hydrogen Mission Guidelines",
          "pageNumber": 14,
          "sectionHeading": "Section 4.2: Eligibility Criteria",
          "paragraphNumber": 3,
          "excerptQuote": "The bidder must commit to a minimum local value addition (LVA) of 40% in Year 1, increasing to 50% in Year 2 and 60% in Year 3.",
          "confidenceScore": 0.98
        }
      ]
    }
  }
  ```

### Future Gap: Persistent Question History
- `GET /api/questions/history?documentId=<id>` (Returns list of historical Q&A pairs for the authenticated user).
- `DELETE /api/questions/history/:queryId` (Clears historical Q&A entry).

---

## 6. Cross-Policy Comparison

### Endpoint

| Method | Endpoint | Description | Expected Status Codes |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/analysis/cross-policy` | Synthesize multi-criterion comparison matrix | `200`, `400` |

### Query Specification (`POST /api/analysis/cross-policy`)
- **Validation Rule**: `documentIdA` and `documentIdB` must be distinct. At least one criterion must be selected.
- **Request Body**:
  ```json
  {
    "documentIdA": "doc-gov-2024-001",
    "documentIdB": "doc-gov-2024-002",
    "documentIds": ["doc-gov-2024-001", "doc-gov-2024-002"],
    "criteria": [
      "objectives",
      "eligibility",
      "funding",
      "implementation",
      "responsible_authority",
      "timelines",
      "scope",
      "target_groups"
    ]
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "query": "Cross-policy comparison between National Green Hydrogen Mission and National Semiconductor Mission",
      "documentIds": ["doc-gov-2024-001", "doc-gov-2024-002"],
      "synthesizedAnswer": "Both policies focus on capital subsidy interventions to localize critical supply chains...",
      "similarities": [
        "Both schemes utilize milestone-based capital disbursement upon audited physical verification.",
        "Both require strict local value addition (LVA) thresholds over a 3-5 year horizon."
      ],
      "differences": [
        "Green Hydrogen relies on SECI as implementing agency, whereas Semiconductor Mission is governed by ISM under MeitY.",
        "Semiconductor Mission provides up to 50% fiscal support on pari-passu basis, whereas SIGHT provides tapering per-kg/per-kW incentives."
      ],
      "comparisonMatrix": [
        {
          "comparisonTopic": "Financial & Incentive Mechanisms",
          "criterionId": "funding",
          "findings": [
            {
              "documentId": "doc-gov-2024-001",
              "documentTitle": "National Green Hydrogen Mission Guidelines",
              "findingSummary": "Total allocation of ₹17,490 crore for domestic manufacturing and production.",
              "citations": [
                {
                  "id": "cit-c1",
                  "pageNumber": 8,
                  "sectionHeading": "Financial Outlay",
                  "excerptQuote": "The financial outlay for the SIGHT programme is ₹17,490 crore..."
                }
              ]
            },
            {
              "documentId": "doc-gov-2024-002",
              "documentTitle": "National Semiconductor Mission Guidelines",
              "findingSummary": "Fiscal support up to 50% of project cost with ₹76,000 crore total package.",
              "citations": [
                {
                  "id": "cit-c2",
                  "pageNumber": 12,
                  "sectionHeading": "Scheme for Setting up of Semiconductor Fabs",
                  "excerptQuote": "Fiscal support of 50% of the project cost will be provided on a pari-passu basis..."
                }
              ]
            }
          ]
        }
      ]
    }
  }
  ```

---

## 7. Research Brief & Legislative Memorandum

### Endpoints

| Method | Endpoint | Description | Expected Status Codes |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/research-brief/generate` | Synthesize executive legislative brief | `201`, `400` |
| `GET` | `/api/research-brief/:id` | Fetch formatted executive policy brief | `200`, `404` |
| `GET` | `/api/research-brief/:id/export` | Download brief as binary PDF/DOCX (Pending backend) | `200` |

### Generation (`POST /api/research-brief/generate`)
- **Request Body**:
  ```json
  {
    "documentIds": ["doc-gov-2024-001", "doc-gov-2024-002"],
    "topic": "Clean Energy & High-Tech Manufacturing Subsidy Harmonization"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "data": {
      "id": "brief-2026-001",
      "title": "Executive Legislative Memorandum: Clean Energy & High-Tech Manufacturing",
      "topic": "Clean Energy & High-Tech Manufacturing Subsidy Harmonization",
      "ministry": "Inter-Ministerial Strategic Review Group",
      "generatedAt": "2024-10-01T12:30:00.000Z",
      "executiveSummary": "This memorandum evaluates the statutory alignment and capital allocation...",
      "background": "In response to global supply chain volatility, the Government of India launched parallel initiatives...",
      "keyFindings": [
        {
          "id": "kf-1",
          "title": "Capital Subsidy Tapering Discrepancy",
          "summary": "Hydrogen incentives taper annually over 3 years, whereas semiconductor fab incentives are fixed at 50% pari-passu."
        }
      ],
      "policyAnalysis": "A comparative evaluation of disbursement schedules indicates differing fiscal risk absorption...",
      "implications": [
        "Fiscal liability for semiconductor fab support is heavily front-loaded during construction.",
        "Hydrogen production incentives mitigate operational risk by indexing to actual verified output."
      ],
      "limitations": [
        "State-level electricity transmission subsidies are not aggregated in this analysis."
      ],
      "sources": [
        {
          "id": "src-1",
          "documentId": "doc-gov-2024-001",
          "title": "National Green Hydrogen Mission Guidelines",
          "ministry": "Ministry of New and Renewable Energy"
        }
      ],
      "evidenceRegister": [
        {
          "id": "ev-br-1",
          "excerptQuote": "Fiscal support of 50% of the project cost will be provided on a pari-passu basis...",
          "pageNumber": 12,
          "documentTitle": "National Semiconductor Mission Guidelines"
        }
      ]
    }
  }
  ```

---

## 8. Standardized Error Format & HTTP Status Expectations

All backend error responses must adhere strictly to the following JSON format:

```json
{
  "statusCode": 400,
  "message": "Human-readable, user-safe explanation of the error.",
  "details": "Optional field validation details or array of specific constraint failures."
}
```

### HTTP Status Code Mapping:
- **`400 Bad Request`**: Malformed JSON or invalid parameter values.
- **`401 Unauthorized`**: Missing, invalid, or expired bearer token.
- **`403 Forbidden`**: Valid token, but user role lacks statutory clearance.
- **`404 Not Found`**: Document, analysis, brief, or user record not found.
- **`409 Conflict`**: Duplicate document registration or existing email in registration.
- **`413 Payload Too Large`**: Uploaded file exceeds 50MB limit.
- **`422 Unprocessable Entity`**: Unsupported file MIME type or corrupted PDF binary.
- **`429 Too Many Requests`**: Rate limit exceeded (Gemini token quota or API throttle).
- **`500 Internal Server Error`**: Unexpected server-side failure.

### Crucial Security Rule: Error Sanitization
- Express error-handling middleware must intercept all uncaught exceptions.
- **NEVER** expose stack traces, file paths (`at .../server.js:45`), `node_modules` paths, or MongoDB driver strings (`MongoError: connect ECONNREFUSED`, `Cast to ObjectId failed`) to the client.
- Always translate database or runtime exceptions into sanitized error messages before sending the response.

---

## 9. CORS (Cross-Origin Resource Sharing)

The Express backend must configure CORS headers to permit the Vite frontend:

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or requests from permitted origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  maxAge: 86400, // Cache preflight for 24 hours
}));
```

---

## 10. Summary Checklist for Person 3

- [ ] Configure Express CORS for `http://localhost:5173` with credentials support.
- [ ] Implement standard error middleware returning `{ "statusCode": ..., "message": ... }` with zero stack traces leaked.
- [ ] Mount `/api/auth` (`/login`, `/register`, `/me`, `/logout`) returning Bearer JWTs.
- [ ] Configure Multer on `POST /api/documents/upload` for 50MB max file handling (PDF, DOCX, TXT).
- [ ] Implement asynchronous document processing with status polling endpoint `GET /api/documents/:id/status`.
- [ ] Implement Gemini prompt pipeline on `POST /api/documents/:id/analyze` returning verifiable `citations` (`pageNumber`, `sectionHeading`, `excerptQuote`).
- [ ] Implement evidence-grounded vector Q&A on `POST /api/questions/query`.
- [ ] Implement multi-criterion comparison on `POST /api/analysis/cross-policy`.
- [ ] Implement executive brief synthesis on `POST /api/research-brief/generate` and `GET /api/research-brief/:id`.
- [ ] *(Optional Future)* Provide binary file generation on `GET /api/research-brief/:id/export?format=pdf`.
