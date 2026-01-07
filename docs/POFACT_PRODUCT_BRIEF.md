# POFact — Product Brief (Current Implementation)

## 1) What POFact is

POFact is a Next.js product that gives **fast, verifiable access** to Singapore-relevant public records and communications (parliamentary statements / Hansard-like transcripts, ministerial or agency releases, and selected news sources). It is built for legal/policy workflows where **provenance and citation** matter.

At a high level, users can:

- Search and browse a corpus of documents (with filters and “trending topics”).
- Open a document to review content, confidence/verification signals, and source links.
- Ask an “AI deep search” question via **POFMan** and receive an answer with citations.
- Build an “Evidence Bundle” (matter-centric) by selecting quotes from documents and exporting a print-ready PDF.
- View timelines in two ways:
  - A **legacy policy timeline view** (Flask-proxied, hardcoded timeline data).
  - A **per-document policy development timeline** generated from the database (and optionally AI-generated when data is sparse).

---

## 2) Who it’s for / typical user scenarios

**Primary users** (current UX implicitly supports these):

- Legal practitioners / paralegals compiling supporting materials.
- Policy analysts tracking how a topic evolves across parliamentary debates.
- Researchers who need quick “what was said, by whom, when, and where is the source”.

**Common tasks:**

1. **Find the relevant record**
   - Use Trending Search to find documents by keyword/topic/speaker/date.
2. **Verify and cite**
   - Open Document Viewer to confirm the wording and open the official source URL.
3. **Assemble evidence**
   - Highlight text → Add to Evidence Bundle → add note → export bundle as PDF.
4. **Deep question answering**
   - Ask POFMan for a synthesis; view citations; jump back to the underlying documents.

---

## 3) User-facing product: what’s new / what changed

This section highlights concrete UX changes and the “why it matters” from a user standpoint.

### 3.1 Trending Search (filters + trending topics)

**What the user sees**

- A “Trending Search” view with:
  - A search bar (Cmd/Ctrl+K focus shortcut supported in the shell layout).
  - Trending topics chips (pulled from `/api/topics` when available; otherwise a fixed fallback list).
  - Filters (P1.2):
    - Source type
    - Date range
    - Speaker category
    - Language
    - Topic filter (by topic id)

**What it enables**

- Users can browse or refine results without having to know exact keywords.
- Topic-driven exploration is supported even when keyword search is noisy.

**Implementation note (user impact)**

- Search prefers Supabase-backed `/api/documents` with filters.
- If Supabase isn’t populated or returns 0 results for keyword search, the UI can fall back to legacy Flask CSV search (`/api/search`) for broader coverage.

### 3.2 Document Viewer (provenance-friendly review + evidence extraction)

**What the user sees**

- A full document view with:
  - Title
  - Speaker/role (when available)
  - Date
  - Source name
  - Verified vs unverified indicator
  - Confidence badge
  - Source URL “View Source”
  - Share/copy affordances
  - Error report entry point

**Evidence workflow**

- The user can select text inside the document and add it to an evidence bundle:
  - Choose or create a “Matter”
  - Save the quote with a structured citation JSON payload
  - Attach optional user notes

**Why it’s valuable**

- This turns the product into a practitioner tool: the output is not just “search results”, but a cite-able bundle.

### 3.3 Evidence Bundles (matter-centric workspace + PDF export)

**What the user sees**

- A dedicated “Evidence Bundles” section in navigation.
- A list of matters (cases/projects) on the left.
- Evidence items (quotes) on the right with citation metadata.
- Export to PDF via a print-friendly HTML view (user uses browser “Save as PDF”).

**Why it’s valuable**

- Keeps legal research organized by matter.
- Captures quotes with attribution and date/source context.

### 3.4 POFMan (AI Deep Search with citations)

**What the user sees**

- A “POFMan” deep search UI:
  - Search prompt input
  - A “thinking” sequence to indicate progress
  - A structured response view when RAG is enabled:
    - Markdown-formatted answer
    - Confidence score
    - A list of source citations (each with a quote snippet and metadata)
    - “Unsupported claims” warning section when the system can’t support a claim from sources

**How it behaves**

- First attempts `/api/query` POST:
  - If `USE_RAG=true`, it uses the RAG pipeline (retrieval + LLM generation).
  - If RAG is disabled or errors, it falls back to Flask `/query` behavior.
- If RAG doesn’t return an answer-shaped response, POFMan falls back to:
  - `/api/documents?q=...` (Supabase search)
  - and only then `/api/search?q=...` (Flask CSV search)

