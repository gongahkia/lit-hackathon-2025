# GABRIEL_PRD — POFact (POFMan) Practitioner-Grade Roadmap

**Version:** 1.0  
**Date:** 2026-01-03  
**Owner:** Gabriel (proposed)  
**Status:** Draft  

## 1. Executive Summary
POFact is a Next.js application intended to provide **fast, verifiable access** to Singapore parliamentary statements, ministerial releases, and related government communications with search, timeline views, and AI-assisted fact checking.

Today, the repo runs as:
- **Frontend:** Next.js (App Router) with feature panes for Search, AI semantic search (“POFMan”), Document viewing, Timeline, Contradiction detection, Admin dashboard.
- **Data layer (intended):** Supabase Postgres with views (`documents_frontend`, `sources_frontend`, `topics_frontend`) and ingestion scripts.
- **Data layer (actually used by UI):** a **Flask server** reading **CSV “golden datasets”** and serving `/api/search` and `/api/timeline`.

This PRD proposes improvements that are **useful for legal practitioners** (evidence-ready citations, auditability, matter-centric workflows) and are **implementable and runnable** within the current stack.

## 2. Current System (As-Is) — What Actually Runs

### 2.1 User Experience
- **Home page** renders `MinLaw2Platform`.
- Navigation currently exposes:
  - **Search** (keyword search)
  - **POFMan** (AIQueryPane semantic search UX)
- Additional feature panes exist but are not wired in navigation by default:
  - `DocumentViewer` (quote copying + share)
  - `TimelineView` (policy timeline, currently hardcoded on Flask side)
  - `ContradictionDetector` (currently mock, based on `document.contradictions`)
  - `AdminDashboard` (currently mock actions)

### 2.2 Data Flows

**A) Search / POFMan (currently):**
- UI calls `http://localhost:5000/api/search` directly from the browser.
- Flask `PolicySearchService` loads rows from CSV files in `golden_dataset/` and performs substring matching across date/names/policies/source/content.

**B) Timeline (currently):**
- UI calls `http://localhost:5000/api/timeline` directly from the browser.
- Flask returns a hardcoded timeline object (not derived from corpus).

**C) Supabase (partially implemented, not fully used by UI):**
- `database/schema.sql` defines tables + views.
- `lib/database.ts` reads from Supabase views.
- `src/app/api/{documents,sources,topics}` proxies to `DatabaseService`.
- **But** `lib/dataService.ts` currently hard-returns `src/lib/mockData.js` and doesn’t call Supabase.

### 2.3 Known Technical Gaps
These are actionable because they affect reliability and deployability:
1. **Hardcoded browser calls to `localhost:5000`** in multiple components.
2. **Supabase is present but bypassed**: `DataService` always uses mock data.
3. **Flask app references undefined handlers** (`validate_document`, `process_query`), so `/validate` and `/query` are likely broken.
4. **Data model mismatches**: UI expects fields like `confidence`, `publishedAt`, `sourceType`, `url`, `role` but mock docs don’t consistently include them.
5. Build quality is intentionally lax: `next.config.mjs` ignores TypeScript and ESLint build errors.

## 3. Target Users & Jobs-To-Be-Done

### 3.1 Personas
- **Litigation Associate**: needs quick, citable quotes and timelines for affidavits/memos.
- **Regulatory/Compliance Counsel**: needs defensible provenance and an audit trail (“how did we conclude this?”).
- **Policy/Research Analyst**: needs cross-source comparison and change tracking.

### 3.2 Top Practitioner Jobs
1. **Verify** a claim about what was said and when.
2. **Extract** quotable passages with clean citation metadata.
3. **Assemble** an evidence bundle (quote set + links + notes) for a matter.
4. **Track** policy changes over time (timeline) and identify contradictions.
5. **Explain** a conclusion with citations (LLM-assisted, but verifiable).

## 4. Product Goals (To-Be)

### 4.1 Goals
- **Evidence-first UX:** every output can be cited, exported, and traced back.
- **Matter-centric workflows:** users organize research by matter/folder.
- **Auditability:** log retrieval + transformation steps for defensibility.
- **Deployable architecture:** remove browser hard-deps on local Flask.

