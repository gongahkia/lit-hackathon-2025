# Database Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install @supabase/supabase-js
```

### 2. Set up Environment Variables
Create `.env.local` with your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Create Database Schema
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Run the SQL script

### 4. Seed Database
```bash
npm run seed-db
```

### 5. Test Connection
```bash
npm run test-db
```

## Database Schema

### Tables
- **sources**: Data sources (Parliament, Ministries, News)
- **documents**: Individual documents/statements
- **topics**: Policy topics for categorization

### Features
- Row Level Security (RLS) enabled
- Full-text search indexes
- Prepared for Phase 2 vector search
- Fallback to mock data if database unavailable

## API Endpoints

- `GET /api/test-db` - Test database connection
- Database service functions in `lib/database.ts`
- Data service with fallback in `lib/dataService.ts`

## Next Steps

1. Test the database connection
2. Update frontend components to use `DataService`
3. Prepare for scraper team integration
4. Add vector search for Phase 2
