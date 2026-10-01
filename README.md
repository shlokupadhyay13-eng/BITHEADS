<<<<<<< HEAD
# Government Policies & Reports Analyser — Backend Foundation

A robust, enterprise-grade Express.js and MongoDB backend scaffold powering the **Government Policies & Reports Analyser**. Built for multi-developer hackathon execution, this module provides resilient database connectivity, complete Mongoose schema modeling, security headers, centralized error handling, and comprehensive automated test coverage.

## Architecture Diagram

```
+-----------------------------------------------------------------------+
|                         React Client (Person 2)                       |
+-----------------------------------------------------------------------+
                                   |
                                   | HTTP / REST API
                                   v
+-----------------------------------------------------------------------+
|                        Express API (Person 4 Core)                    |
|  - Security: Helmet, CORS, MongoSanitize                              |
|  - Core Endpoints: GET /api/health                                    |
|  - Extension Hooks: createApp({ routers })                            |
|  - Centralized Error Handler (AppError, Cast, Validation, DupKey)     |
+-----------------------------------------------------------------------+
         |                                                 |
         | Mounting Point                                  | Schema Access
         v                                                 v
+------------------------------------+   +------------------------------+
| Auth & API Routes (Person 3)       |   | MongoDB Database (Person 4)  |
| AI & Gemini Service (Person 1)     |   |  - User                      |
|                                    |   |  - Document                  |
+------------------------------------+   |  - Analysis                  |
                 |                       |  - ChatSession               |
                 v                       |  - Comparison                |
+------------------------------------+   +------------------------------+
| Google Gemini 1.5 API (Person 1)   |
+------------------------------------+
```

---

## Tech Stack Overview

| Technology | Purpose | Version / Spec |
| :--- | :--- | :--- |
| **Node.js** | JavaScript Runtime | `>= 18.0.0` |
| **Express.js** | Web Application Framework | `^4.19.2` |
| **MongoDB / Mongoose** | NoSQL Database & ORM | Mongoose `^8.5.0` |
| **Bcrypt.js** | Password Hashing | `^2.4.3` (12 Salt Rounds) |
| **Helmet** | HTTP Security Headers | `^7.1.0` |
| **MongoSanitize** | NoSQL Injection Prevention | `^2.2.0` |
| **Jest & Supertest** | Automated Testing & API Assertions | Jest `^29.7.0`, Supertest `^7.0.0` |
| **MongoDB Memory Server** | In-Memory Database for Fast Integration Tests | `^9.4.0` |

---

## Data Models & Schema Design

### 1. `User` (`models/User.js`)
* **Fields:** `name` (String, required, max 100), `email` (String, required, unique, lowercase, regex-validated), `password` (String, minlength 8, `select: false`), `role` (`['user', 'admin']`, default `'user'`), `createdAt`, `updatedAt`.
* **Hooks & Methods:** Pre-save async password hash via `bcryptjs` (12 rounds). Instance method `comparePassword(candidate)`.
* **Indexes:** Unique index on `{ email: 1 }`.
* **Transform:** `toJSON` automatically omits `password` and `__v`.

### 2. `Document` (`models/Document.js`)
* **Fields:** `uploadedBy` (ObjectId ref `User`), `title` (String, required, max 300), `originalFileName` (String), `mimeType` (String), `fileSizeBytes` (Number), `rawText` (String), `category` (String, default `'general'`), `status` (`['pending', 'processing', 'analyzed', 'failed']`, default `'pending'`), `errorMessage` (String).
* **Indexes:** Compound index `{ uploadedBy: 1, createdAt: -1 }`. Text search index `document_text_search` on `{ title: 'text', rawText: 'text' }` with weights `{ title: 10, rawText: 1 }`.

### 3. `Analysis` (`models/Analysis.js`)
* **Fields:** `documentId` (ObjectId ref `Document`, unique), `policyImpactScore` (Number, min 0, max 100), `summary` (String), `structuredJSON` (Mixed Object), `modelVersion` (String).
* **Indexes:** Unique index on `documentId`.

### 4. `ChatSession` (`models/ChatSession.js`)
* **Fields:** `documentId` (ObjectId ref `Document`), `userId` (ObjectId ref `User`), `messages` (Array of embedded subdocuments `{ role, content, createdAt }`).
* **Indexes:** Compound index `{ userId: 1, documentId: 1, updatedAt: -1 }`.
* **Methods:** `addMessage(role, content)` pushes and persists message subdocuments.

### 5. `Comparison` (`models/Comparison.js`)
* **Fields:** `createdBy` (ObjectId ref `User`), `documentIds` (Array of ObjectIds, custom validator enforcing `length >= 2` and no duplicate IDs), `title` (String), `resultJSON` (Mixed Object).
* **Indexes:** Compound index `{ createdBy: 1, createdAt: -1 }`.

---

## API Integration Contract Table

