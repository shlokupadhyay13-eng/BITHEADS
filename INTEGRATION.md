# Government Policies & Reports Analyser — Integration Architecture & Contracts

> **Audience:**  
> - **Person 1:** Gemini AI & Document Processing Specialist  
> - **Person 4:** MongoDB Models, Repositories & Cloud Deployment Specialist  
> - **Person 2:** React Frontend Specialist (Reference for End-to-End Flow)  
>
> **Author:** Person 3 (Backend Architecture, Security & REST API Specialist)  
> **Status:** Active & Complete  
> **Architecture Style:** Hexagonal / Clean Architecture (Port & Adapter Pattern)  

---

## 1. System Integration Architecture

To allow 4 developers to work in parallel on a shared repository without breaking each other's code, Person 3 has decoupled the Express REST layer from AI processing (Person 1) and MongoDB persistence (Person 4) using **TypeScript Ports & Adapters (Interfaces)**.

```
+-----------------------------------------------------------------------------------+
|                              REACT FRONTEND (Person 2)                            |
+-----------------------------------------------------------------------------------+
                                         │  HTTPS / Cookie-based JWT
                                         ▼
+-----------------------------------------------------------------------------------+
|                        EXPRESS REST API LAYER (Person 3)                          |
|  - Middleware Pipeline (Helmet, CORS, NoSQL Sanitizer, Rate Limiters, Auth)       |
|  - Controllers & DTO Request Validation (Zod)                                     |
|  - Domain Services (DocumentService, AnalysisService, QuestionService, etc.)      |
+---------------------------------------┬-------------------------------------------+
                                        │
           ┌────────────────────────────┴─────────────────────────────┐
           ▼                                                          ▼
+─────────────────────────────────+        +──────────────────────────────────+
|      IAIService Interface       |        |    Repository Interfaces (x6)    |
|  (analyzeDocument,              |        |  (IUserRepository,              |
|   answerQuestion,               |        |   IDocumentRepository,           |
|   compareDocuments,             |        |   IAnalysisRepository,           |
|   generateResearchOutput)       |        |   IQuestionRepository,           |
|                                 |        |   IComparisonRepository,         |
|                                 |        |   IHistoryRepository)            |
+────────────────┬────────────────+        +─────────────────┬────────────────+
                 │                                           │
                 ▼                                           ▼
+─────────────────────────────────+        +──────────────────────────────────+
|    GEMINI ADAPTER (Person 1)    |        |    MONGO REPOSITORIES (Person 4) |
|  - Google GenAI SDK             |        |  - Mongoose / Mongo Driver       |
|  - Prompts & Document Parsing   |        |  - MongoDB Atlas Replica Set     |
|  - Structured Output JSON Mode  |        |  - Compound & Text Indexes       |
+─────────────────────────────────+        +──────────────────────────────────+
```

