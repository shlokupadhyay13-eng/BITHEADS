# Government Policies & Reports Analyser — API Contract (v1)

> **Audience:** Person 2 (React Frontend Developer) & API Consumers  
> **Base URL:** `http://localhost:5000/api/v1`  
> **Protocol:** REST over HTTP / JSON + Multipart Uploads  
> **Authentication:** Cookie-based JWT (`access_token` and `refresh_token` in HTTP-only cookies)

---

## 1. Global Architectural Standards

### 1.1 Response Envelope
Every response from the server conforms to the standard `{ success, data, error, requestId }` envelope:

```typescript
// Successful Response
{
  "success": true,
  "data": { ... },       // Payload object
  "error": null,
  "requestId": "c1f7a240-8b1e-42c2-9e8a-7744ee3a6a6e"
}

// Error Response
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",  // Stable machine-readable error code
    "message": "Human-readable explanation of error",
    "details": [ ... ]           // Optional validation issues array or object
  },
  "requestId": "c1f7a240-8b1e-42c2-9e8a-7744ee3a6a6e"
}
```

### 1.2 Stable Error Codes

| Error Code | HTTP Status | Description |
| :--- | :---: | :--- |
| `VALIDATION_ERROR` | `400` / `413` | Input validation failed, malformed JSON, prototype pollution attempt, or oversized body/file. |
| `AUTH_REQUIRED` | `401` | Missing, malformed, or tampered JWT access token, or revoked refresh token. |
| `INVALID_CREDENTIALS` | `401` | Incorrect email or password on login. |
| `TOKEN_EXPIRED` | `401` | Access token lifetime (15m) has elapsed. Frontend should trigger `POST /auth/refresh`. |
| `FORBIDDEN` | `403` | CSRF origin mismatch, unapproved CORS origin, or insufficient role permissions. |
| `RESOURCE_NOT_FOUND` | `404` | Resource does not exist **OR** is owned by another user (strict IDOR prevention). |
| `RATE_LIMITED` | `429` | Request threshold exceeded for auth (10/15m), AI (25/15m), or global API (100/15m). |
| `DATABASE_ERROR` | `500` | Database connectivity failure or query execution error. |
| `INTERNAL_ERROR` | `500` | Unhandled server exception. Stack traces suppressed in production. |
| `AI_SERVICE_ERROR` | `502` / `503` / `504` | Upstream AI down (502), schema invalid (502), model overloaded (503), or timeout (504). |

### 1.3 Cookie & CSRF Behavior
* **Cookies:**
  * `access_token`: Lifetime 15 minutes. `httpOnly: true`, `sameSite: 'strict'`, `secure: true` (in production), `path: '/'`.
  * `refresh_token`: Lifetime 7 days. `httpOnly: true`, `sameSite: 'strict'`, `secure: true` (in production), `path: '/api/v1/auth'`.
* **Frontend Requirement:** All requests from React (Axios, Fetch, TanStack Query) **must** include credentials:
  ```typescript
  // Native fetch
  fetch('/api/v1/documents', { credentials: 'include' });

  // Axios
  axios.defaults.withCredentials = true;
  ```
* **CSRF Protection:** State-changing requests (`POST`, `PATCH`, `DELETE`, `PUT`) strictly verify that the `Origin` or `Referer` matches the configured `FRONTEND_URL` (`http://localhost:5173`).

### 1.4 Standard Pagination Contract
Endpoints supporting pagination (`GET /documents`, `GET /history`) accept standardized query parameters:

| Parameter | Type | Default | Restrictions | Description |
| :--- | :---: | :---: | :---: | :--- |
| `page` | integer | `1` | $\ge 1$ | 1-indexed page number |
| `limit` | integer | `10` | $1 \le \text{limit} \le 50$ | Items per page (capped at 50) |
| `sortBy` | string | `createdAt` | Whitelisted per entity | Field to sort by |
| `sortOrder` | string | `desc` | `'asc'` \| `'desc'` | Sort direction |
| `search` | string | optional | Max 100 characters | Substring search filter |
| `status` | string | optional | Entity-dependent | Status filter |

