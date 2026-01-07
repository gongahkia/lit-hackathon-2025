/**
 * Gemini Provider Implementation
 * P2: Google Gemini 3.0 integration with structured output
 */

import { LLMProvider, LLMProviderConfig, LLMResponse, GenerateOptions, Document, ValidationResult } from './base';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiProvider extends LLMProvider {
  private genAI: GoogleGenerativeAI;
  
  constructor(config: LLMProviderConfig) {
    super(config);
    this.genAI = new GoogleGenerativeAI(config.apiKey);
  }
  
  async generate(
    prompt: string,
    context: Document[],
    options?: GenerateOptions
  ): Promise<LLMResponse> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.config.model || 'gemini-pro',
        generationConfig: {
          temperature: options?.temperature ?? this.config.temperature ?? 0.3,
          maxOutputTokens: options?.maxTokens ?? this.config.maxTokens ?? 2048,
        }
      });
      
      // Build RAG prompt with context
      const ragPrompt = this.buildRAGPrompt(prompt, context);
      
      // Generate response
      const result = await model.generateContent(ragPrompt);
      const responseText = result.response.text();
      
      // Extract citations
      const citations = this.extractCitations(responseText, context);
      
      // Extract unsupported claims (simplified - look for "cannot find" patterns)
      const unsupportedClaims = this.extractUnsupportedClaims(responseText);
      
      // Calculate confidence (simplified - based on citation count and response length)
      const confidence = this.calculateConfidence(responseText, citations, context);
      
      return {
        content: responseText,
        citations,
        confidence,
        unsupported_claims: unsupportedClaims,
        metadata: {
          provider: 'gemini',
          model: this.config.model,
          token_count: responseText.length / 4 // Rough estimate
        }
      };
    } catch (error: any) {
      console.error('Gemini generation error:', error);
      throw new Error(`Gemini generation failed: ${error.message}`);
    }
  }
  
  async *stream(
    prompt: string,
    context: Document[],
    options?: GenerateOptions
  ): AsyncGenerator<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.config.model || 'gemini-pro',
        generationConfig: {
          temperature: options?.temperature ?? this.config.temperature ?? 0.3,
          maxOutputTokens: options?.maxTokens ?? this.config.maxTokens ?? 2048,
        }
      });
      
      const ragPrompt = this.buildRAGPrompt(prompt, context);
      const result = await model.generateContentStream(ragPrompt);
      
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield text;
        }
      }
    } catch (error: any) {
      console.error('Gemini streaming error:', error);
      throw new Error(`Gemini streaming failed: ${error.message}`);
    }
  }
  
  async validate(response: LLMResponse, sources: Document[]): Promise<ValidationResult> {
    // Simplified validation - check if citations match sources
    const supported = response.citations.length > 0 && response.unsupported_claims.length === 0;
    
    return {
      supported,
      unsupported_claims: response.unsupported_claims,
      confidence: response.confidence,
      validation_details: response.citations.map(c => ({
        citation: c,
        source_found: sources.some(s => s.id === c.document_id)
      }))
    };
  }
  
  private extractUnsupportedClaims(response: string): string[] {
    const claims: string[] = [];
    const cannotFindPattern = /cannot find.*?in the provided sources/i;
    if (cannotFindPattern.test(response)) {
      // Extract the claim that couldn't be found
      const match = response.match(/cannot find.*?in the provided sources/i);
      if (match) {
        claims.push(match[0]);
      }
    }
    return claims;
  }
  
  private calculateConfidence(
    response: string,
    citations: LLMResponse['citations'],
    context: Document[]
  ): number {
    // Simple confidence calculation
    // Higher confidence if:
    // - More citations
    // - Citations match available sources
    // - Response is substantial
    
    if (citations.length === 0) return 0.3;
    if (response.length < 50) return 0.4;
    
    const citationRatio = citations.length / Math.min(context.length, 5);
    const baseConfidence = Math.min(0.9, 0.5 + citationRatio * 0.4);
    
    return Math.round(baseConfidence * 100) / 100;
  }
}

