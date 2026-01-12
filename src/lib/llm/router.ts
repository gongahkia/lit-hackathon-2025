/**
 * LLM Router
 * P2: Multi-provider LLM routing with fallback and consensus
 */

import { LLMProvider, LLMProviderConfig, LLMResponse, GenerateOptions, Document } from './providers/base';
import { GeminiProvider } from './providers/gemini';
import { MockProvider } from './providers/mock';

export interface RouterOptions extends GenerateOptions {
  provider?: 'gemini' | 'anthropic' | 'openai' | 'mock' | 'auto';
  fallback?: boolean;
  consensus?: boolean;
  consensusProviders?: string[];
}

export interface ConsensusResponse {
  answer: string;
  citations: LLMResponse['citations'];
  confidence: number;
  provider_agreement: number;
  provider_responses: LLMResponse[];
}

export class LLMRouter {
  private providers: Map<string, LLMProvider>;
  private defaultProvider: string;
  
  constructor() {
    this.providers = new Map();
    this.defaultProvider = 'mock'; // Default to mock initially
    this.initializeProviders();
  }
  
  /**
   * Initialize providers from environment variables
   */
  private initializeProviders() {
    // Initialize Gemini if API key is available
    const geminiKey = process.env.GOOGLE_GEN_AI_API_KEY || process.env.GEMINI_API_KEY;
    const isDummyKey = geminiKey === 'dummy-key'; // Check for our explicit dummy key

    if (geminiKey && !isDummyKey) {
      const geminiProvider = new GeminiProvider({
        provider: 'gemini',
        model: 'gemini-3-flash-preview', 
        apiKey: geminiKey,
        temperature: 0.3,
        maxTokens: 2048
      });
      this.providers.set('gemini', geminiProvider);
      this.defaultProvider = 'gemini';
    } else {
        // Fallback or explicit Mock provider
        const mockProvider = new MockProvider({
            provider: 'mock',
            model: 'local-deterministic',
            apiKey: 'none'
        });
        this.providers.set('mock', mockProvider);
        this.defaultProvider = 'mock';
    }
  }
  
  /**
   * Route query to appropriate provider
   */
  async route(
    prompt: string,
    context: Document[],
    options?: RouterOptions
  ): Promise<LLMResponse> {
    const providerName = options?.provider || this.defaultProvider;
    
    // Handle 'auto' provider selection
    const selectedProvider = providerName === 'auto' 
      ? this.selectBestProvider(context)
      : providerName;
    
    const provider = this.providers.get(selectedProvider);
    
    if (!provider) {
      // Try fallback if available
      if (options?.fallback !== false) {
        return this.fallback(prompt, context, selectedProvider, options);
      }
      throw new Error(`Provider ${selectedProvider} not found or not configured`);
    }
    
    try {
      return await provider.generate(prompt, context, options);
    } catch (error: any) {
      console.error(`Provider ${selectedProvider} failed:`, error);
      
      // Fallback to another provider
      if (options?.fallback !== false) {
        return this.fallback(prompt, context, selectedProvider, options);
      }
      
      throw error;
    }
  }
  
  /**
   * Get consensus from multiple providers
   */
  async consensus(
    prompt: string,
    context: Document[],
    providers: string[] = ['gemini'] // Default to available providers
  ): Promise<ConsensusResponse> {
    const availableProviders = providers.filter(p => this.providers.has(p));
    
    if (availableProviders.length === 0) {
      throw new Error('No providers available for consensus');
    }
    
    // Get responses from all providers
    const responses = await Promise.all(
      availableProviders.map(async (providerName) => {
        const provider = this.providers.get(providerName);
        if (!provider) return null;
        try {
          return await provider.generate(prompt, context);
        } catch (error) {
          console.error(`Provider ${providerName} failed in consensus:`, error);
          return null;
        }
      })
    );
    
    const validResponses = responses.filter(r => r !== null) as LLMResponse[];
    
    if (validResponses.length === 0) {
      throw new Error('All providers failed in consensus');
    }
    
    return this.buildConsensus(validResponses);
  }
  
  /**
   * Fallback to next available provider
   */
  private async fallback(
    prompt: string,
    context: Document[],
    failedProvider: string,
    options?: RouterOptions
  ): Promise<LLMResponse> {
    const fallbackOrder = ['gemini', 'anthropic', 'openai', 'mock'];
    const failedIndex = fallbackOrder.indexOf(failedProvider);
    
    for (let i = failedIndex + 1; i < fallbackOrder.length; i++) {
      const providerName = fallbackOrder[i];
      const provider = this.providers.get(providerName);
      
      if (provider) {
        console.log(`Falling back to ${providerName}`);
        try {
          return await provider.generate(prompt, context, options);
        } catch (error) {
          console.error(`Fallback provider ${providerName} also failed:`, error);
          continue;
        }
      }
    }
    
    throw new Error('All providers failed');
  }
  
  /**
   * Select best provider based on context
   */
  private selectBestProvider(context: Document[]): string {
    // Simple heuristic: use default provider for now
    // Could be enhanced with cost, latency, context size considerations
    return this.defaultProvider;
  }
  
  /**
   * Build consensus from multiple responses
   */
  private buildConsensus(responses: LLMResponse[]): ConsensusResponse {
    if (responses.length === 1) {
      return {
        answer: responses[0].content,
        citations: responses[0].citations,
        confidence: responses[0].confidence,
        provider_agreement: 1.0,
        provider_responses: responses
      };
    }
    
    // Find common citations
    const citationMap = new Map<string, number>();
    responses.forEach(response => {
      response.citations.forEach(citation => {
        const key = citation.document_id;
        citationMap.set(key, (citationMap.get(key) || 0) + 1);
      });
    });
    
    // Citations that appear in multiple responses are more reliable
    const consensusCitations = Array.from(citationMap.entries())
      .filter(([_, count]) => count > 1)
      .map(([docId, _]) => {
        // Find the citation from the first response that has it
        return responses[0].citations.find(c => c.document_id === docId) || responses[0].citations[0];
      });
    
    // Average confidence
    const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;
    
    // Provider agreement (based on citation overlap)
    const agreement = consensusCitations.length / Math.max(responses[0].citations.length, 1);
    
    // Use the response with highest confidence
    const bestResponse = responses.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    
    return {
      answer: bestResponse.content,
      citations: consensusCitations.length > 0 ? consensusCitations : bestResponse.citations,
      confidence: avgConfidence * (0.5 + agreement * 0.5), // Boost confidence with agreement
      provider_agreement: agreement,
      provider_responses: responses
    };
  }
  
  /**
   * Get list of available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

