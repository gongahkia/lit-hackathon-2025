import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// PATCH /api/evidence-items/[id] - Update an evidence item
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await context.params;
    const body = await request.json();
    const { user_note, display_order, quote_text } = body;

    const updateData: any = {};
    if (user_note !== undefined) updateData.user_note = user_note?.trim() || null;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (quote_text !== undefined) updateData.quote_text = quote_text.trim();

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('evidence_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Error updating evidence item:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Evidence item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, evidenceItem: data });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/evidence-items/[id] - Delete an evidence item
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await context.params;

    const { error } = await supabase
      .from('evidence_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting evidence item:', error);
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

