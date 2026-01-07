import { NextRequest, NextResponse } from 'next/server';
import { RAGService } from '@/lib/rag/rag-service';
import { QueryRequest, QueryResponse } from '@/lib/types/query';

const FLASK_API_BASE = process.env.FLASK_API_BASE || 'http://localhost:5000';
const USE_RAG = process.env.USE_RAG === 'true' || process.env.USE_RAG === '1';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || searchParams.get('query') || '';
    
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
      const errorText = await flaskRes.text();
      console.error('Flask query error:', errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `Flask API error: ${flaskRes.statusText}`,
          results: [] 
        },
        { status: flaskRes.status }
      );
    }

    const contentType = flaskRes.headers.get('content-type') || '';
    const result = contentType.includes('application/json')
      ? await flaskRes.json()
      : { success: false, results: [] };

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Internal server error';
    
    console.error('Query proxy error:', errorMessage);
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        results: [] 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody: any = await request.json();
    const body: QueryRequest = rawBody as QueryRequest;
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
    
    // Use RAG service if enabled, otherwise fallback to Flask
    if (USE_RAG) {
      try {
        const ragService = new RAGService();
        const response = await ragService.processQuery(query, body.options || {});
        
        return NextResponse.json(response, { status: 200 });
      } catch (ragError: any) {
        console.error('RAG service error:', ragError);
        // Fallback to Flask if RAG fails
        console.log('Falling back to Flask API');
      }
    }
    
    // Fallback to Flask API
    const flaskUrl = new URL('/query', FLASK_API_BASE);
    
    const flaskRes = await fetch(flaskUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!flaskRes.ok) {
      const errorText = await flaskRes.text();
      console.error('Flask query error:', errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `Flask API error: ${flaskRes.statusText}`,
          answer: '',
          citations: [],
          confidence: 0,
          unsupported_claims: [],
          source_lineage: { nodes: [], edges: [] }
        } as QueryResponse,
        { status: flaskRes.status }
      );
    }

    const contentType = flaskRes.headers.get('content-type') || '';
    const result = contentType.includes('application/json')
      ? await flaskRes.json()
      : { success: false, results: [] };

    // Transform Flask response to QueryResponse format if needed
    if (result.results && !result.answer) {
      // Legacy format - transform to new format
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