### 4.2 Non-Goals (for the first roadmap increment)
- Not building a full document management system (DMS) replacement.
- Not building a full eDiscovery pipeline.
- Not guaranteeing legal advice; system is for research/verification assistance.

## 5. Proposed Improvements (Implementable)

### 5.1 P0 — Make the Product Runnable and Consistent (1–3 days)

**P0.1 Unify API access (remove hardcoded localhost in browser)**
- Browser components must call Next.js routes only (e.g., `/api/documents`, `/api/scrapers`, `/api/engine`, `/api/validation`).
- Flask (if kept) becomes a server-side dependency behind Next.js proxy routes and configured via env vars.

**Acceptance Criteria**
- Running `npm run dev` works without changing code to remove `localhost:5000` references.
- Deployment to Vercel does not ship any `fetch('http://localhost:5000/...')` calls.

**P0.2 Fix the “single source of truth” for documents**
- Decide **one** default data mode:
  - **Mode A (recommended): Supabase-first** (seed/ingest scripts populate Supabase; UI reads from Supabase via Next API).
  - Mode B: CSV-first (Flask remains canonical; Supabase optional).
- Remove always-on mock data fallback in `DataService`, or make it conditional.

**Acceptance Criteria**
- UI documents list, search results, and document viewer all use the same schema.
- No `NaN` confidence or missing URLs in `DocumentViewer`.

**P0.3 Repair broken backend endpoints or remove them**
- Either implement `validate_document` and `process_query` in Flask or remove/disable routes that reference them.

**Acceptance Criteria**
- Hitting the validation endpoint returns a defined JSON response.
- No runtime NameError due to undefined handlers.

---

### 5.2 P1 — Practitioner Workflow: Evidence Bundles (3–7 days)

**Why this matters:** Legal work requires quotable, exportable evidence with minimal friction.

**Feature: Evidence Bundle (per matter)**
- In `DocumentViewer`, allow a user to:
  - highlight text and click **“Add to Evidence Bundle”**
  - auto-capture citation: title, speaker, role, date/publishedAt, source, URL, doc id, and selected quote
  - add optional user note
- Add a lightweight “Bundle” view (could be a pane or route) that:
  - lists saved quotes
  - supports ordering and grouping
  - exports to **DOCX or PDF** (MVP: Markdown + print-to-PDF)

**Data Model (Supabase tables)**
- `matters` (id, name, description, created_at)
- `evidence_items` (id, matter_id, document_id, quote_text, citation_json, user_note, created_at)

**Acceptance Criteria**
- User can create a matter.
- User can add 3 quotes from different documents.
- Export produces a single document containing quotes + citations.

---

### 5.3 P1 — Search Filters that Match Legal Research (3–7 days)

**Problem today:** Search UI shows filters, but they are effectively non-functional and backend search is coarse.

**Feature: Filterable, defensible search**
- Support filters:
  - source type (parliamentary/ministerial/news)
  - date range (from/to)
  - speaker/person
  - topic/policy tags
  - exact phrase vs contains
- Implementation path:
  - If Supabase-first: implement SQL filters + full-text search; expose via `/api/documents?q=...&sourceType=...`.
  - If CSV-first: enhance Flask search to accept filter params.

**Acceptance Criteria**
- Searching “GST” with `sourceType=parliamentary` yields only Hansard-type results.
- Date range filters narrow results deterministically.

---

### 5.4 P2 — Real Timeline from Corpus (1–2 weeks)

**Problem today:** Timeline is hardcoded and therefore not trustworthy.

**Feature: Corpus-driven timeline**
- Build timelines by topic/policy using real documents.
- Minimal approach (implementable quickly):
  - Use existing `policies` extracted from CSV ingestion (or compute on ingest) as timeline grouping keys.
  - Sort by date and show “creation/amendment/dissolution” as heuristics:
    - creation = first appearance
    - amendment = subsequent mentions with changed summary keywords
    - dissolution = explicit “repeal/cease/expire” language
- Better approach (later): LLM-assisted change detection with citations.

