import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const storagePath = path.join(process.cwd(), 'data', 'storage.json');
    let documents = [];
    const raw = fs.readFileSync(storagePath, 'utf-8');
    const data = JSON.parse(raw);
    if (query) {
      documents = (data.documents || []).filter((d: any) =>
        d.title.toLowerCase().includes(query.toLowerCase()) ||
        d.content.toLowerCase().includes(query.toLowerCase()) ||
        (d.speaker && d.speaker.toLowerCase().includes(query.toLowerCase()))
      );
    } else {
      documents = data.documents || [];
    }
    return NextResponse.json({ success: true, data: documents });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
