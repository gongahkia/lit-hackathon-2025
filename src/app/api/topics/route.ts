import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const storagePath = path.join(process.cwd(), 'data', 'storage.json');
    const raw = fs.readFileSync(storagePath, 'utf-8');
    const data = JSON.parse(raw);
    const topics = data.topics || [];
    return NextResponse.json({ success: true, data: topics });
  } catch (error: any) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}