### Dependency Injection Wiring Point
The binding between interfaces and concrete implementations occurs in [`src/server.ts`](file:///d:/Antigravity%20backend%20p3/src/server.ts). In testing/offline mode, in-memory stubs (`src/adapters/`) are used. In production, Person 1's Gemini adapter and Person 4's Mongo repositories replace the stubs with zero changes required to business services, routes, or controllers.

---

## 2. Person 1 (Gemini / AI & Document Processing Specialist)

### 2.1 Interface Location & Contract
- **File Location:** [`src/interfaces/ai/IAIService.ts`](file:///d:/Antigravity%20backend%20p3/src/interfaces/ai/IAIService.ts)
- Person 1's AI service **must** implement this interface:

```typescript
export interface IAIService {
  analyzeDocument(input: AnalyzeDocumentInput): Promise<AnalysisResult>;
  answerQuestion(input: AnswerQuestionInput): Promise<QuestionAnswerResult>;
  compareDocuments(input: CompareDocumentsInput): Promise<ComparisonResult>;
  generateResearchOutput(input: GenerateResearchOutputInput): Promise<ResearchOutputResult>;
}
```

### 2.2 Input Data Types

```typescript
export interface DocumentInput {
  documentId: string;
  title: string;
  content: string; // Extracted plain text of the government policy/report
}

export interface AnalyzeDocumentInput {
  document: DocumentInput;
  analysisType: 'comprehensive' | 'summary' | 'policy_impact' | 'fiscal_implications';
}

export interface AnswerQuestionInput {
  document: DocumentInput;
  question: string;
  previousConversation?: Array<{
    role: 'user' | 'assistant';
    text: string;
  }>;
}

export interface CompareDocumentsInput {
  documents: DocumentInput[]; // Array of 2 to 5 documents
  aspects?: string[];         // Optional focus aspects (e.g. ['fiscal', 'timelines'])
}

export interface GenerateResearchOutputInput {
  documents: DocumentInput[];
  focusAreas?: string[];
  targetAudience?: 'policy_makers' | 'public_auditors' | 'general_public';
}
```

### 2.3 Output Data Types & Validation Rules

> [!IMPORTANT]
> Person 3's domain services execute runtime **Zod schema validation** on every response returned by Person 1's `IAIService`. If Person 1's output fails schema validation, Person 3 catches it, logs the violation safely, and responds to the frontend with HTTP `502 AI_SERVICE_ERROR` (`AI service output schema validation failed`).

#### 1. `AnalysisResult`
**Zod Schema:**
```typescript
export const stakeholderImpactSchema = z.object({
  stakeholder: z.string().min(1),
  impact: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high']),
});

export const analysisResultSchema = z.object({
  summary: z.string().min(1),
  keyPoints: z.array(z.string().min(1)),
  stakeholderImpacts: z.array(stakeholderImpactSchema),
  recommendations: z.array(z.string().min(1)),
  confidenceScore: z.number().min(0).max(1).optional(),
});
```

**JSON Schema Representation (Draft-07):**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AnalysisResult",
  "type": "object",
  "required": ["summary", "keyPoints", "stakeholderImpacts", "recommendations"],
  "properties": {
    "summary": { "type": "string", "minLength": 1 },
    "keyPoints": {
      "type": "array",
      "items": { "type": "string", "minLength": 1 }
    },
    "stakeholderImpacts": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["stakeholder", "impact", "severity"],
        "properties": {
          "stakeholder": { "type": "string", "minLength": 1 },
          "impact": { "type": "string", "minLength": 1 },
          "severity": { "type": "string", "enum": ["low", "medium", "high"] }
        }
      }
    },
    "recommendations": {
      "type": "array",
      "items": { "type": "string", "minLength": 1 }
    },
    "confidenceScore": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    }
  }
}
```

#### 2. `QuestionAnswerResult`
**Zod Schema:**
```typescript
export const questionAnswerResultSchema = z.object({
  answer: z.string().min(1),
  citations: z.array(
    z.object({
      pageOrSection: z.string().min(1),
      quote: z.string().min(1),
    })
  ),
  confidenceScore: z.number().min(0).max(1),
});
```

**JSON Schema Representation:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "QuestionAnswerResult",
  "type": "object",
  "required": ["answer", "citations", "confidenceScore"],
  "properties": {
    "answer": { "type": "string", "minLength": 1 },
    "citations": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["pageOrSection", "quote"],
        "properties": {
          "pageOrSection": { "type": "string", "minLength": 1 },
          "quote": { "type": "string", "minLength": 1 }
        }
      }
    },
    "confidenceScore": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    }
  }
}
```

#### 3. `ComparisonResult`
**Zod Schema:**
```typescript
export const comparisonResultSchema = z.object({
  commonThemes: z.array(z.string().min(1)),
  keyDifferences: z.array(
    z.object({
      aspect: z.string().min(1),
      findings: z.record(z.string()),
    })
  ),
  policyDivergenceAnalysis: z.string().min(1),
});
```

**JSON Schema Representation:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ComparisonResult",
  "type": "object",
  "required": ["commonThemes", "keyDifferences", "policyDivergenceAnalysis"],
  "properties": {
    "commonThemes": {
      "type": "array",
      "items": { "type": "string", "minLength": 1 }
    },
    "keyDifferences": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["aspect", "findings"],
        "properties": {
          "aspect": { "type": "string", "minLength": 1 },
          "findings": {
            "type": "object",
            "additionalProperties": { "type": "string" }
          }
        }
      }
    },
    "policyDivergenceAnalysis": { "type": "string", "minLength": 1 }
  }
}
```

#### 4. `ResearchOutputResult`
**Zod Schema:**
```typescript
export const researchOutputResultSchema = z.object({
  title: z.string().min(1),
  executiveBrief: z.string().min(1),
  thematicAnalysis: z.array(
    z.object({
      pillar: z.string().min(1),
      assessment: z.string().min(1),
      evidence: z.array(z.string().min(1)),
    })
  ),
  strategicRisks: z.array(z.string().min(1)),
  actionableDirectives: z.array(z.string().min(1)),
  metadata: z.record(z.unknown()).optional(),
});
```

### 2.4 Gemini Structured Output Guidance for Person 1
To guarantee that Gemini returns valid JSON matching these schemas:
1. Use the **Google GenAI SDK** (`@google/genai` or `@google/generative-ai`).
2. Pass `responseMimeType: "application/json"`.
3. Provide the JSON schema using `responseSchema` or strictly prompt Gemini to produce the exact JSON structure without markdown code fences (` ```json `).
4. Strip any leading/trailing markdown blocks before calling `JSON.parse()`.

