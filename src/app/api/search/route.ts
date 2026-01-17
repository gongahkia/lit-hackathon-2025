import { NextRequest, NextResponse } from 'next/server';
import { FileStorage } from '../../../lib/file-storage';
import { getMockSearchResults } from '../../../lib/mock-search-loader';

const USE_MOCK_DATA_FALLBACK = process.env.USE_MOCK_DATA_FALLBACK === 'true';

const FLASK_API_BASE = process.env.FLASK_API_BASE || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || searchParams.get('query') || '';

  try {
    const flaskUrl = new URL('/api/search', FLASK_API_BASE);
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
      console.error('Flask search error:', errorText);

      if (USE_MOCK_DATA_FALLBACK) {
        console.warn('Flask search failed, falling back to mock_search_results.json');
        const mockResults = getMockSearchResults();
        return NextResponse.json(mockResults, { status: 200 });
      }

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
      : { results: [] };

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Internal server error';
    
    console.error('Search proxy error:', errorMessage);

    if (USE_MOCK_DATA_FALLBACK) {
      console.warn('Flask search exception, falling back to mock_search_results.json');
      const mockResults = getMockSearchResults();
      return NextResponse.json(mockResults, { status: 200 });
    }
    
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

