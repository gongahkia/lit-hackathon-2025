# Developer Guide

This guide helps new developers understand the codebase structure and get started quickly.

## Project Overview

POFact is a Next.js application that provides fast, verifiable access to Singapore parliamentary statements, ministerial releases, and government communications. It features:

- **Trending Search**: Browse and search through verified documents with filters
- **AI Deep Search**: Semantic search using RAG (Retrieval-Augmented Generation)
- **Document Timeline**: View policy development timelines for documents
- **Evidence Bundles**: Organize evidence items for legal research

## Architecture

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: React hooks (useState, useEffect)

### Backend
- **Database**: Supabase (PostgreSQL) - already hosted
- **API**: Next.js API routes (serverless functions)
- **LLM**: Google Gemini (via @google/generative-ai)
- **Legacy**: Flask backend (optional, for fallback search)

### Key Directories

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API endpoints
│   │   ├── documents/     # Document search and retrieval
│   │   ├── query/         # RAG query endpoint
│   │   └── topics/        # Topics API
│   └── page.tsx           # Main page
├── components/
│   ├── features/          # Feature components
│   │   ├── SearchPane.jsx         # Trending search interface
│   │   ├── AIQueryPane.jsx        # AI deep search (POFMan)
│   │   ├── DocumentViewer.jsx     # Document detail view
│   │   ├── DocumentTimeline.tsx   # Policy timeline component
│   │   └── RAGResponseView.tsx    # RAG response display
│   └── ui/                # Reusable UI components
└── lib/
    ├── database.ts        # Supabase database service
    ├── formatters.ts     # Formatting utilities
    ├── rag/              # RAG services
    │   ├── rag-service.ts
    │   └── simple-retriever.ts
    └── llm/              # LLM providers
        ├── router.ts
        └── providers/

lib/                      # Shared libraries
├── timeline-service.ts   # Timeline generation
└── llm/                  # LLM router and providers
```

## Getting Started

### 1. Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (credentials provided)

### 2. Installation

```bash
# Clone repository
git clone https://github.com/gongahkia/lit-hackathon-2025.git
cd lit-hackathon-test

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### 3. Development

```bash
# Start development server
npm run dev

# Run type checking
npm run type-check

# Run linter
npm run lint
```

## Key Features Implementation

### Trending Search

**Location**: `src/components/features/SearchPane.jsx`

- Fetches documents from Supabase
- Supports filtering by source type, date, speaker, language, topics
- Displays trending topics from database
- Falls back to Flask API if Supabase has no results

### AI Deep Search (POFMan)

**Location**: `src/components/features/AIQueryPane.jsx`

- Uses RAG service for semantic search
- Generates AI-powered answers with citations
- Supports markdown formatting in responses
- Falls back to document search if RAG unavailable

**API**: `src/app/api/query/route.ts`

### Document Timeline

**Location**: `src/components/features/DocumentTimeline.tsx`

- Generates timeline from related documents
- Uses AI generation when database has insufficient data
- Groups events by topic
- Classifies events (creation/amendment/dissolution)

**Service**: `lib/timeline-service.ts`

### RAG Service

**Location**: `src/lib/rag/rag-service.ts`

- Retrieves relevant documents using SimpleRetriever
- Routes queries to LLM providers (Gemini)
- Generates answers with citations
- Calculates confidence scores

## Code Patterns

### Database Queries

Use `DatabaseService` from `lib/database.ts`:

```typescript
import { DatabaseService } from '@/lib/database'

const documents = await DatabaseService.searchDocumentsWithFilters({
  query: 'healthcare',
  sourceType: 'parliamentary',
  language: 'en'
})
```

### API Routes

Next.js API routes in `src/app/api/`:

```typescript
export async function GET(request: NextRequest) {
  try {
    // Your logic here
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
```

### Component Structure

```typescript
"use client"  // For client components

export default function MyComponent({ prop1, prop2 }) {
  const [state, setState] = useState(null)
  
  useEffect(() => {
    // Fetch data
  }, [])
  
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

Optional:
- `GOOGLE_GEN_AI_API_KEY` - For AI Query features
- `FLASK_API_BASE` - For legacy search fallback

## Common Tasks

### Adding a New Data Source

1. Add scraper in `scrapers/`
2. Generate CSV in `golden_dataset/`
3. Update `scripts/ingest-golden-dataset.ts` to include new source
4. Run `npm run ingest-data`

### Adding a New Filter

1. Update `DatabaseService.searchDocumentsWithFilters()` in `lib/database.ts`
2. Add filter UI in `SearchPane.jsx`
3. Update API route in `src/app/api/documents/route.ts`

### Adding a New LLM Provider

1. Create provider in `lib/llm/providers/`
2. Extend `LLMProvider` base class
3. Register in `LLMRouter.initializeProviders()`

## Testing

Currently, testing is manual:

1. Start dev server: `npm run dev`
2. Test features in browser
3. Check console for errors
4. Verify API responses in Network tab

## Troubleshooting

### Webpack Cache Errors

Clear Next.js cache:
```bash
npm run clean
rm -rf .next
npm run dev
```

### TypeScript Errors

Run type checking:
```bash
npm run type-check
```

### Database Connection Issues

1. Verify `.env.local` has correct credentials
2. Check Supabase project is active
3. Ensure service role key is used for server-side operations

## Contributing

1. Create feature branch from `main`
2. Make changes
3. Run `npm run type-check` and `npm run lint`
4. Test manually
5. Submit pull request

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Radix UI Components](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

