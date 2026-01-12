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

// GET /api/matters - List all matters
export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      if (USE_MOCK_DATA_FALLBACK) {
        return NextResponse.json({ success: true, matters: FileStorage.getMatters() });
      }
      return NextResponse.json(
        { success: false, error: 'Supabase configuration missing', matters: [] },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('matters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching matters:', error);
      if (USE_MOCK_DATA_FALLBACK) {
        console.warn('Falling back to local file storage for matters');
        return NextResponse.json({ success: true, matters: FileStorage.getMatters() });
      }
      return NextResponse.json(
        { success: false, error: error.message, matters: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, matters: data || [] });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    if (USE_MOCK_DATA_FALLBACK) {
       return NextResponse.json({ success: true, matters: FileStorage.getMatters() });
    }
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

    if (!supabase) {
      if (USE_MOCK_DATA_FALLBACK) {
        const newMatter = FileStorage.createMatter(name.trim(), description?.trim());
        return NextResponse.json({ success: true, matter: newMatter }, { status: 201 });
      }
      return NextResponse.json(
        { success: false, error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('matters')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating matter:', error);
      if (USE_MOCK_DATA_FALLBACK) {
        const newMatter = FileStorage.createMatter(name.trim(), description?.trim());
        return NextResponse.json({ success: true, matter: newMatter }, { status: 201 });
      }
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, matter: data }, { status: 201 });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

