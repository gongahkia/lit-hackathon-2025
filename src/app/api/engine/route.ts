import { NextRequest, NextResponse } from 'next/server'
import { FileStorage } from '../../../lib/file-storage'

const ENGINE_SERVICE_URL = process.env.ENGINE_SERVICE_URL || '';
const isStandaloneMode = !ENGINE_SERVICE_URL;

// Generate mock engine response based on query
function generateMockEngineResponse(query: string, action?: string) {
  const documents = query ? FileStorage.searchDocuments(query) : FileStorage.getDocuments().slice(0, 10);

  return {
    success: true,
    standalone_mode: true,
    action: action || 'search',
    query: query,
    results: documents.slice(0, 10).map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      summary: doc.summary || '',
      date: doc.date || doc.published_at || '',
      source: doc.source_name || '',
      speaker: doc.speaker || '',
      relevance: 0.9
    })),
    metadata: {
      total_results: documents.length,
      processing_time_ms: 50,
      engine_version: 'standalone-mock-1.0'
    }
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || url.searchParams.get('query') || '';
  const action = url.searchParams.get('action') || 'search';

  // In standalone mode, return mock response
  if (isStandaloneMode) {
    const response = generateMockEngineResponse(query, action);
    return NextResponse.json(response, { status: 200 });
  }

  try {
    const params = url.search;
    const engineRes = await fetch(`${ENGINE_SERVICE_URL}${params ? params : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const contentType = engineRes.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await engineRes.json()
      : await engineRes.text();

    return NextResponse.json(data, { status: engineRes.status });
  } catch (error: any) {
    // Fallback to mock response
    const response = generateMockEngineResponse(query, action);
    return NextResponse.json(response, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = body.query || body.q || '';
    const action = body.action || 'process';

    // In standalone mode, return mock response
    if (isStandaloneMode) {
      const response = generateMockEngineResponse(query, action);
      return NextResponse.json(response, { status: 200 });
    }

    const engineRes = await fetch(ENGINE_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const contentType = engineRes.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await engineRes.json()
      : await engineRes.text();

    return NextResponse.json(data, { status: engineRes.status });
  } catch (error: any) {
    // Fallback to mock response
    const response = generateMockEngineResponse('', 'error');
    return NextResponse.json(response, { status: 200 });
  }
}