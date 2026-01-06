import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/evidence-items?matter_id=xxx - Get evidence items for a matter
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const matterId = searchParams.get('matter_id');

    if (!matterId) {
      return NextResponse.json(
        { success: false, error: 'matter_id query parameter is required', evidenceItems: [] },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('evidence_items')
      .select('*')
      .eq('matter_id', matterId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching evidence items:', error);
      return NextResponse.json(
        { success: false, error: error.message, evidenceItems: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, evidenceItems: data || [] });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error', evidenceItems: [] },
      { status: 500 }
    );
  }
}

// POST /api/evidence-items - Create a new evidence item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matter_id, document_id, quote_text, citation_json, user_note, display_order } = body;

    // Validation
    if (!matter_id || !document_id || !quote_text || !citation_json) {
      return NextResponse.json(
        { success: false, error: 'matter_id, document_id, quote_text, and citation_json are required' },
        { status: 400 }
      );
    }

    // Verify matter exists
    const { data: matter, error: matterError } = await supabase
      .from('matters')
      .select('id')
      .eq('id', matter_id)
      .single();

    if (matterError || !matter) {
      return NextResponse.json(
        { success: false, error: 'Matter not found' },
        { status: 404 }
      );
    }

    // Verify document exists
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id')
      .eq('id', document_id)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Insert evidence item
    const { data, error } = await supabase
      .from('evidence_items')
      .insert({
        matter_id,
        document_id,
        quote_text: quote_text.trim(),
        citation_json,
        user_note: user_note?.trim() || null,
        display_order: display_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating evidence item:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, evidenceItem: data }, { status: 201 });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