### 2.5 Error Handling & Upstream Mappings
Person 3's error interceptors map exceptions thrown from Person 1's service to stable HTTP status codes:
- **Rate Limit / Model Overload (503):** If Gemini returns 429 or is overloaded, rethrow an `Error` containing `'overloaded'` or `'rate limit'`. Person 3 returns `503 AI_SERVICE_ERROR` (`AI service is temporarily unavailable. Please retry shortly.`).
- **Service Unreachable (502):** If network/connectivity to Gemini fails, throw an `Error` containing `'unreachable'` or network code. Person 3 returns `502 AI_SERVICE_ERROR`.
- **Operation Timeout (504):** Person 3 enforces `AI_TIMEOUT_MS` (default 30,000ms = 30s) per request. If Gemini processing exceeds 30 seconds, Person 3 automatically aborts the request and returns `504 AI_SERVICE_ERROR`. Person 1 must keep prompt execution within 30 seconds.

### 2.6 Example Real Adapter Implementation for Person 1

Create `src/adapters/ai/GeminiAIService.ts`:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  IAIService,
  AnalyzeDocumentInput,
  AnalysisResult,
  AnswerQuestionInput,
  QuestionAnswerResult,
  CompareDocumentsInput,
  ComparisonResult,
  GenerateResearchOutputInput,
  ResearchOutputResult,
} from '../../interfaces/ai/IAIService.js';

