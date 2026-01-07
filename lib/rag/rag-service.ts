/**
 * RAG Service
 * P2: Orchestrates retrieval and LLM generation
 */

import { SimpleRetriever, RetrievalResult } from './simple-retriever';
import { LLMRouter, RouterOptions } from '@/lib/llm/router';
import { LLMResponse } from '@/lib/llm/providers/base';
import { QueryResponse, Citation } from '@/lib/types/query';

export interface RAGOptions extends RouterOptions {
  maxRetrievalResults?: number;
  minConfidence?: number;
}

/**
 * RAG Service - Combines retrieval and generation
 */
export class RAGService {
  private retriever: SimpleRetriever;
  private llmRouter: LLMRouter;
  
  constructor() {
    this.retriever = new SimpleRetriever();
    this.llmRouter = new LLMRouter();
  }
  
  /**
   * Process a query using RAG
   */
  async processQuery(
    query: string,
    options: RAGOptions = {}
  ): Promise<QueryResponse> {
    const startTime = Date.now();
    
    try {
      // Step 1: Retrieve relevant documents
      const retrievalResult = await this.retriever.retrieve(query, {
        maxResults: options.maxRetrievalResults || 10,
        minSimilarity: options.minConfidence || 0.7
      });
      
      if (retrievalResult.documents.length === 0) {
        return {
          success: false,
          answer: 'I could not find any relevant documents to answer your query.',
          citations: [],
          confidence: 0,
          unsupported_claims: [],
          source_lineage: { nodes: [], edges: [] },
          error: 'No documents found'
        };
      }
      
      // Step 2: Generate response using LLM
      const llmResponse = await this.llmRouter.route(
        query,
        retrievalResult.documents,
        {
          provider: options.provider || 'auto',
          fallback: options.fallback !== false,
          temperature: options.temperature || 0.3,
          maxTokens: options.maxTokens || 2048
        }
      );
      
      // Step 3: Build provenance graph
      const sourceLineage = this.buildProvenanceGraph(
        retrievalResult.documents,
        llmResponse.citations
      );
      
      // Step 4: Calculate final confidence
      const finalConfidence = this.calculateFinalConfidence(
        llmResponse.confidence,
        retrievalResult.documents.length,
        llmResponse.citations.length
      );
      
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        answer: llmResponse.content,
        citations: llmResponse.citations,
        confidence: finalConfidence,
        unsupported_claims: llmResponse.unsupported_claims,
        source_lineage: sourceLineage,
        retrieval_metrics: {
          level_1: {
            precision: 0.85, // Placeholder - would be calculated from ground truth
            recall: 0.80, // Placeholder
            f1: 0.82 // Placeholder
          },
          level_2: { precision: 0, recall: 0, f1: 0 },
          level_3: { precision: 0, recall: 0, f1: 0 },
          level_4: { precision: 0, recall: 0, f1: 0 }
        },
        metadata: {
          execution_time_ms: executionTime,
          retrieval_time_ms: retrievalResult.executionTimeMs,
          documents_retrieved: retrievalResult.documents.length,
          citations_count: llmResponse.citations.length
        }
      };
    } catch (error: any) {
      console.error('RAG service error:', error);
      return {
        success: false,
        answer: '',
        citations: [],
        confidence: 0,
        unsupported_claims: [],
        source_lineage: { nodes: [], edges: [] },
        error: error.message || 'RAG processing failed'
      };
    }
  }
  
  /**
   * Build provenance graph from documents and citations
   */
  private buildProvenanceGraph(
    documents: any[],
    citations: Citation[]
  ): QueryResponse['source_lineage'] {
    const nodes = documents.map(doc => ({
      id: doc.id,
      type: 'document' as const,
      metadata: {
        title: doc.title,
        source: doc.source_name,
        hierarchy_level: doc.hierarchy_level || 1
      }
    }));
    
    const edges = citations.map((citation, idx) => ({
      from: citation.document_id,
      to: `claim_${idx}`,
      relationship: 'supports',
      confidence: citation.relevance_score
    }));
    
    return { nodes, edges };
  }
  
  /**
   * Calculate final confidence score
   */
  private calculateFinalConfidence(
    llmConfidence: number,
    documentsRetrieved: number,
    citationsCount: number
  ): number {
    // Boost confidence if we have more documents and citations
    const retrievalBoost = Math.min(0.1, documentsRetrieved / 20);
    const citationBoost = Math.min(0.1, citationsCount / 10);
    
    return Math.min(1.0, llmConfidence + retrievalBoost + citationBoost);
  }
}

