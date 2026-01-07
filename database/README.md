# Database Setup Guide

## Quick Start

**Note:** Supabase is already hosted and configured. The database schema is set up and data is populated. You only need to add your credentials to `.env.local`.

### 1. Environment Variables

Create `.env.local` in the project root with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Get Supabase credentials:**
1. Go to your Supabase project dashboard
2. Settings → API
3. Copy the Project URL and anon/public key
4. Copy the service_role key (keep this secret!)

### 2. Database Schema

The database schema is already set up in the hosted Supabase instance. The schema includes:

- **sources**: Data sources (Parliament, Ministries, News)
- **documents**: Individual documents/statements
- **topics**: Policy topics and categories
- **matters**: Evidence bundle matters
- **evidence_items**: Evidence items linked to matters

If you need to view or modify the schema, see `database/schema.sql`.

### 3. Data Status

The database is already populated with:
- Parliamentary documents (Hansard)
- Ministerial releases
- News articles (CNA, Straits Times, Lianhe Zaobao)
- Topics and classifications

**No reseeding is required** - the data is already in place.

## Database Schema Overview

### Tables

- **sources**: Data sources (Parliament, Ministries, News)
- **documents**: Individual documents/statements with full-text search support
- **topics**: Policy topics and categories
- **matters**: Evidence bundle matters
- **evidence_items**: Evidence items linked to matters

### Key Features

- Full-text search with PostgreSQL `tsvector`
- Multilingual support (English, Chinese, Mixed)
- Confidence scoring and verification status
- Document hierarchies for RAG (future)
- Vector embeddings support (when populated)

## Troubleshooting

### Connection Issues

If you encounter connection errors:
1. Verify your `.env.local` file has correct credentials
2. Check that Supabase project is active
3. Ensure service role key is used (not anon key) for server-side operations

### RLS (Row Level Security)

Row Level Security is enabled but configured to allow public read access. All tables have policies that allow:
- SELECT operations for all users
- INSERT/UPDATE/DELETE for service role (server-side only)

If you need to modify RLS policies, see `database/schema.sql` for the policy definitions.

## Migration Notes

If you need to apply schema changes:

1. Go to Supabase SQL Editor
2. Copy the relevant SQL from `database/schema.sql`
3. Execute in the SQL Editor
4. Verify changes in the Table Editor

**Important:** Always backup before making schema changes in production.
