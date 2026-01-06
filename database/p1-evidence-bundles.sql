-- P1.1: Evidence Bundles Schema
-- Run this in Supabase SQL Editor after running the main schema.sql

-- Matters table - represents legal matters/cases
CREATE TABLE IF NOT EXISTS matters (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evidence items table - stores quotes and citations for each matter
CREATE TABLE IF NOT EXISTS evidence_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  matter_id TEXT NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  quote_text TEXT NOT NULL,
  citation_json JSONB NOT NULL, -- Stores: title, speaker, role, date, publishedAt, source, URL, doc id
  user_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ordering field for manual sorting
  display_order INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_evidence_items_matter_id ON evidence_items(matter_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_document_id ON evidence_items(document_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_created_at ON evidence_items(created_at DESC);

-- Update trigger for matters updated_at
CREATE OR REPLACE FUNCTION update_matters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_matters_updated_at
  BEFORE UPDATE ON matters
  FOR EACH ROW
  EXECUTE FUNCTION update_matters_updated_at();

-- Update trigger for evidence_items updated_at
CREATE OR REPLACE FUNCTION update_evidence_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_evidence_items_updated_at
  BEFORE UPDATE ON evidence_items
  FOR EACH ROW
  EXECUTE FUNCTION update_evidence_items_updated_at();

-- RLS Policies (if RLS is enabled)
-- Allow authenticated users to read/write their own matters and evidence items
-- For now, we'll use service role key, but these policies are for future auth
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (will be restricted when auth is added)
CREATE POLICY "Allow all operations on matters" ON matters
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on evidence_items" ON evidence_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

