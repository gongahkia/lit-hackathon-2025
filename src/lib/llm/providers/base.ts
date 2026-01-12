/**
 * Base LLM Provider Abstraction
 * P2: Multi-provider LLM support with structured output
 */

import { Citation } from "@/lib/types/query";

export interface LLMProviderConfig {
  provider: 'gemini' | 'anthropic' | 'openai' | 'mock';
  model: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  structuredOutput?: boolean;
}

export interface LLMResponse {
  content: string;
  citations: Citation[];
  confidence: number;
  unsupported_claims: string[];
  metadata: Record<string, any>;
}

export interface ValidationResult {
  supported: boolean;
  unsupported_claims: string[];
  confidence: number;
  validation_details: any[];
}

export interface Document {
  id: string;
  title: string;
  content: string;
  source_name?: string;
  source_url?: string;
  embedding?: number[];
  [key: string]: any;
}

/**
 * Abstract base class for LLM providers
 * All providers must implement generate(), stream(), and validate() methods
 */
export abstract class LLMProvider {
  protected config: LLMProviderConfig;
  
  constructor(config: LLMProviderConfig) {
    this.config = config;
  }
  
  /**
   * Generate a response with RAG context
   */
  abstract generate(
    prompt: string, 
    context: Document[], 
    options?: GenerateOptions
  ): Promise<LLMResponse>;
  
  /**
   * Stream a response (for real-time updates)
   */
  abstract stream(
    prompt: string, 
    context: Document[], 
    options?: GenerateOptions
  ): AsyncGenerator<string>;
  
  /**
   * Validate a response against sources
   */
  abstract validate(response: LLMResponse, sources: Document[]): Promise<ValidationResult>;
  
  /**
   * Build RAG prompt with context
   */
  protected buildRAGPrompt(query: string, context: Document[]): string {
    const contextText = context.map((doc, i) => {
      const source = doc.source_name || 'Unknown Source';
      const url = doc.source_url || '';
      return `[${i + 1}] ${doc.title}\nSource: ${source}${url ? ` (${url})` : ''}\nContent: ${doc.content}`;
    }).join('\n\n');
    
    return `You are a legal fact-checking assistant. Answer the question using ONLY the provided sources.

Sources:
${contextText}

Question: ${query}

Requirements:
1. Answer using ONLY information from the sources above
2. Cite sources using [1], [2], etc. in your answer
3. If information is not in sources, state "I cannot find this information in the provided sources"
4. Provide confidence score (0-1) based on source quality and completeness
5. List any claims you make that are not directly supported by the sources

Answer:`;
  }
  
  /**
   * Extract citations from response text
   */
  protected extractCitations(response: string, context: Document[]): Citation[] {
    const citations: Citation[] = [];
    const citationRegex = /\[(\d+)\]/g;
    const matches = response.matchAll(citationRegex);
    
    for (const match of matches) {
      const index = parseInt(match[1]) - 1;
      if (index >= 0 && index < context.length) {
        const doc = context[index];
        // Extract quote (simplified - could be improved with better parsing)
        const quote = this.extractQuote(response, index);
        
        citations.push({
          document_id: doc.id,
          document_title: doc.title,
          source_name: doc.source_name || 'Unknown',
          source_url: doc.source_url || '',
          quote: quote,
          relevance_score: 0.8, // Default, could be calculated
          hierarchy_level: (doc as any).hierarchy_level || 1
        });
      }
    }
    
    return citations;
  }
  
  /**
   * Extract quote from response (simplified implementation)
   */
  protected extractQuote(response: string, sourceIndex: number): string {
    // Find text around citation markers
    const citationMarker = `[${sourceIndex + 1}]`;
    const index = response.indexOf(citationMarker);
    if (index === -1) return '';
    
    // Extract surrounding text (50 chars before and after)
    const start = Math.max(0, index - 50);
    const end = Math.min(response.length, index + citationMarker.length + 50);
    return response.substring(start, end).trim();
  }
}

