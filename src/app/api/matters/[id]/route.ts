import { NextRequest, NextResponse } from 'next/server';

// GET /api/matters/[id] - Get a specific matter with evidence items
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matterId } = await context.params;

    // Since we are in a frontend-only build without Supabase, we return mock data.
    return NextResponse.json({
      success: true,
      matter: { id: matterId, name: "Mock Matter" },
      evidenceItems: [],
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/matters/[id] - Delete a matter (cascades to evidence items)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await context.params;

    // Since we are in a frontend-only build without Supabase, we return a success response.
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


