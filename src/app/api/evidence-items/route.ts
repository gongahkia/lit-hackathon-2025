import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FileStorage } from '../../../lib/file-storage';

const USE_MOCK_DATA_FALLBACK = process.env.USE_MOCK_DATA_FALLBACK === 'true';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: any;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

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

    if (!supabase) {
      if (USE_MOCK_DATA_FALLBACK) {
        return NextResponse.json({ success: true, evidenceItems: FileStorage.getEvidenceItems(matterId) });
      }
      return NextResponse.json(
        { success: false, error: 'Supabase configuration missing', evidenceItems: [] },
        { status: 500 }
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
      if (USE_MOCK_DATA_FALLBACK) {
        return NextResponse.json({ success: true, evidenceItems: FileStorage.getEvidenceItems(matterId) });
      }
      return NextResponse.json(
        { success: false, error: error.message, evidenceItems: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, evidenceItems: data || [] });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    if (USE_MOCK_DATA_FALLBACK) {
       return NextResponse.json({ success: true, evidenceItems: FileStorage.getEvidenceItems(request.nextUrl.searchParams.get('matter_id') || '') });
    }
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

    if (!supabase) {
      if (USE_MOCK_DATA_FALLBACK) {
        // Verify matter exists
        const matters = FileStorage.getMatters();
        if (!matters.find((m: any) => m.id === matter_id)) {
           return NextResponse.json({ success: false, error: 'Matter not found' }, { status: 404 });
        }
        // Verify document exists
        const docs = FileStorage.getDocuments();
        if (!docs.find((d: any) => d.id === document_id)) {
           return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
        }
        
        const newItem = FileStorage.createEvidenceItem({
          matter_id,
          document_id,
          quote_text: quote_text.trim(),
          citation_json,
          user_note: user_note?.trim() || null,
          display_order: display_order || 0,
        });
        return NextResponse.json({ success: true, evidenceItem: newItem }, { status: 201 });
      }
       return NextResponse.json(
        { success: false, error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    // Verify matter exists
    const { data: matter, error: matterError } = await supabase
      .from('matters')
      .select('id')
      .eq('id', matter_id)
      .single();

    if (matterError || !matter) {
       if (USE_MOCK_DATA_FALLBACK && matterError) {
          // Fallback logic inside error block if Supabase fails unexpectedly
           const matters = FileStorage.getMatters();
            if (!matters.find((m: any) => m.id === matter_id)) {
               return NextResponse.json({ success: false, error: 'Matter not found' }, { status: 404 });
            }
             const newItem = FileStorage.createEvidenceItem({
              matter_id,
              document_id,
              quote_text: quote_text.trim(),
              citation_json,
              user_note: user_note?.trim() || null,
              display_order: display_order || 0,
            });
            return NextResponse.json({ success: true, evidenceItem: newItem }, { status: 201 });
       }
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
      if (USE_MOCK_DATA_FALLBACK) {
         const newItem = FileStorage.createEvidenceItem({
          matter_id,
          document_id,
          quote_text: quote_text.trim(),
          citation_json,
          user_note: user_note?.trim() || null,
          display_order: display_order || 0,
        });
        return NextResponse.json({ success: true, evidenceItem: newItem }, { status: 201 });
      }
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

