import { NextRequest, NextResponse } from 'next/server';
import { FileStorage } from '@/lib/file-storage';

// Check if we're in standalone mode
const FLASK_API_BASE = process.env.FLASK_API_BASE || '';
const isStandaloneMode = !FLASK_API_BASE || FLASK_API_BASE === 'http://localhost:5000';

interface QueryResponse {
  success: boolean;
  answer: string;
  citations: Array<{
    document_id: string;
    title: string;
    quote: string;
    relevance: number;
  }>;
  confidence: number;
  unsupported_claims: string[];
  source_lineage: { nodes: any[]; edges: any[] };
  error?: string;
}

// Generate a mock AI response based on search results
function generateMockResponse(query: string, documents: any[]): QueryResponse {
  if (documents.length === 0) {
    return {
      success: true,
      answer: `I couldn't find any documents matching your query "${query}". Please try different keywords or browse the available topics.`,
      citations: [],
      confidence: 0.5,
      unsupported_claims: [],
      source_lineage: { nodes: [], edges: [] }
    };
  }

  // Build a response based on the found documents
  const topDocs = documents.slice(0, 5);
  const summaries = topDocs.map(d => d.summary || d.title).filter(Boolean);

  let answer = `Based on the available parliamentary records and official documents, here is what I found regarding "${query}":\n\n`;

  topDocs.forEach((doc, idx) => {
    answer += `**${idx + 1}. ${doc.title}**\n`;
    if (doc.speaker) answer += `Speaker: ${doc.speaker}`;
    if (doc.role) answer += ` (${doc.role})`;
    if (doc.date) answer += ` | Date: ${doc.date}`;
    answer += '\n';
    if (doc.summary) answer += `${doc.summary}\n`;
    answer += '\n';
  });

  answer += `\n*Note: This response is generated from ${documents.length} relevant documents in the database. For the most accurate information, please review the original sources.*`;

  const citations = topDocs.map((doc, idx) => ({
    document_id: doc.id,
    title: doc.title,
    quote: doc.summary || doc.content?.substring(0, 200) || doc.title,
    relevance: 1 - (idx * 0.1)
  }));

  return {
    success: true,
    answer,
    citations,
    confidence: 0.85,
    unsupported_claims: [],
    source_lineage: {
      nodes: topDocs.map(doc => ({
        id: doc.id,
        type: 'document',
        title: doc.title
      })),
      edges: []
    }
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || searchParams.get('query') || '';

  // In standalone mode, return mock response
  if (isStandaloneMode) {
    const documents = query ? FileStorage.searchDocuments(query) : FileStorage.getDocuments().slice(0, 10);
    const response = generateMockResponse(query, documents);
    return NextResponse.json(response, { status: 200 });
  }

  try {
    const flaskUrl = new URL('/query', FLASK_API_BASE);
    if (query) {
      flaskUrl.searchParams.append('q', query);
    }

    const flaskRes = await fetch(flaskUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!flaskRes.ok) {
      // Fallback to mock response
      const documents = query ? FileStorage.searchDocuments(query) : FileStorage.getDocuments().slice(0, 10);
      const response = generateMockResponse(query, documents);
      return NextResponse.json(response, { status: 200 });
    }

    const contentType = flaskRes.headers.get('content-type') || '';
    const result = contentType.includes('application/json')
      ? await flaskRes.json()
      : { success: false, results: [] };

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Query proxy error:', error);
    // Fallback to mock response on error
    const documents = query ? FileStorage.searchDocuments(query) : FileStorage.getDocuments().slice(0, 10);
    const response = generateMockResponse(query, documents);
    return NextResponse.json(response, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody: any = await request.json();
    const query = rawBody?.query || rawBody?.q || '';

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query parameter is required',
          answer: '',
          citations: [],
          confidence: 0,
          unsupported_claims: [],
          source_lineage: { nodes: [], edges: [] }
        } as QueryResponse,
        { status: 400 }
      );
    }

    // In standalone mode, return mock response
    if (isStandaloneMode) {
      const documents = FileStorage.searchDocuments(query);
      const response = generateMockResponse(query, documents);
      return NextResponse.json(response, { status: 200 });
    }

    // Try Flask API if configured
    try {
      const flaskUrl = new URL('/query', FLASK_API_BASE);

      const flaskRes = await fetch(flaskUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rawBody),
      });

      if (!flaskRes.ok) {
        // Fallback to mock response
        const documents = FileStorage.searchDocuments(query);
        const response = generateMockResponse(query, documents);
        return NextResponse.json(response, { status: 200 });
      }

      const contentType = flaskRes.headers.get('content-type') || '';
      const result = contentType.includes('application/json')
        ? await flaskRes.json()
        : { success: false, results: [] };

      // Transform Flask response to QueryResponse format if needed
      if (result.results && !result.answer) {
        return NextResponse.json({
          success: result.success || false,
          answer: result.results.length > 0
            ? `Found ${result.results.length} relevant documents.`
            : 'No results found.',
          citations: [],
          confidence: 0.7,
          unsupported_claims: [],
          source_lineage: { nodes: [], edges: [] },
          error: result.error
        } as QueryResponse, { status: 200 });
      }

      return NextResponse.json(result, { status: 200 });
    } catch (flaskError: any) {
      console.error('Flask query error:', flaskError);
      // Fallback to mock response
      const documents = FileStorage.searchDocuments(query);
      const response = generateMockResponse(query, documents);
      return NextResponse.json(response, { status: 200 });
    }
  } catch (error: any) {
    const errorMessage = error instanceof Error
      ? error.message
      : 'Internal server error';

    console.error('Query proxy error:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        answer: '',
        citations: [],
        confidence: 0,
        unsupported_claims: [],
        source_lineage: { nodes: [], edges: [] }
      } as QueryResponse,
      { status: 500 }
    );
  }
}