**Why it’s valuable**

- Provides a “synthesis with receipts” flow: answer + citations + confidence.
- Keeps a tight boundary around sources (the prompting explicitly asks to answer using only sources).

### 3.5 Timelines (two distinct timeline experiences)

There are effectively **two timeline systems** in the current implementation:

1) **Legacy “Policy Timeline” view (Flask-proxied)**
- Triggered by navigating to the timeline view in the shell.
- Calls `/api/timeline` which proxies to Flask `/api/timeline`.
- Currently returns **hardcoded example timelines** (COVID-era policies).

2) **Per-document “Related Policy Development” timeline (DB + optional AI generation)**
- Lives inside Document Viewer as a tab/component.
- Calls `/api/documents/[id]/timeline`.
- Uses Supabase documents + topics to find related parliamentary documents.
- If there are too few relevant documents, it **asks the LLM to generate a plausible timeline** and labels the events as AI-generated.

**Why it’s valuable**

- Timeline provides narrative structure (creation → amendments → dissolution) rather than a flat search list.
- The per-document timeline is “corpus driven” when the database is populated.

---

## 4) Core product structure (what screens exist)

The main shell is a single-page app experience rendered by the `MinLaw2Platform` component.

**Primary navigation items exposed today:**

- Search
- POFMan
- Evidence Bundles

**Additional feature panes exist but may not be primary navigation items:**

- Contradiction detector (appears present as a view, but not in default navigation items)
- Admin dashboard (present, but not exposed in main navigation items)

---

## 5) Architecture overview (as built)

### 5.1 High-level architecture

POFact is a **Next.js 15 App Router** application with:

- Client-side UI (React) for interaction.
- Server-side API routes (Next.js Route Handlers) for:
  - Supabase reads/writes
  - RAG orchestration
  - Proxying to optional legacy Flask services

```mermaid
flowchart LR
  U[User Browser] -->|UI| FE[Next.js Client (React)]
  FE -->|fetch /api/*| API[Next.js API Routes]

  API -->|read| SB[(Supabase Postgres)]
  API -->|RAG retrieval| SB
  API -->|LLM call (optional)| LLM[Gemini Provider]

  API -->|proxy (optional)| FL[Flask CSV services]
  FL -->|reads| CSV[(Golden Dataset CSVs)]

  API -->|proxy (optional)| ENG[External Engine Service]
```

### 5.2 Why the “Next.js API layer” matters

This project intentionally routes user-facing API calls through Next.js instead of calling Flask directly from the browser.

User-facing benefits:

- Fewer CORS issues.
- Cleaner deployment story (Vercel-friendly).
- The product can switch between Supabase-first and legacy fallback without changing the UI.

Engineering benefits:

- A stable contract for frontend: `/api/documents`, `/api/query`, `/api/matters`, etc.
- Clear separation of concerns: UI vs data access vs retrieval/generation.

---

## 6) Frontend value-adds (what changed / what’s improved)

### 6.1 A single, coherent “platform shell”

- The main app (`MinLaw2Platform`) centralizes:
  - Navigation state
  - Theme state
  - Initial loading of sources/documents/topics
  - Core actions (view document, view timeline)

### 6.2 Feature-specific UIs with consistent primitives

- Search results and RAG responses display confidence and provenance cues.
- Evidence Bundles provide a practitioner-focused workspace.
- `RAGResponseView` supports Markdown rendering and citation cards.

### 6.3 UX resilience via fallbacks

- When Supabase isn’t populated or fails, the UI can fallback (in specific places) to legacy Flask-backed CSV search.

---

## 7) Backend/API value-adds

### 7.1 Next.js API routes as the primary backend

Key endpoints (current implementation):

- **Documents**
  - `GET /api/documents` (supports filters)
  - `GET /api/documents/[id]`
  - `GET /api/documents/[id]/timeline`

- **Topics / Sources**
  - `GET /api/topics`
  - `GET /api/sources`

- **Evidence Bundles**
  - `GET/POST /api/matters`
  - `GET/DELETE /api/matters/[id]`
  - `GET/POST /api/evidence-items?matter_id=...`
  - `PATCH/DELETE /api/evidence-items/[id]`

- **RAG / AI query**
  - `POST /api/query` (RAG-lite when `USE_RAG=true`)

- **Legacy proxies (optional)**
  - `GET /api/search` → Flask `/api/search`
  - `GET /api/timeline` → Flask `/api/timeline`
  - `POST /api/validation` → Flask `/validate`
  - `GET/POST /api/scrapers` → Flask `/articles`
  - `GET/POST /api/engine` → external engine service (if configured)

