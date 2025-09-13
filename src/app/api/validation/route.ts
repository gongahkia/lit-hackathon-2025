import { NextRequest, NextResponse } from 'next/server';

const FLASK_SERVER_URL = process.env.FLASK_VALIDATION_URL || 'http://localhost:5000/validate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const flaskRes = await fetch(FLASK_SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const contentType = flaskRes.headers.get('content-type') || '';
    const result = contentType.includes('application/json')
      ? await flaskRes.json()
      : await flaskRes.text();

    return NextResponse.json(result, { status: flaskRes.status });
  } catch (error: any) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Internal server error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Validation API endpoint: POST only.' });
}