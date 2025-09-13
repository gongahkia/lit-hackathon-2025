import { NextRequest, NextResponse } from 'next/server'

const FLASK_API_BASE = process.env.FLASK_API_BASE || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const queryParams = url.search ? url.search : '';
    // Proxy directly to Flask's /articles endpoint (with ?query=...&source=...)
    const res = await fetch(`${FLASK_API_BASE}/articles${queryParams}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const articlesPayload = await res.json();
    return NextResponse.json(articlesPayload, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Optionally: allow POST to do advanced filters in future
    const body = await request.json();
    const res = await fetch(`${FLASK_API_BASE}/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    return NextResponse.json(result, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}