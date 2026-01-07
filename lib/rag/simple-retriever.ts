/**
 * Simple RAG Retriever (RAG-lite)
 * P2: Basic RAG implementation before full hierarchical RAG
 * Uses vector similarity search on documents table
 */

import { getSupabaseAdmin } from '../supabase';
import { Document } from '../llm/providers/base';

export interface RetrievalOptions {
  maxResults?: number;
  minSimilarity?: number;
  useVectorSearch?: boolean;
}

export interface RetrievalResult {
  documents: Document[];
  query: string;
  totalFound: number;
  executionTimeMs: number;
}

/**
 * Simple RAG Retriever
 * Retrieves documents using text search (full-text or vector search when embeddings are available)
 */
export class SimpleRetriever {
  /**
   * Retrieve documents for a query
   */
  async retrieve(query: string, options: RetrievalOptions = {}): Promise<RetrievalResult> {
    const startTime = Date.now();
    const maxResults = options.maxResults || 10;
    const minSimilarity = options.minSimilarity || 0.7;
    
    try {
      const supabase = getSupabaseAdmin();
      
      // For now, use full-text search since embeddings may not be populated yet
      // TODO: Add vector search when embeddings are available
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          content,
          source_id,
          published_at,
          source_type,
          speaker,
          role,
          url,
          topics,
          confidence,
          verified,
          sources!inner(name, url)
        `)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(maxResults);
      
      if (error) {
        console.error('Retrieval error:', error);
        throw error;
      }
      
      // Transform to Document format
      const documents: Document[] = (data || []).map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        source_name: doc.sources?.name,
        source_url: doc.sources?.url || doc.url,
        hierarchy_level: 1, // All documents at level 1 for simple retriever
        metadata: {
          published_at: doc.published_at,
          source_type: doc.source_type,
          speaker: doc.speaker,
          role: doc.role,
          topics: doc.topics || [],
          confidence: doc.confidence,
          verified: doc.verified
        }
      }));
      
      const executionTime = Date.now() - startTime;
      
      return {
        documents,
        query,
        totalFound: documents.length,
        executionTimeMs: executionTime
      };
    } catch (error: any) {
      console.error('Simple retriever error:', error);
      throw new Error(`Retrieval failed: ${error.message}`);
    }
  }
  
  /**
   * Retrieve documents by IDs
   */
  async retrieveByIds(documentIds: string[]): Promise<Document[]> {
    try {
      const supabase = getSupabaseAdmin();
      
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          content,
          source_id,
          published_at,
          source_type,
          speaker,
          role,
          url,
          topics,
          confidence,
          verified,
          sources!inner(name, url)
        `)
        .in('id', documentIds);
      
      if (error) {
        throw error;
      }
      
      return (data || []).map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        source_name: doc.sources?.name,
        source_url: doc.sources?.url || doc.url,
        hierarchy_level: 1,
        metadata: {
          published_at: doc.published_at,
          source_type: doc.source_type,
          speaker: doc.speaker,
          role: doc.role,
          topics: doc.topics || [],
          confidence: doc.confidence,
          verified: doc.verified
        }
      }));
    } catch (error: any) {
      console.error('Retrieve by IDs error:', error);
      throw new Error(`Retrieve by IDs failed: ${error.message}`);
    }
  }
}