**Acceptance Criteria**
- For any policy tag, timeline renders events sourced from documents (each event has URL + document id).

---

### 5.5 P2 — Contradiction Detection with Review Workflow (1–2 weeks)

**Problem today:** ContradictionDetector is mock; no auditable logic.

**Feature: Reviewable contradiction candidates**
- MVP logic (no heavy ML required):
  - Candidate pairs = same topic/policy tag + different dates
  - Flag when numeric claims differ (regex for $/%, counts, thresholds) or key negation changes (“will” vs “will not”, “increase” vs “decrease”).
- Store candidates and allow reviewer to mark:
  - confirmed contradiction
  - benign difference
  - needs more sources

**Data Model**
- `contradiction_candidates` (id, primary_document_id, conflicting_document_id, reason, confidence, status, reviewer_note)

**Acceptance Criteria**
- Running a job produces a list of contradiction candidates.
- Reviewer can mark status and it persists.

---

### 5.6 P2 — AI Answers with Citations (RAG MVP) (1–2 weeks)

**Problem today:** “POFMan” UX simulates thinking but does not produce structured, citable answers; it currently just returns ranked rows.

**Feature: Answer mode (RAG-lite)**
- Input: natural-language question.
- Retrieval: use existing search (Supabase FTS or Flask search) to fetch top-N documents.
- Generation: call a single provider (OpenAI/Gemini) with a strict prompt:
  - must quote exact excerpts
  - must list sources used
  - must return JSON schema
- Output:
  - short answer + bullet claims
  - each claim must have citations (doc id + url + quoted excerpt)
  - “Unsupported” section if insufficient evidence

**Acceptance Criteria**
- For 10 test prompts, answer contains citations for every claim.
- If citations are missing, response explicitly says “insufficient support”.

---

## 6. Architecture Recommendation

### 6.1 Recommended Near-Term Architecture (Deployable)
- **Browser → Next.js API routes only**
- Next API routes access:
  - **Supabase** for documents/sources/topics/evidence bundles
  - Optional **Flask** only as a behind-the-scenes worker/legacy adapter (or remove it)

This eliminates CORS and `localhost` coupling and makes Vercel deployment viable.

### 6.2 Data Canonicalization
- Canonical schema should match `lib/database.ts` `Document` shape.
- Add runtime schema validation (e.g., Zod) at API boundaries.

## 7. Security & Compliance Notes (Practical)
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is used only server-side (Next API routes / scripts).
- Keep Row Level Security policies explicit if adding user accounts.
- Store audit trails for:
  - queries performed
  - docs retrieved
  - snippets quoted
  - exports generated

## 8. Milestones

### Milestone A (P0): “Runnable + Consistent”
- Remove hardcoded localhost calls from browser.
- Decide Supabase-first vs CSV-first.
- Fix broken Flask handler references.

### Milestone B (P1): “Evidence Bundles + Filtered Search”
- Matter + evidence item tables.
- Add-to-bundle from document viewer.
- Export bundle.
- Working filters.

### Milestone C (P2): “Real Timeline + Contradiction Review + RAG-lite”
- Corpus-driven timeline.
- Stored contradiction candidates with workflow.
- RAG-lite answer generation with citations.

## 9. Risks & Mitigations
- **Data quality / messy extraction:** start with simple heuristics; log extraction metadata; allow manual correction.
- **Scraper fragility:** throttle + caching; prefer official APIs where possible; add retries.
- **LLM hallucinations:** require citations; refuse unsupported claims; keep audit trail.
- **Deployment constraints (Flask on Vercel):** keep Flask optional and behind env-configured proxy or migrate endpoints into Next.

## 10. Appendix — Repo Observations (For Alignment)
- `src/components/features/SearchPane.jsx`, `AIQueryPane.jsx`, `TimelineView.jsx` call `http://localhost:5000/...` directly.
- `src/app/api/*` routes exist for documents/sources/topics/scrapers/engine/validation.
- `lib/dataService.ts` currently always returns mock data.
- Flask `backend/app.py` references `validate_document` and `process_query` but they are not defined in repo.
