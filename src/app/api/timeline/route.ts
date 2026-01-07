import { NextRequest, NextResponse } from 'next/server';

const FLASK_API_BASE = process.env.FLASK_API_BASE || 'http://localhost:5000';

/**
 * Timeline API Route
 * Proxies to Flask backend timeline service
 * Returns policy timeline with creation, amendments, and dissolution events
 */
export async function GET(request: NextRequest) {
  try {
    const flaskUrl = new URL('/api/timeline', FLASK_API_BASE);
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const flaskRes = await fetch(flaskUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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

    // Ensure timeline is always an array
    const timeline = Array.isArray(result.timeline) 
      ? result.timeline 
      : (Array.isArray(result) ? result : []);

    return NextResponse.json(
      { 
        success: true,
        timeline 
      }, 
      { status: 200 }
    );
  } catch (error: any) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Internal server error';
    
    // Handle timeout errors
    if (error.name === 'AbortError') {
      console.error('Timeline request timeout');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Request timeout - timeline service unavailable',
          timeline: [] 
        },
        { status: 504 }
      );
    }
    
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

