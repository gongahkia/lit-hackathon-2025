import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const storagePath = path.join(process.cwd(), 'data', 'storage.json');
    const mockSearchPath = path.join(process.cwd(), 'data', 'mock_search_results.json');
    let documents = [];
    if (query) {
      // Use mock_search_results.json for search
      const raw = fs.readFileSync(mockSearchPath, 'utf-8');
      const mock = JSON.parse(raw);
      documents = mock.results.filter((d: any) =>
        d.title.toLowerCase().includes(query.toLowerCase()) ||
        d.content.toLowerCase().includes(query.toLowerCase()) ||
        (d.speaker && d.speaker.toLowerCase().includes(query.toLowerCase()))
      );
    } else {
      // Return all documents from storage.json
      const raw = fs.readFileSync(storagePath, 'utf-8');
      const data = JSON.parse(raw);
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