**Paginated Response Format:**
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  },
  "error": null,
  "requestId": "..."
}
```

---

## 2. Health & Probe Endpoints

### 2.1 `GET /health` & `GET /api/v1/health`
* **Auth:** None (Public)
* **Response `200 OK`:**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-01T12:00:00.000Z",
    "uptime": 128.45,
    "environment": "development"
  }
  ```

### 2.2 `GET /ready` & `GET /api/v1/ready`
* **Auth:** None (Public)
* **Response `200 OK`:**
  ```json
  {
    "status": "ready",
    "database": "connected",
    "aiService": "ready",
    "timestamp": "2026-10-01T12:00:00.000Z"
  }
  ```

---

## 3. Authentication Endpoints (`/api/v1/auth`)

### 3.1 Register User
* **Method & URL:** `POST /api/v1/auth/register`
* **Auth:** None (Public)
* **Rate Limit:** 10 attempts per 15 minutes per IP
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "email": "analyst@gov.in",
    "password": "SecurePassword123",
    "name": "Dr. Sarah Rao",
    "role": "analyst"               // Optional: "admin" | "analyst" | "viewer" (default: "analyst")
  }
  ```
* **Validation Rules:**
  * `email`: Valid email format, lowercase, trimmed.
  * `password`: Min 8 characters, at least 1 uppercase letter, at least 1 number.
  * `name`: 2–100 characters, trimmed.
* **Success `201 Created`:** Sets `access_token` and `refresh_token` cookies.
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "7b8f9a2e-4c1d-4819-bf90-34a8e2349121",
        "email": "analyst@gov.in",
        "name": "Dr. Sarah Rao",
        "role": "analyst",
        "createdAt": "2026-10-01T12:00:00.000Z",
        "updatedAt": "2026-10-01T12:00:00.000Z"
      },
      "message": "Account successfully registered"
    },
    "error": null,
    "requestId": "..."
  }
  ```
* **Errors:** `400 VALIDATION_ERROR` (weak password, duplicate email), `429 RATE_LIMITED`.

### 3.2 Login User
* **Method & URL:** `POST /api/v1/auth/login`
* **Auth:** None (Public)
* **Rate Limit:** 10 attempts per 15 minutes per IP
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "email": "analyst@gov.in",
    "password": "SecurePassword123"
  }
  ```
* **Success `200 OK`:** Sets `access_token` and `refresh_token` cookies.
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "7b8f9a2e-4c1d-4819-bf90-34a8e2349121",
        "email": "analyst@gov.in",
        "name": "Dr. Sarah Rao",
        "role": "analyst",
        "createdAt": "2026-10-01T12:00:00.000Z",
        "updatedAt": "2026-10-01T12:00:00.000Z"
      },
      "message": "Login successful"
    },
    "error": null,
    "requestId": "..."
  }
  ```
* **Errors:** `401 INVALID_CREDENTIALS` (email or password incorrect), `429 RATE_LIMITED`.

### 3.3 Refresh Session Tokens
* **Method & URL:** `POST /api/v1/auth/refresh`
* **Auth:** Requires valid `refresh_token` HTTP-only cookie.
* **Success `200 OK`:** Rotates tokens and sets new `access_token` and `refresh_token` cookies.
  ```json
  {
    "success": true,
    "data": {
      "user": { ... },
      "message": "Token successfully refreshed"
    },
    "error": null,
    "requestId": "..."
  }
  ```
* **Errors:** `401 AUTH_REQUIRED` (refresh token missing, revoked, or expired).

### 3.4 Logout
* **Method & URL:** `POST /api/v1/auth/logout`
* **Auth:** Optional token.
* **Success `200 OK`:** Revokes active refresh token in database and clears both cookies.
  ```json
  {
    "success": true,
    "data": {
      "message": "Logged out successfully"
    },
    "error": null,
    "requestId": "..."
  }
  ```

