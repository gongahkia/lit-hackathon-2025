import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/matters/[id] - Get a specific matter with evidence items
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matterId = params.id;

    // Get matter
    const { data: matter, error: matterError } = await supabase
      .from('matters')
      .select('*')
      .eq('id', matterId)
      .single();

    if (matterError || !matter) {
      return NextResponse.json(
        { success: false, error: 'Matter not found' },
        { status: 404 }
      );
    }

    // Get evidence items for this matter
    const { data: evidenceItems, error: itemsError } = await supabase
      .from('evidence_items')
      .select('*')
      .eq('matter_id', matterId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.error('Error fetching evidence items:', itemsError);
    }

    return NextResponse.json({
      success: true,
      matter,
      evidenceItems: evidenceItems || [],
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
  { params }: { params: { id: string } }
) {
  try {
    const matterId = params.id;

    const { error } = await supabase
      .from('matters')
      .delete()
      .eq('id', matterId);

    if (error) {
      console.error('Error deleting matter:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

