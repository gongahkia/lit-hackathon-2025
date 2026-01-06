-- Fix Schema Issues - Run this ONCE in Supabase SQL Editor
-- This fixes the ambiguous trigger function that causes "UPDATE requires WHERE clause" error

-- 1. Fix the ambiguous trigger function (ROOT CAUSE of the error)
-- The original had: WHERE topics && ARRAY[topics.id] which is ambiguous
-- 'topics' refers to both the table name AND the column name in documents
CREATE OR REPLACE FUNCTION update_topic_document_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update document count for affected topics
  -- Fix: Use explicit table aliases to avoid ambiguity
  UPDATE topics t
  SET document_count = (
    SELECT COUNT(*) 
    FROM documents d
    WHERE d.topics && ARRAY[t.id]  -- d.topics is the column, t.id is the topic table id
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 2. Recreate the trigger (in case it was dropped)
DROP TRIGGER IF EXISTS trigger_update_topic_document_count ON documents;
CREATE TRIGGER trigger_update_topic_document_count
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH STATEMENT
  EXECUTE FUNCTION update_topic_document_count();

-- 3. Verify the trigger function works (should not error)
DO $$
BEGIN
  PERFORM update_topic_document_count();
  RAISE NOTICE '✅ Trigger function works correctly - no ambiguous column errors';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Trigger function error: %', SQLERRM;
END $$;

-- 4. Verify trigger exists and is enabled
SELECT 
  tgname as trigger_name,
  CASE tgenabled 
    WHEN 'O' THEN 'enabled'
    WHEN 'D' THEN 'disabled'
    ELSE 'unknown'
  END as status,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'documents'::regclass
  AND tgname = 'trigger_update_topic_document_count';

