-- MinLaw 2 Database Schema
-- Run this in Supabase SQL Editor

-- Enable pgvector extension (for Phase 2)
CREATE EXTENSION IF NOT EXISTS vector;

-- Sources table (matches your INITIAL_SOURCES)
CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  last_updated TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table (matches your INITIAL_DOCUMENTS)
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source_id TEXT REFERENCES sources(id),
  content TEXT NOT NULL,
  speaker TEXT,
  date DATE,
  type TEXT NOT NULL,
  summary TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topics table (matches your INITIAL_TOPICS)
CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  document_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON sources FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON documents FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON topics FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_documents_source_id ON documents(source_id);
CREATE INDEX idx_documents_date ON documents(date);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_speaker ON documents(speaker);
CREATE INDEX idx_documents_created_at ON documents(created_at);

-- Create full-text search index for content
CREATE INDEX idx_documents_content_search ON documents USING gin(to_tsvector('english', content));
CREATE INDEX idx_documents_title_search ON documents USING gin(to_tsvector('english', title));

-- Prepare for Phase 2: Add vector column for embeddings
-- ALTER TABLE documents ADD COLUMN embedding vector(384);
-- CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops);

-- Insert initial data (optional - can be done via seed script)
-- This will be populated by the seed script instead