### 7.2 RAG-lite service and multi-provider abstraction

- A RAG pipeline exists even before full hierarchical RAG:
  - Retrieval: simple full-text matching over Supabase `documents`
  - Generation: Gemini provider (when API key exists)
  - Output: structured `QueryResponse` including citations, confidence, unsupported claims

Why this matters:

- It creates a stable contract for “answer + citations” even if the underlying retriever changes later.
- It prepares the codebase for provider expansion (Anthropic/OpenAI placeholders exist).

### 7.3 Feature flags to control behavior

- `USE_RAG=true|false` controls whether `/api/query` uses RAG.
- `USE_MOCK_DATA_FALLBACK=true|false` controls whether the unified DataService will fall back to mock data when Supabase fails.
- `FLASK_API_BASE` controls where legacy proxies route to.

---

## 8) Database value-adds

### 8.1 Supabase as single source of truth (Supabase-first)

- Core schema includes:
  - `sources`
  - `documents`
  - `topics`
- Frontend-friendly views are provided:
  - `documents_frontend`
  - `topics_frontend`
  - `sources_frontend`

This reduces frontend transformation logic and standardizes fields like:

- `published_at`
- `source_type`
- `verified`
- `confidence`
- `topics[]`
- `language`

### 8.2 Evidence Bundles schema (P1)

Adds two practitioner-oriented tables:

- `matters` (case/project)
- `evidence_items` (quotes + citation JSON + notes)

This is the core enabler for “legal workflow” functionality.

### 8.3 RAG foundations (P2 schema extension)

The database has extension points for advanced RAG:

- Hierarchical relationships (`document_hierarchy`, `documents.hierarchy_level`, `documents.parent_document_id`)
- Vector embeddings column (`documents.embedding vector(1536)`) for future vector search
- Audit trail and retrieval metrics tables:
  - `query_audit_trail`
  - `retrieval_metrics`
  - `source_compositions`

Important reality check:

- The schema supports these features, but the current codebase mainly uses **RAG-lite retrieval** and does not yet persist full audit trails.

---

## 9) Legacy Flask backend (what it does and why it still exists)

The Flask service is now **optional** and mainly supports:

- Legacy keyword search over local CSV “golden datasets” (`/api/search`).
- A hardcoded policy timeline dataset (`/api/timeline`).
- A stub validation endpoint (`/validate`).
- A stub query endpoint (`/query`) that uses the CSV search service.

Why keep it:

- It provides coverage when Supabase data is not yet ingested.
- It acts as a fallback during development.

Why the product is no longer “Flask-first”:

- The UI is designed to call Next.js API routes.
- The Next.js server layer can progressively replace Flask responsibilities.

---

## 10) What’s “done” vs “next” (intent vs current state)

### Implemented and usable today

- Supabase-first documents/topics/sources APIs.
- Search filters and trending topics.
- Evidence bundles with quote capture and PDF export.
- RAG-lite query endpoint (feature-flagged) with Gemini provider.
- Per-document timeline generation from Supabase, with AI-generated fallback when sparse.

### Implemented but primarily “foundation / stub”

- Full hierarchical RAG retriever (schema exists, code not implemented).
- Audit trail persistence (tables exist, UI “View Audit Trail” is present but not wired end-to-end).
- Multi-provider LLM router beyond Gemini (scaffolded for future).

---

## 11) Quick mental model for engineers (how to reason about the system)

- The **frontend** is a “platform shell” + feature panes.
- The **backend** is primarily **Next.js route handlers**.
- The **database** is the authoritative corpus when populated.
- Flask is a **compatibility/fallback** layer for a CSV-based corpus.
- RAG-lite is the current AI implementation; hierarchical RAG is the planned scaling strategy.

---

## 12) Appendix: Environment variables (operational knobs)

Required (for Supabase-backed operation):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server routes and writes)

Optional (for AI and fallbacks):

- `GOOGLE_GEN_AI_API_KEY` (enables Gemini provider)
- `USE_RAG=true` (turn on RAG in `/api/query`)
- `FLASK_API_BASE=http://localhost:5000` (legacy proxies)
- `FLASK_VALIDATION_URL=http://localhost:5000/validate` (validation proxy)
- `USE_MOCK_DATA_FALLBACK=true` (development convenience)
- `ENGINE_SERVICE_URL=http://localhost:6000/query` (optional external engine)
