# PolicyIntelligence Platform: Backend REST API Contract
**Target Owner**: Person 3 (Backend Engineer: Express, MongoDB, Gemini Services)  
**Consumer**: Person 2 (Frontend Engineer: React / Vite Frontend)  
**Standard**: WCAG 2.2 AA Compatible Data Structures • Verifiable Source Attribution

---

## 1. Overview & General Architecture
All frontend network interactions flow strictly through:
```
React Client -> Frontend API Service Layer -> Express API -> Gemini / MongoDB
```
- Base URL configured via `VITE_API_BASE_URL` (default: `http://localhost:5000/api`).
- Frontend operates in isolated mock mode when `VITE_USE_MOCK_API=true`.
- Real API calls must return standard JSON envelopes with appropriate HTTP status codes.
- **Zero Hallucination Standard**: Every AI summary, provision, or risk item **must** include an array of `citations` with `pageNumber` and exact `excerptQuote`. Never return fabricated page references or unbacked claims.

---

## 2. API Endpoints Specification

### 2.1 Health Check
- **`GET /api/health`**
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "geminiConnected": true,
  "mongoConnected": true
}
```

---

### 2.2 List Documents
- **`GET /api/documents`**
- **Query Parameters**:
  - `category` (optional): `environmental` | `healthcare` | `technology_ai` | `energy` | `finance_trade` | `education` | `infrastructure` | `general`
  - `status` (optional): `uploaded` | `extracting` | `chunking` | `ready` | `analyzing` | `analyzed` | `failed`
  - `search` (optional): case-insensitive substring match on `title`, `issuingMinistry`, or summary.
- **Response `200 OK`**:
```json
{
  "data": [
    {
      "id": "doc-gov-2024-001",
      "title": "National Green Hydrogen Mission Guidelines",
      "issuingMinistry": "Ministry of New and Renewable Energy",
      "publicationDate": "2024-03-15",
      "category": "energy",
      "fileSize": 4280192,
      "pageCount": 68,
      "status": "analyzed",
      "uploadedAt": "2024-04-10T09:30:00.000Z",
      "lastUpdated": "2024-04-10T09:35:12.000Z",
      "summarySnippet": "Framework for financial incentives covering domestic electrolyser manufacturing."
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 50
  }
}
```

---

### 2.3 Upload Policy Document
- **`POST /api/documents/upload`**
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `file`: PDF or text file binary (max 50MB)
  - `title`: string (min 3 chars, required)
  - `issuingMinistry`: string (required)
  - `category`: string (required)
  - `publicationDate`: ISO date string `YYYY-MM-DD` (required)
- **Response `201 Created`**:
```json
{
  "data": {
    "id": "doc-gov-2024-005",
    "title": "National Cyber Security Strategy Guidelines",
    "issuingMinistry": "Ministry of Electronics and Information Technology",
    "category": "technology_ai",
    "publicationDate": "2024-04-01",
    "fileSize": 1823900,
    "status": "extracting",
    "uploadedAt": "2024-04-15T12:00:00.000Z",
    "lastUpdated": "2024-04-15T12:00:00.000Z",
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
- **Error `400 Bad Request`**: `{ "message": "Validation error: Missing issuingMinistry" }`
- **Error `422 Unprocessable Entity`**: `{ "message": "Unsupported file format. Please upload PDF or DOCX" }`

---

### 2.4 Document Processing Status
- **`GET /api/documents/:id/status`**
- **Response `200 OK`**:
```json
{
  "status": "extracting",
  "stages": [
    { "stage": "upload", "label": "File Upload & Verification", "status": "completed", "startedAt": "2024-04-15T12:00:00Z", "completedAt": "2024-04-15T12:00:04Z" },
    { "stage": "ocr_extraction", "label": "PDF Text Extraction", "status": "in_progress", "startedAt": "2024-04-15T12:00:04Z" },
    { "stage": "chunking", "label": "Semantic Chunking", "status": "pending" },
    { "stage": "indexing", "label": "Vector Indexing", "status": "pending" },
    { "stage": "synthesis", "label": "Policy Intelligence Synthesis", "status": "pending" }
  ],
  "failureReason": null
}
```

---

### 2.5 Single Document Details
- **`GET /api/documents/:id`**
- **Response `200 OK`**: PolicyDocument object
- **Error `404 Not Found`**: `{ "message": "Policy document not found" }`

---

### 2.6 Full Policy Analysis & Evidence
- **`GET /api/documents/:id/analysis`**
- **Contract Rule**: Never call Gemini directly from the client. The backend executes prompts and returns this structured analysis.
- **Response `200 OK`**:
```json
{
  "data": {
    "documentId": "doc-gov-2024-001",
    "executiveSummary": "Full policy summary synthesised with clear policy takeaways...",
    "analyzedAt": "2024-04-10T09:35:12.000Z",
    "modelVersion": "Gemini-1.5-Pro",
    "keyProvisions": [
      {
        "id": "prov-1",
        "title": "Component I: Electrolyser Manufacturing Subsidy",
        "summary": "Direct capital incentives for domestic electrolyser plants...",
        "mandateLevel": "mandatory",
        "effectiveDate": "2024-06-01",
        "enforcingAgency": "Solar Energy Corporation of India (SECI)",
        "penaltiesOrConsequences": "Revocation of bank guarantee...",
        "citations": [
          {
            "id": "cit-1",
            "documentId": "doc-gov-2024-001",
            "documentTitle": "National Green Hydrogen Mission Guidelines",
            "pageNumber": 14,
            "sectionHeading": "Section 4.2: Eligibility Criteria",
            "paragraphNumber": 3,
            "excerptQuote": "The bidder must commit to minimum local value addition (LVA) of 40% in Year 1...",
            "confidenceScore": 0.98
          }
        ]
      }
    ],
    "stakeholderImpacts": [
      {
        "id": "stake-1",
        "groupName": "Domestic Clean Tech Manufacturers",
        "impactType": "positive",
        "description": "Substantial direct capital subsidization...",
        "complianceDeadline": "2024-12-31",
        "citations": [ ... ]
      }
    ],
    "risksAndGaps": [
      {
        "id": "risk-1",
        "category": "enforcement_gap",
        "severity": "high",
        "description": "Absence of unified interstate transmission open-access waiver coordination...",
        "suggestedRemediation": "Issue binding statutory directions under Section 107...",
        "citations": [ ... ]
      }
    ],
    "extractedMetrics": [
      {
        "label": "Total Allocated Outlay",
        "value": "17,490",
        "unit": "₹ Crore",
        "citations": [ ... ]
      }
    ]
  }
}
```

---

### 2.7 Retry Failed Pipeline
- **`POST /api/documents/:id/retry`**
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Processing pipeline restarted for document doc-gov-2024-004"
}
```

---

### 2.8 Cross-Policy Comparison Query
- **`POST /api/analysis/cross-policy`**
- **Request Body**:
```json
{
  "query": "What are the emission and decarbonization targets across active policies?",
  "documentIds": ["doc-gov-2024-001", "doc-gov-2024-003"]
}
```
- **Response `200 OK`**:
```json
{
  "data": {
    "query": "What are the emission and decarbonization targets across active policies?",
    "timestamp": "2024-04-15T12:00:00Z",
    "synthesizedAnswer": "Comparative analysis shows...",
    "comparisonMatrix": [
      {
        "comparisonTopic": "Decarbonization Benchmarks",
        "findings": [
          {
            "documentId": "doc-gov-2024-001",
            "documentTitle": "National Green Hydrogen Mission Guidelines",
            "findingSummary": "Targets 5 MMT annual green hydrogen capacity by 2030...",
            "citations": [ ... ]
          }
        ]
      }
    ],
    "allCitations": [ ... ]
  }
}
```

---

## 3. Checklist for Person 3
1. [ ] CORS configured on Express to permit frontend origin (`http://localhost:5173`).
2. [ ] File uploads handled via `multer` storing files to disk or S3/GridFS.
3. [ ] Background queue (or async promise chain) transitioning document status: `uploaded` -> `extracting` -> `chunking` -> `indexing` -> `analyzed` (or `failed`).
4. [ ] Citation coordinates (`pageNumber`, `sectionHeading`, `excerptQuote`) preserved and returned with all AI responses.