| Method | Path | Auth Required | Owner | Request Body / Query | Response Envelope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | No | Person 4 | None | `{ success: true, status: 'ok', db, uptime, timestamp }` |
| `POST` | `/api/auth/register` | No | Person 3 | `{ name, email, password }` | `{ success: true, token, user }` |
| `POST` | `/api/auth/login` | No | Person 3 | `{ email, password }` | `{ success: true, token, user }` |
| `GET` | `/api/documents` | Yes (JWT) | Person 3 | Query: `category`, `search`, `page` | `{ success: true, documents: [] }` |
| `POST` | `/api/documents` | Yes (JWT) | Person 3 | Multipart: `file`, `title`, `category` | `{ success: true, document }` |
| `GET` | `/api/documents/:id` | Yes (JWT) | Person 3 | Params: `id` | `{ success: true, document }` |
| `POST` | `/api/documents/:id/analyze` | Yes (JWT) | Person 1 | Params: `id` | `{ success: true, analysis }` |
| `GET` | `/api/analysis/:documentId` | Yes (JWT) | Person 1 | Params: `documentId` | `{ success: true, analysis }` |
| `POST` | `/api/chat/:documentId` | Yes (JWT) | Person 1 | Body: `{ message }` | `{ success: true, response, session }` |
| `POST` | `/api/comparisons` | Yes (JWT) | Person 3/1 | Body: `{ documentIds, title }` | `{ success: true, comparison }` |

### Standard Response Envelopes & Status Code Mapping
* **Success (200 / 201):** `{ success: true, data: ... }`
* **Errors:** `{ success: false, error: { code, message, details? } }`
  * `400 Bad Request`: Validation errors (`VALIDATION_ERROR`), Cast errors (`CAST_ERROR`), Malformed JSON (`INVALID_JSON`).
  * `404 Not Found`: Unknown routes (`HTTP_404`).
  * `409 Conflict`: Unique field collision (`DUPLICATE_KEY_ERROR`).
  * `500 Internal Server Error`: Server errors (`INTERNAL_SERVER_ERROR`).

---

## Extension & Integration Guide

### 1. Mounting Person 3 & Person 1 Routers
Person 3 and Person 1 can register custom Express routers without modifying Person 4's server core files:

```js
const { createApp } = require('./server');
const authRouter = require('./routes/authRouter');
const documentRouter = require('./routes/documentRouter');
const aiRouter = require('./routes/aiRouter');

const app = createApp({
  routers: [
    { path: '/api/auth', router: authRouter },
    { path: '/api/documents', router: documentRouter },
    { path: '/api/ai', router: aiRouter }
  ]
});
```

### 2. Utilizing Mongoose Models
Import models directly in controllers or services:

```js
const User = require('./models/User');
const Document = require('./models/Document');
const Analysis = require('./models/Analysis');
```

---

## Team Role Matrix

| Developer | Core Ownership & Scope | Boundary Rules |
| :--- | :--- | :--- |
| **Person 1** | AI Pipeline, Gemini 1.5 API, Document Parsing, Summarization & Chat | Writes `Analysis.structuredJSON`, updates `Document.status`. Must not modify `db/connect.js` or `models/`. |
| **Person 2** | React Frontend, UI/UX Components, State Management | Builds client-side code. Must not modify backend files. |
| **Person 3** | Authentication Controllers, JWT Middleware, Document & Comparison Routes | Consumes models from `models/` and mounts routes via `createApp({ routers })`. Must not edit Person 4's schemas directly. |
| **Person 4** | Database Architecture, Schema Design, Security, Global Error Handler, Test Suite, DevOps | Maintains Mongoose models, DB connections, health check, Jest test suite, package configs. |

---

## Local Setup & Development Guide

### Prerequisites
* Node.js `>= 18.0.0`
* MongoDB Community Server or MongoDB Atlas cluster (optional for local testing, as tests use in-memory DB)

### Setup Steps
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create environment configuration file:
   * **PowerShell (Windows):**
     ```powershell
     Copy-Item .env.example .env
     ```
   * **Linux/macOS:**
     ```bash
     cp .env.example .env
     ```
3. Run dev server:
   ```bash
   npm run dev
   ```
4. Run automated test suite:
   ```bash
   npm test
   ```
   > *Note: On the first test run, `mongodb-memory-server` downloads an in-memory Mongo binary. Ensure internet connectivity is available.*

---

## Testing & Troubleshooting

### Running Tests
Execute the Jest suite with:
```bash
npm test
```

### Common Troubleshooting
1. **MongoDB Connection Failure in Dev:**
   Ensure MongoDB service is running locally (`mongod` or via MongoDB Compass), or update `MONGODB_URI` in `.env` to point to a valid Atlas URI.
2. **Port 5000 Already in Use:**
   Update `PORT=5001` in your `.env` file.
3. **MongoDB Memory Server Download Failed during `npm test`:**
   Check your internet connection or firewall settings preventing binary download from `fastdl.mongodb.org`.
=======
# BITHEADS
>>>>>>> 7152c7c98981d33dcdd3aabedeb518c64102b8f4
