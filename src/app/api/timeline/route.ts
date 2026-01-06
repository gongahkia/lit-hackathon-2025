import { NextRequest, NextResponse } from 'next/server';

const FLASK_API_BASE = process.env.FLASK_API_BASE || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    const flaskUrl = new URL('/api/timeline', FLASK_API_BASE);
    
    const flaskRes = await fetch(flaskUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!flaskRes.ok) {
      const errorText = await flaskRes.text();
      console.error('Flask timeline error:', errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `Flask API error: ${flaskRes.statusText}`,
          timeline: [] 
        },
        { status: flaskRes.status }
      );
    }

    const contentType = flaskRes.headers.get('content-type') || '';
    const result = contentType.includes('application/json')
      ? await flaskRes.json()
      : { timeline: [] };

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Internal server error';
    
    console.error('Timeline proxy error:', errorMessage);
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        timeline: [] 
      },
      { status: 500 }
    );
  }
}

