-- MinLaw 2 Database Schema - Complete
-- Run this in Supabase SQL Editor to set up the complete database

-- Enable pgvector extension (for Phase 2)
CREATE EXTENSION IF NOT EXISTS vector;

-- Sources table
CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  last_updated TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table with all frontend-required columns
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Frontend-required columns
  published_at TIMESTAMPTZ,
  source_type TEXT DEFAULT 'news',
  role TEXT,
  verified BOOLEAN DEFAULT false,
  confidence DECIMAL(3,2) DEFAULT 0.75,
  contradictions TEXT[] DEFAULT '{}',
  url TEXT,
  topics TEXT[] DEFAULT '{}'
);

-- Topics table
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

-- Create full-text search indexes
CREATE INDEX idx_documents_content_search ON documents USING gin(to_tsvector('english', content));
CREATE INDEX idx_documents_title_search ON documents USING gin(to_tsvector('english', title));

-- Create indexes for frontend-required columns
CREATE INDEX idx_documents_published_at ON documents(published_at);
CREATE INDEX idx_documents_source_type ON documents(source_type);
CREATE INDEX idx_documents_verified ON documents(verified);
CREATE INDEX idx_documents_confidence ON documents(confidence);
CREATE INDEX idx_documents_url ON documents(url);

-- Create GIN indexes for arrays
CREATE INDEX idx_documents_topics ON documents USING gin(topics);
CREATE INDEX idx_documents_contradictions ON documents USING gin(contradictions);

-- Create views for frontend compatibility
CREATE OR REPLACE VIEW documents_frontend AS
SELECT 
  d.id,
  d.title,
  d.source_id,
  d.content,
  d.speaker,
  d.date,
  d.type,
  d.summary,
  d.tags,
  d.created_at,
  -- Frontend-required fields
  COALESCE(d.published_at, d.date::timestamp, d.created_at) as published_at,
  d.source_type,
  d.role,
  d.verified,
  d.confidence,
  d.contradictions,
  d.url,
  d.topics,
  -- Source information
  s.name as source_name,
  s.url as source_url,
  s.type as source_category
FROM documents d
LEFT JOIN sources s ON d.source_id = s.id;

CREATE OR REPLACE VIEW topics_frontend AS
SELECT 
  t.id,
  t.name,
  t.description,
  t.document_count,
  t.last_updated,
  t.created_at,
  -- Additional fields for frontend
  COALESCE(t.document_count, 0) as documentCount,
  COALESCE(t.last_updated, t.created_at) as lastUpdated
FROM topics t;

CREATE OR REPLACE VIEW sources_frontend AS
SELECT 
  s.id,
  s.name,
  s.url,
  s.type,
  s.last_updated,
  s.status,
  s.created_at,
  -- Additional fields for frontend
  COALESCE(s.last_updated, s.created_at) as lastUpdated,
  -- Count documents per source
  (SELECT COUNT(*) FROM documents WHERE source_id = s.id) as document_count
FROM sources s;

-- Add column comments for documentation
COMMENT ON COLUMN documents.published_at IS 'Publication date in ISO format for frontend compatibility';
COMMENT ON COLUMN documents.source_type IS 'Type of source: parliamentary, ministerial, or news';
COMMENT ON COLUMN documents.role IS 'Role of the speaker (Minister, Prime Minister, etc.)';
COMMENT ON COLUMN documents.verified IS 'Whether the document has been verified';
COMMENT ON COLUMN documents.confidence IS 'Confidence score from 0.0 to 1.0';
COMMENT ON COLUMN documents.contradictions IS 'Array of document IDs that contradict this document';
COMMENT ON COLUMN documents.url IS 'Original URL of the document';
COMMENT ON COLUMN documents.topics IS 'Array of topic IDs this document belongs to';

-- Create function to update document counts in topics
CREATE OR REPLACE FUNCTION update_topic_document_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update document count for affected topics
  UPDATE topics 
  SET document_count = (
    SELECT COUNT(*) 
    FROM documents 
    WHERE topics && ARRAY[topics.id]
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update topic document counts
DROP TRIGGER IF EXISTS trigger_update_topic_document_count ON documents;
CREATE TRIGGER trigger_update_topic_document_count
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH STATEMENT
  EXECUTE FUNCTION update_topic_document_count();

-- Insert sample topics
INSERT INTO topics (id, name, description, document_count, last_updated) 
VALUES 
  ('topic-healthcare', 'Healthcare Policy', 'Healthcare and medical policy discussions', 0, NOW()),
  ('topic-economy', 'Economic Development', 'Economic growth and development initiatives', 0, NOW()),
  ('topic-education', 'Education Reform', 'Educational system improvements and reforms', 0, NOW()),
  ('topic-parliament', 'Parliamentary Affairs', 'Parliamentary proceedings and debates', 0, NOW()),
  ('topic-ministry', 'Ministerial Statements', 'Official ministerial communications', 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- Prepare for Phase 2: Add vector column for embeddings (commented out for now)
-- ALTER TABLE documents ADD COLUMN embedding vector(384);
-- CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops);