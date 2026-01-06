import { NextRequest, NextResponse } from 'next/server';

const FLASK_API_BASE = process.env.FLASK_API_BASE || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || searchParams.get('query') || '';
    
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