### 3.5 Get Current Profile
* **Method & URL:** `GET /api/v1/auth/me`
* **Auth:** Authenticated (`access_token` cookie)
* **Success `200 OK`:** Returns verified user profile.
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "7b8f9a2e-4c1d-4819-bf90-34a8e2349121",
        "email": "analyst@gov.in",
        "name": "Dr. Sarah Rao",
        "role": "analyst",
        "createdAt": "2026-10-01T12:00:00.000Z",
        "updatedAt": "2026-10-01T12:00:00.000Z"
      }
    },
    "error": null,
    "requestId": "..."
  }
  ```
* **Errors:** `401 AUTH_REQUIRED` or `401 TOKEN_EXPIRED`.

---

## 4. Document Endpoints (`/api/v1/documents`)

### 4.1 Create Document (JSON or Multipart Upload)
* **Method & URL:** `POST /api/v1/documents`
* **Auth:** Authenticated
* **Content-Type A (`application/json`):**
  ```json
  {
    "title": "National Green Hydrogen Mission 2026",
    "extractedText": "Statutory targets for green ammonia production and export subsidy frameworks..."
  }
  ```
* **Content-Type B (`multipart/form-data`):**
  * `file`: Single binary file (`.pdf`, `.docx`, or `.txt`), maximum size 10MB. Magic byte signatures strictly validated.
  * `title`: Optional document title (defaults to sanitized filename if omitted).
* **Success `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "document": {
        "id": "90e1bae7-88c1-4a3f-99bb-7fe25ae93f71",
        "ownerId": "7b8f9a2e-4c1d-4819-bf90-34a8e2349121",
        "title": "National Green Hydrogen Mission 2026",
        "extractedText": "...",
        "fileName": "national_green_hydrogen_mission_2026.pdf",
        "fileSize": 1420580,
        "mimeType": "application/pdf",
        "status": "ready",
        "createdAt": "2026-10-01T12:05:00.000Z",
        "updatedAt": "2026-10-01T12:05:00.000Z"
      }
    },
    "error": null,
    "requestId": "..."
  }
  ```
* **Errors:** `400 VALIDATION_ERROR` (invalid file type or corrupted magic bytes), `413 VALIDATION_ERROR` (file exceeds 10MB).

### 4.2 List User Documents
* **Method & URL:** `GET /api/v1/documents`
* **Auth:** Authenticated (returns only documents owned by the active user)
* **Query Parameters:**
  * `page` (default `1`)
  * `limit` (default `10`, max `50`)
  * `sortBy` (`createdAt` | `updatedAt` | `title` | `status` | `fileName`, default `createdAt`)
  * `sortOrder` (`asc` | `desc`, default `desc`)
  * `search` (optional substring search filter)
  * `status` (optional: `'pending'` | `'processing'` | `'ready'` | `'failed'`)
* **Success `200 OK`:** Returns paginated list of documents.

### 4.3 Get Document by ID
* **Method & URL:** `GET /api/v1/documents/:id`
* **Auth:** Authenticated
* **Ownership Policy:** Strict IDOR prevention. If document does not exist or belongs to another user, returns `404 RESOURCE_NOT_FOUND`.
* **Success `200 OK`:** Returns document object.

### 4.4 Update Document Metadata
* **Method & URL:** `PATCH /api/v1/documents/:id`
* **Auth:** Authenticated + Ownership
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "title": "Updated Directive Title",
    "status": "ready"
  }
  ```
* **Success `200 OK`:** Returns updated document.
* **Errors:** `404 RESOURCE_NOT_FOUND` (if unowned), `400 VALIDATION_ERROR`.

### 4.5 Delete Document
* **Method & URL:** `DELETE /api/v1/documents/:id`
* **Auth:** Authenticated + Ownership
* **Success `200 OK`:**
  ```json
  {
    "success": true,
    "data": { "message": "Document deleted successfully" },
    "error": null,
    "requestId": "..."
  }
  ```
* **Errors:** `404 RESOURCE_NOT_FOUND` (if unowned).

---

## 5. Policy Analysis Endpoints (`/api/v1/analyses`)

### 5.1 Trigger AI Document Analysis
* **Method & URL:** `POST /api/v1/analyses`
* **Auth:** Authenticated + Document Ownership
* **Rate Limit:** 25 AI queries per 15 minutes per user
* **Timeout:** 30 seconds
* **Request Body:**
  ```json
  {
    "documentId": "90e1bae7-88c1-4a3f-99bb-7fe25ae93f71",
    "analysisType": "comprehensive"   // "summary" | "comprehensive" | "stakeholder_impact" | "recommendations"
  }
  ```
