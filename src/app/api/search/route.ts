import { NextRequest, NextResponse } from 'next/server';
import { FileStorage } from '../../../lib/file-storage';

// Check if Flask backend is configured
const FLASK_API_BASE = process.env.FLASK_API_BASE || '';
const isStandaloneMode = !FLASK_API_BASE || FLASK_API_BASE === 'http://localhost:5000';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || searchParams.get('query') || '';

  // In standalone mode, always use local file storage
  if (isStandaloneMode) {
    try {
      let results;
      if (query) {
        results = FileStorage.searchDocuments(query);
      } else {
        results = FileStorage.getDocuments();
      }

      return NextResponse.json({
        success: true,
        results: results.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          summary: doc.summary || '',
          date: doc.date || doc.published_at || '',
          source: doc.source_name || doc.source || '',
          speaker: doc.speaker || '',
          url: doc.url || '',
          type: doc.type || '',
          source_type: doc.source_type || '',
          topics: doc.topics || [],
          tags: doc.tags || []
        }))
      }, { status: 200 });
    } catch (error: any) {
      console.error('Local search error:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Search failed',
        results: []
      }, { status: 500 });
    }
  }

  // If Flask backend is configured, try to use it
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

      // Fallback to local storage
      console.warn('Flask search failed, falling back to local storage');
      const results = query ? FileStorage.searchDocuments(query) : FileStorage.getDocuments();
      return NextResponse.json({ success: true, results }, { status: 200 });
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

    // Fallback to local storage on any error
    console.warn('Flask search exception, falling back to local storage');
    try {
      const results = query ? FileStorage.searchDocuments(query) : FileStorage.getDocuments();
      return NextResponse.json({ success: true, results }, { status: 200 });
    } catch (fallbackError) {
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
}

