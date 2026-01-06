/**
 * Type definitions for RICHARD_PRD P2 hierarchical RAG and LLM query responses
 * These types align with the QueryResponse schema in docs/RICHARD_PRD.md
 */

/**
 * Citation structure for RAG responses
 * Matches the Citation interface from RICHARD_PRD.md
 */
export interface Citation {
  document_id: string
  document_title: string
  source_name: string
  source_url: string
  quote: string // Exact quote from document
  relevance_score: number
  hierarchy_level: number
}

/**
 * Provenance node in the source lineage graph
 */
export interface ProvenanceNode {
  id: string
  type: 'document' | 'claim' | 'validation' | 'composition'
  metadata: Record<string, any>
}

/**
 * Provenance edge connecting nodes
 */
export interface ProvenanceEdge {
  from: string
  to: string
  relationship: string
  confidence: number
}

/**
 * Provenance graph structure
 */
export interface ProvenanceGraph {
  nodes: ProvenanceNode[]
  edges: ProvenanceEdge[]
}

/**
 * Retrieval metrics for each hierarchy level
 */
export interface RetrievalMetrics {
  level_1: { precision: number; recall: number; f1: number }
  level_2: { precision: number; recall: number; f1: number }
  level_3: { precision: number; recall: number; f1: number }
  level_4: { precision: number; recall: number; f1: number }
}

/**
 * Query request options (P2)
 */
export interface QueryOptions {
  provider?: 'gemini' | 'anthropic' | 'openai' | 'auto'
  max_results?: number // Default: 10
  min_confidence?: number // Default: 0.7
  enable_cross_verification?: boolean // Default: true
  include_audit_trail?: boolean // Default: true
}

/**
 * Query request (P2)
 */
export interface QueryRequest {
  query: string
  options?: QueryOptions
}

/**
 * Query response from hierarchical RAG + LLM (P2)
 * Matches the QueryResponse interface from RICHARD_PRD.md
 */
export interface QueryResponse {
  success: boolean
  answer: string
  citations: Citation[]
  confidence: number
  unsupported_claims: string[]
  source_lineage: ProvenanceGraph
  audit_trail_id?: string
  retrieval_metrics?: RetrievalMetrics
  error?: string
}