* **Success `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "analysis": {
        "id": "57ed6369-f34b-46b0-8649-1f30251c7a57",
        "documentId": "90e1bae7-88c1-4a3f-99bb-7fe25ae93f71",
        "ownerId": "7b8f9a2e-4c1d-4819-bf90-34a8e2349121",
        "analysisType": "comprehensive",
        "result": {
          "summary": "High-level statutory overview...",
          "keyPoints": [
            "Central funding ratio established at 60:40.",
            "Mandatory compliance timeline set for FY2027."
          ],
          "stakeholderImpacts": [
            {
              "stakeholder": "State Discoms",
              "impact": "Required to integrate renewable purchase obligations.",
              "severity": "high"
            }
          ],
          "recommendations": [
            "Establish regional monitoring taskforces by Q2."
          ],
          "confidenceScore": 0.94
        },
        "createdAt": "2026-10-01T12:10:00.000Z",
        "updatedAt": "2026-10-01T12:10:00.000Z"
      }
    },
    "error": null,
    "requestId": "..."
  }
  ```
* **Errors:** `404 RESOURCE_NOT_FOUND` (if document not owned), `429 RATE_LIMITED`, `502 AI_SERVICE_ERROR`, `503 AI_SERVICE_ERROR` (model overloaded), `504 AI_SERVICE_ERROR` (timeout).

### 5.2 List Analyses for Document
* **Method & URL:** `GET /api/v1/analyses/document/:documentId`
* **Auth:** Authenticated + Document Ownership
* **Success `200 OK`:** Returns array of analyses for that document.

### 5.3 Get Analysis by ID
* **Method & URL:** `GET /api/v1/analyses/:id`
* **Auth:** Authenticated + Ownership (`404` if unowned)
* **Success `200 OK`:** Returns analysis object.

### 5.4 Update Analysis (Metadata)
* **Method & URL:** `PATCH /api/v1/analyses/:id`
* **Auth:** Authenticated + Ownership (`404` if unowned)
* **Success `200 OK`:** Returns analysis object.

### 5.5 Delete Analysis
* **Method & URL:** `DELETE /api/v1/analyses/:id`
* **Auth:** Authenticated + Ownership (`404` if unowned)
* **Success `200 OK`:** Returns success message.

---

## 6. Question Answering Endpoints (`/api/v1/questions`)

### 6.1 Ask Question on Document
* **Method & URL:** `POST /api/v1/questions`
* **Auth:** Authenticated + Document Ownership
* **Rate Limit:** 25 AI queries per 15 minutes per user
* **Timeout:** 30 seconds
* **Request Body:**
  ```json
  {
    "documentId": "90e1bae7-88c1-4a3f-99bb-7fe25ae93f71",
    "question": "What are the non-compliance penalties specified in Section 8?"
  }
  ```
* **Success `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "question": {
        "id": "180ab9dc-894f-4b46-835e-b066ea7d16fc",
        "documentId": "90e1bae7-88c1-4a3f-99bb-7fe25ae93f71",
        "userId": "7b8f9a2e-4c1d-4819-bf90-34a8e2349121",
        "question": "What are the non-compliance penalties specified in Section 8?",
        "answer": {
          "answer": "Section 8 stipulates financial disincentives capped at 2% of annual operating budget...",
          "citations": [
            {
              "pageOrSection": "Section 8.1 (Penal Provisions)",
              "quote": "Failure to furnish quarterly compliance audits shall incur administrative fines."
            }
          ],
          "confidenceScore": 0.92
        },
        "createdAt": "2026-10-01T12:15:00.000Z"
      }
    },
    "error": null,
    "requestId": "..."
  }
  ```
* **Errors:** `404 RESOURCE_NOT_FOUND` (if document unowned), `429 RATE_LIMITED`, `502 AI_SERVICE_ERROR`.

### 6.2 Get Q&A History for Document
* **Method & URL:** `GET /api/v1/questions/history/:documentId`
* **Auth:** Authenticated + Document Ownership
* **Success `200 OK`:** Returns chronological array of question-answer pairs for the user on that document.

### 6.3 Get, Update, or Delete Single Question
* `GET /api/v1/questions/:id` (Ownership enforced: `404` if unowned)
* `PATCH /api/v1/questions/:id` (Ownership enforced: `404` if unowned)
* `DELETE /api/v1/questions/:id` (Ownership enforced: `404` if unowned)

