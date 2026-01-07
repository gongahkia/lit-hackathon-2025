-- P2: Hierarchical RAG Database Schema Extensions
-- Run this in Supabase SQL Editor after running schema.sql

-- Document Hierarchy Table
CREATE TABLE IF NOT EXISTS document_hierarchy (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  parent_document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
  child_document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
  hierarchy_level INTEGER NOT NULL CHECK (hierarchy_level BETWEEN 1 AND 4),
  relationship_type TEXT NOT NULL, -- 'encyclopedia', 'chapter', 'section', 'paragraph'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_document_id, child_document_id)
);

-- LLM Providers Configuration
CREATE TABLE IF NOT EXISTS llm_providers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider_name TEXT NOT NULL, -- 'gemini', 'anthropic', 'openai'
  model_name TEXT NOT NULL, -- 'gemini-3.0', 'claude-opus-4.5', 'gpt-5.2'
  api_key_encrypted TEXT, -- Encrypted API keys (store encrypted, decrypt at runtime)
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Lower = higher priority
  cost_per_1k_tokens DECIMAL(10,6),
  max_tokens INTEGER,
  rate_limit_per_minute INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Query Audit Trail
CREATE TABLE IF NOT EXISTS query_audit_trail (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  query_text TEXT NOT NULL,
  query_params JSONB,
  user_id TEXT,
  session_id TEXT,
  retrieval_path JSONB NOT NULL, -- Array of document IDs at each level
  llm_provider_used TEXT REFERENCES llm_providers(id),
  llm_response_raw TEXT,
  llm_response_structured JSONB,
  validation_results JSONB,
  source_composition_graph JSONB, -- Graph structure of source combinations
  confidence_scores JSONB, -- Confidence at each step
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retrieval Metrics
CREATE TABLE IF NOT EXISTS retrieval_metrics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  query_id TEXT REFERENCES query_audit_trail(id) ON DELETE CASCADE,
  hierarchy_level INTEGER NOT NULL CHECK (hierarchy_level BETWEEN 1 AND 4),
  total_candidates INTEGER,
  retrieved_count INTEGER,
  relevant_count INTEGER, -- Ground truth labels
  precision DECIMAL(5,4),
  recall DECIMAL(5,4),
  f1_score DECIMAL(5,4),
  avg_similarity_score DECIMAL(5,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Source Compositions
CREATE TABLE IF NOT EXISTS source_compositions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  query_id TEXT REFERENCES query_audit_trail(id) ON DELETE CASCADE,
  claim_id TEXT NOT NULL, -- Identifier for the claim being verified
  source_document_ids TEXT[] NOT NULL,
  composition_type TEXT NOT NULL, -- 'combined', 'verified', 'contradicted'
  confidence_score DECIMAL(3,2),
  verification_status TEXT, -- 'verified', 'contradicted', 'unverified'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add hierarchy columns to documents table
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS hierarchy_level INTEGER DEFAULT 1 CHECK (hierarchy_level BETWEEN 1 AND 4),
  ADD COLUMN IF NOT EXISTS parent_document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS compressed_summary TEXT,
  ADD COLUMN IF NOT EXISTS embedding vector(1536); -- Using OpenAI embedding dimension (1536)

-- Create indexes for hierarchical traversal
CREATE INDEX IF NOT EXISTS idx_documents_hierarchy_level ON documents(hierarchy_level);
CREATE INDEX IF NOT EXISTS idx_documents_parent_id ON documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_document_hierarchy_parent ON document_hierarchy(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_document_hierarchy_child ON document_hierarchy(child_document_id);
CREATE INDEX IF NOT EXISTS idx_document_hierarchy_level ON document_hierarchy(hierarchy_level);

-- Create indexes for vector search (ivfflat for approximate nearest neighbor)
-- Note: ivfflat requires at least some data, so we'll create it after data is loaded
-- CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create indexes for audit trail queries
CREATE INDEX IF NOT EXISTS idx_audit_trail_query_text ON query_audit_trail USING gin(to_tsvector('english', query_text));
CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON query_audit_trail(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_trail_provider ON query_audit_trail(llm_provider_used);
CREATE INDEX IF NOT EXISTS idx_retrieval_metrics_query_id ON retrieval_metrics(query_id);
CREATE INDEX IF NOT EXISTS idx_source_compositions_query_id ON source_compositions(query_id);

-- Enable RLS on new tables
ALTER TABLE document_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE retrieval_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_compositions ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for now, can be restricted later)
CREATE POLICY "Allow public read access" ON document_hierarchy FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON llm_providers FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read access" ON query_audit_trail FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON retrieval_metrics FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON source_compositions FOR SELECT USING (true);

-- Insert default LLM provider configurations (without API keys - these should be set via env vars)
INSERT INTO llm_providers (id, provider_name, model_name, is_active, priority, cost_per_1k_tokens, max_tokens, rate_limit_per_minute)
VALUES 
  ('llm-gemini-3', 'gemini', 'gemini-3.0', true, 1, 0.000125, 8192, 60),
  ('llm-opus-4.5', 'anthropic', 'claude-opus-4.5', true, 2, 0.015, 4096, 50),
  ('llm-gpt-5.2', 'openai', 'gpt-5.2', true, 3, 0.03, 4096, 60)
ON CONFLICT (id) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE document_hierarchy IS 'Tracks parent-child relationships for hierarchical RAG (Encyclopedia → Chapter → Section → Paragraph)';
COMMENT ON TABLE llm_providers IS 'Configuration for multi-provider LLM support';
COMMENT ON TABLE query_audit_trail IS 'Comprehensive audit log for all queries with provenance tracking';
COMMENT ON TABLE retrieval_metrics IS 'Precision/recall metrics for retrieval quality at each hierarchy level';
COMMENT ON TABLE source_compositions IS 'Tracks how multiple sources are combined/verified for claims';

