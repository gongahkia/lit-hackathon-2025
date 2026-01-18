import { NextRequest, NextResponse } from 'next/server';
import { FileStorage } from '../../../lib/file-storage';

// GET /api/matters - List all matters
export async function GET(request: NextRequest) {
  try {
    // Always use file storage for frontend-only demo
    const matters = FileStorage.getMatters();
    console.log('[API DEBUG] Returning matters:', matters);
    return NextResponse.json({ success: true, matters });
  } catch (error: any) {
    console.error('[API DEBUG] Unexpected error in /api/matters:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error', matters: [] },
      { status: 500 }
    );
  }
}

// POST /api/matters - Create a new matter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Matter name is required' },
        { status: 400 }
      );
    }

    const newMatter = FileStorage.createMatter(name.trim(), description?.trim());
    return NextResponse.json({ success: true, matter: newMatter }, { status: 201 });

  } catch (error: any)
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