export class GeminiAIService implements IAIService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async analyzeDocument(input: AnalyzeDocumentInput): Promise<AnalysisResult> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `Analyze this government document: ${input.document.title}\nContent:\n${input.document.content}`;
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  }

  // Implement answerQuestion, compareDocuments, generateResearchOutput similarly...
}
```

---

## 3. Person 4 (MongoDB Models, Repositories & Deployment Specialist)

### 3.1 Overview & Responsibilities
- **Scope:** Person 4 owns database connectivity, Mongoose/MongoDB schemas, collection indexes, database migrations, and production containerization/deployment.
- **Contract:** Person 4 must implement the 6 repository interfaces defined in `src/interfaces/repositories/`.
- **No Direct Leaks:** Repositories must return plain TypeScript entities conforming to the defined entity interfaces (never leak raw Mongoose Documents with internal methods or passwords).

---

### 3.2 Repository Method Lists & Entity Specifications

#### 1. `IUserRepository`
- **Interface Path:** [`src/interfaces/repositories/IUserRepository.ts`](file:///d:/Antigravity%20backend%20p3/src/interfaces/repositories/IUserRepository.ts)

```typescript
export interface UserEntity {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin' | 'analyst' | 'viewer';
  refreshTokens?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  name: string;
  passwordHash: string;
  role?: 'admin' | 'analyst' | 'viewer';
}

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(data: CreateUserData): Promise<UserEntity>;
  update(id: string, data: Partial<UserEntity>): Promise<UserEntity | null>;
  delete(id: string): Promise<boolean>;
  addRefreshToken(userId: string, token: string): Promise<void>;
  removeRefreshToken(userId: string, token: string): Promise<void>;
  hasRefreshToken(userId: string, token: string): Promise<boolean>;
}
```

#### 2. `IDocumentRepository`
- **Interface Path:** [`src/interfaces/repositories/IDocumentRepository.ts`](file:///d:/Antigravity%20backend%20p3/src/interfaces/repositories/IDocumentRepository.ts)

```typescript
export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface DocumentEntity {
  id: string;
  ownerId: string;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  extractedText: string;
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentQueryOptions {
  skip: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: DocumentStatus;
}

export interface CreateDocumentData {
  ownerId: string;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  extractedText: string;
  status?: DocumentStatus;
}

export interface IDocumentRepository {
  findById(id: string): Promise<DocumentEntity | null>;
  findManyByOwner(
    ownerId: string,
    options: DocumentQueryOptions
  ): Promise<{ items: DocumentEntity[]; total: number }>;
  create(data: CreateDocumentData): Promise<DocumentEntity>;
  update(id: string, data: Partial<DocumentEntity>): Promise<DocumentEntity | null>;
  delete(id: string): Promise<boolean>;
}
```

#### 3. `IAnalysisRepository`
- **Interface Path:** [`src/interfaces/repositories/IAnalysisRepository.ts`](file:///d:/Antigravity%20backend%20p3/src/interfaces/repositories/IAnalysisRepository.ts)

```typescript
export interface AnalysisEntity {
  id: string;
  documentId: string;
  ownerId: string;
  analysisType: string;
  result: AnalysisResult; // See Section 2.3 for schema
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAnalysisData {
  documentId: string;
  ownerId: string;
  analysisType: string;
  result: AnalysisResult;
}

export interface IAnalysisRepository {
  findById(id: string): Promise<AnalysisEntity | null>;
  findByDocumentId(documentId: string): Promise<AnalysisEntity[]>;
  findByOwner(ownerId: string): Promise<AnalysisEntity[]>;
  create(data: CreateAnalysisData): Promise<AnalysisEntity>;
  delete(id: string): Promise<boolean>;
}
```

#### 4. `IQuestionRepository`
- **Interface Path:** [`src/interfaces/repositories/IQuestionRepository.ts`](file:///d:/Antigravity%20backend%20p3/src/interfaces/repositories/IQuestionRepository.ts)

```typescript
export interface QuestionEntity {
  id: string;
  documentId: string;
  userId: string;
  question: string;
  answer: QuestionAnswerResult; // See Section 2.3 for schema
  createdAt: Date;
}

export interface CreateQuestionData {
  documentId: string;
  userId: string;
  question: string;
  answer: QuestionAnswerResult;
}

export interface IQuestionRepository {
  findById(id: string): Promise<QuestionEntity | null>;
  findHistoryByDocument(documentId: string, userId: string): Promise<QuestionEntity[]>;
  create(data: CreateQuestionData): Promise<QuestionEntity>;
  delete(id: string): Promise<boolean>;
}
```

#### 5. `IComparisonRepository`
- **Interface Path:** [`src/interfaces/repositories/IComparisonRepository.ts`](file:///d:/Antigravity%20backend%20p3/src/interfaces/repositories/IComparisonRepository.ts)

```typescript
export interface ComparisonEntity {
  id: string;
  userId: string;
  documentIds: string[];
  title?: string;
  result: ComparisonResult; // See Section 2.3 for schema
  createdAt: Date;
}

export interface CreateComparisonData {
  userId: string;
  documentIds: string[];
  title?: string;
  result: ComparisonResult;
}

export interface IComparisonRepository {
  findById(id: string): Promise<ComparisonEntity | null>;
  findByUser(userId: string): Promise<ComparisonEntity[]>;
  create(data: CreateComparisonData): Promise<ComparisonEntity>;
  delete(id: string): Promise<boolean>;
}
```

#### 6. `IHistoryRepository`
- **Interface Path:** [`src/interfaces/repositories/IHistoryRepository.ts`](file:///d:/Antigravity%20backend%20p3/src/interfaces/repositories/IHistoryRepository.ts)

```typescript
export type HistoryAction = 'UPLOAD' | 'ANALYZE' | 'QUESTION' | 'COMPARE' | 'DELETE_DOC';

export interface HistoryEntity {
  id: string;
  userId: string;
  action: HistoryAction;
  resourceId?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateHistoryData {
  userId: string;
  action: HistoryAction;
  resourceId?: string;
  details?: Record<string, unknown>;
}

export interface IHistoryRepository {
  create(data: CreateHistoryData): Promise<HistoryEntity>;
  findById(id: string): Promise<HistoryEntity | null>;
  findByUser(
    userId: string,
    options: { skip: number; limit: number }
  ): Promise<{ items: HistoryEntity[]; total: number }>;
  clearByUser(userId: string): Promise<boolean>;
  deleteById(id: string): Promise<boolean>;
}
```

---

### 3.3 MongoDB Collection Indexing Requirements

To support Person 3's query patterns, sorting, search, ownership lookups, and pagination caps, Person 4 **must create the following indexes** on MongoDB:

| Collection | Index Fields | Type / Options | Reason / Query Pattern |
| :--- | :--- | :--- | :--- |
| **`users`** | `{ email: 1 }` | `unique: true` | Fast login/register uniqueness check |
| **`users`** | `{ refreshTokens: 1 }` | `sparse: true` | Token validation & rotation lookup |
| **`documents`** | `{ ownerId: 1, createdAt: -1 }` | Compound | Fast pagination of user documents sorted by newest |
| **`documents`** | `{ ownerId: 1, status: 1 }` | Compound | Filter user documents by processing status |
| **`documents`** | `{ title: "text", extractedText: "text" }` | Text Search | Keyword search (`search=` query param) across document corpus |
| **`analyses`** | `{ ownerId: 1, createdAt: -1 }` | Compound | User's analysis library listing |
| **`analyses`** | `{ documentId: 1, createdAt: -1 }` | Compound | Retrieve all analyses generated for a specific document |
| **`analyses`** | `{ documentId: 1, analysisType: 1 }` | Compound | Find specific analysis type per document |
| **`questions`** | `{ documentId: 1, userId: 1, createdAt: -1 }` | Compound | Retrieve document Q&A audit history per user |
| **`comparisons`**| `{ userId: 1, createdAt: -1 }` | Compound | Paginated list of cross-document comparisons by user |
| **`comparisons`**| `{ documentIds: 1 }` | Multikey | Find comparisons involving a specific document |
| **`history`** | `{ userId: 1, createdAt: -1 }` | Compound | User audit log timeline pagination |
| **`history`** | `{ createdAt: 1 }` | TTL (e.g. 90 days) | Optional: automatic log purge for compliance |

### 3.4 ID / ObjectId Mapping Guideline
- MongoDB uses `_id` (`ObjectId`).
- Person 3's interfaces and controllers use `id: string`.
- When writing Mongoose models or native MongoDB repositories, Person 4 should map `_id.toHexString()` to `id` when returning entities, or define a Mongoose transform:
```typescript
userSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});
```

---

## 4. Teammate Integration Checklist

### For Person 1 (Gemini / AI)
- [ ] Implement `IAIService` in `src/adapters/ai/GeminiAIService.ts` (or `src/services/`).
- [ ] Set `GEMINI_API_KEY` in `.env` (never commit keys to git).
- [ ] Ensure `analyzeDocument`, `answerQuestion`, `compareDocuments`, and `generateResearchOutput` return data conforming strictly to the Zod schemas in `src/interfaces/ai/IAIService.ts`.
- [ ] Ensure responses return within the 30-second `AI_TIMEOUT_MS` envelope.
- [ ] Map Gemini rate-limits to errors with `'overloaded'` to trigger HTTP 503 instead of 500.

### For Person 2 (React Frontend)
- [ ] Consult [`API_CONTRACT.md`](file:///d:/Antigravity%20backend%20p3/API_CONTRACT.md) for endpoint paths, payloads, and response envelopes.
- [ ] Ensure all API requests include `credentials: "include"` (or Axios `withCredentials: true`) to send and receive HTTP-only cookies.
- [ ] Ensure `Origin` header matches `FRONTEND_URL` (`http://localhost:5173`) to satisfy CSRF security checks.
- [ ] Check `response.data.error.code` for programmatic error handling (`TOKEN_EXPIRED`, `VALIDATION_ERROR`, `RATE_LIMITED`).
- [ ] Trigger `POST /api/v1/auth/refresh` when receiving `TOKEN_EXPIRED`.

### For Person 4 (MongoDB & Deployment)
- [ ] Create Mongoose schemas matching the 6 repository interfaces in `src/interfaces/repositories/`.
- [ ] Apply all compound, unique, and text indexes specified in Section 3.3.
- [ ] Replace in-memory repository instantiations in `src/server.ts` with Mongo repository instances.
- [ ] Set `MONGODB_URI` in `.env`.
- [ ] Verify database connection health check returns `"status": "up"` in `GET /ready`.
- [ ] Test graceful shutdown (`SIGTERM`, `SIGINT`) by closing Mongoose connection pool.
