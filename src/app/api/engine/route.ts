import { NextRequest, NextResponse } from 'next/server'

const ENGINE_SERVICE_URL = process.env.ENGINE_SERVICE_URL;

export async function GET(request: NextRequest) {
  if (!ENGINE_SERVICE_URL) {
    return NextResponse.json(
      { error: 'Engine service not configured' },
      { status: 503 }
    );
  }
  try {
    // Forward any query params to the backend engine via GET
    const url = new URL(request.url);
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!ENGINE_SERVICE_URL) {
    return NextResponse.json(
      { error: 'Engine service not configured' },
      { status: 503 }
    );
  }
  try {
    const body = await request.json();
    // Send POST body to external engine service
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}