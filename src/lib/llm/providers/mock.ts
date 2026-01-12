import { LLMProvider, LLMProviderConfig, LLMResponse, GenerateOptions, Document } from './base';

export class MockProvider extends LLMProvider {
  constructor(config: LLMProviderConfig) {
    super(config);
  }

  async generate(
    prompt: string,
    context: Document[],
    options?: GenerateOptions
  ): Promise<LLMResponse> {
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simple keyword extraction for "reasoning"
    const terms = prompt.toLowerCase().split(' ').filter(w => w.length > 4);
    
    let content = "";
    if (context.length === 0) {
      content = "I could not find any specific documents matching your query in the available dataset. Please try refining your search terms.";
    } else {
      content = `Based on the ${context.length} documents found, here is a summary:\n\n`;
      
      // Synthesize a "summary" from the first few context snippets
      const topDocs = context.slice(0, 3);
      topDocs.forEach((doc, idx) => {
        content += `**Point ${idx + 1}:** ${doc.content.substring(0, 150)}...\n`;
      });
      
      content += `\n**Conclusion:** The documents primarily discuss ${terms.join(', ')} and related policies.`;
    }

    // Generate pseudo-citations based on context
    const citations = context.slice(0, 3).map(doc => ({
      document_id: doc.id,
      document_title: doc.title || "Untitled Document",
      source_name: doc.source_name || "Unknown Source",
      source_url: doc.source_url || "",
      quote: doc.content.substring(0, 50) + "...",
      relevance_score: 0.9,
      hierarchy_level: 1,
      text_snippet: doc.content.substring(0, 50) // keep for backward compat if needed, but Citation type usually prefers 'quote'
    }));

    return {
      content,
      citations,
      confidence: 0.85,
      unsupported_claims: [],
      metadata: {
        provider: 'mock',
        model: 'mock-local',
        token_count: content.length / 4
      }
    };
  }

  async *stream(
    prompt: string,
    context: Document[],
    options?: GenerateOptions
  ): AsyncGenerator<string> {
    const response = await this.generate(prompt, context, options);
    const chunks = response.content.split(' ');
    
    for (const chunk of chunks) {
      await new Promise(resolve => setTimeout(resolve, 20)); // Stream simulation
      yield chunk + " ";
    }
  }

  async validate(response: LLMResponse, sources: Document[]): Promise<any> {
    return {
      supported: true,
      unsupported_claims: [],
      confidence: response.confidence,
      validation_details: []
    };
  }
}