---

## 7. Document Comparison Endpoints (`/api/v1/comparisons`)

### 7.1 Compare 2–5 Documents
* **Method & URL:** `POST /api/v1/comparisons`
* **Auth:** Authenticated + Ownership of **all** referenced documents
* **Rate Limit:** 25 AI queries per 15 minutes per user
* **Timeout:** 30 seconds
* **Request Body:**
  ```json
  {
    "documentIds": [
      "90e1bae7-88c1-4a3f-99bb-7fe25ae93f71",
      "2a92cd99-4245-4b84-af81-2ebe636e09dd"
    ],
    "title": "Renewable Hydrogen vs Solar Policy Frameworks" // Optional
  }
  ```
* **Validation Rules:**
  * Must contain between 2 and 5 document IDs.
  * Duplicate document IDs are rejected (`400 VALIDATION_ERROR`).
  * If ANY document ID does not belong to the user, returns `404 RESOURCE_NOT_FOUND`.
* **Success `201 Created`:**
  ```json
  {
    "success": true,
    "data": {
      "comparison": {
        "id": "e8bdbf25-b919-4896-8e53-2df32814cba7",
        "userId": "7b8f9a2e-4c1d-4819-bf90-34a8e2349121",
        "documentIds": [ "...", "..." ],
        "title": "Renewable Hydrogen vs Solar Policy Frameworks",
        "result": {
          "commonThemes": [
            "De-carbonization targets aligned with national goals",
            "State-level regulatory enforcement mechanism"
          ],
          "keyDifferences": [
            {
              "aspect": "Capital Subsidy Structure",
              "findings": {
                "National Green Hydrogen Mission 2026": "Production-linked incentive model (PLI)",
                "Solar Policy Framework": "Direct capital expenditure grant"
              }
            }
          ],
          "policyDivergenceAnalysis": "Detailed comparative analysis across both policies..."
        },
        "createdAt": "2026-10-01T12:20:00.000Z"
      }
    },
    "error": null,
    "requestId": "..."
  }
  ```

### 7.2 List User Comparisons
* **Method & URL:** `GET /api/v1/comparisons`
* **Auth:** Authenticated (scoped strictly to `req.user.id`)
* **Success `200 OK`:** Returns array of comparison records.

### 7.3 Get, Update, or Delete Comparison
* `GET /api/v1/comparisons/:id` (Ownership enforced: `404` if unowned)
* `PATCH /api/v1/comparisons/:id` (Ownership enforced: `404` if unowned)
* `DELETE /api/v1/comparisons/:id` (Ownership enforced: `404` if unowned)

---

## 8. Audit & Activity History Endpoints (`/api/v1/history`)

### 8.1 Get User Activity Log
* **Method & URL:** `GET /api/v1/history`
* **Auth:** Authenticated (strictly isolated to current user)
* **Query Parameters:** `page`, `limit` (max 50)
* **Success `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "98f2bfbd-f5aa-4864-83e6-afed35e99fa6",
          "userId": "7b8f9a2e-4c1d-4819-bf90-34a8e2349121",
          "action": "UPLOAD",  // "UPLOAD" | "ANALYZE" | "QUESTION" | "COMPARE" | "DELETE_DOC"
          "resourceId": "90e1bae7-88c1-4a3f-99bb-7fe25ae93f71",
          "details": { "title": "National Green Hydrogen Mission 2026" },
          "createdAt": "2026-10-01T12:05:00.000Z"
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    },
    "error": null,
    "requestId": "..."
  }
  ```

### 8.2 Clear User History
* **Method & URL:** `DELETE /api/v1/history`
* **Auth:** Authenticated
* **Behavior:** Bulk clears history logs **only for the requesting user**. Other users' logs remain untouched.
* **Success `200 OK`:** `{ "message": "History cleared successfully" }`.

### 8.3 Get, Update, or Delete Single History Item
* `GET /api/v1/history/:id` (Ownership enforced: `404` if unowned)
* `PATCH /api/v1/history/:id` (Ownership enforced: `404` if unowned)
* `DELETE /api/v1/history/:id` (Ownership enforced: `404` if unowned)
