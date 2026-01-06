import { NextRequest, NextResponse } from 'next/server';

const FLASK_API_BASE = process.env.FLASK_API_BASE || 'http://localhost:5000';

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
    const body = await request.json();
    
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

