import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const storagePath = path.join(process.cwd(), 'data', 'storage.json');
    const raw = fs.readFileSync(storagePath, 'utf-8');
    const data = JSON.parse(raw);
    const sources = data.sources || [];
    return NextResponse.json({ success: true, data: sources });
  } catch (error: any) {
    console.error('Error fetching sources:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch sources' },
      { status: 500 }
    );
  }
}
