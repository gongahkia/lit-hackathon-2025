import { NextRequest, NextResponse } from 'next/server';
import { FileStorage } from '../../../../lib/file-storage';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: docId } = await context.params;

    // Get all documents from file storage and find the one with matching ID
    const documents = FileStorage.getDocuments();
    const document = documents.find((doc: any) => doc.id === docId);

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Transform to frontend format
    const formattedDoc = {
      id: document.id,
      title: document.title,
      source: document.source_id || document.source || '',
      source_name: document.source_name || '',
      source_url: document.url || '',
      source_category: document.source_type || '',
      date: document.date || '',
      publishedAt: document.published_at || document.date || '',
      type: document.type || '',
      content: document.content || '',
      summary: document.summary || '',
      speaker: document.speaker || '',
      role: document.role || '',
      tags: document.tags || [],
      topics: document.topics || [],
      sourceType: document.source_type || '',
      verified: document.verified ?? true,
      confidence: document.confidence ?? 1.0,
      contradictions: document.contradictions || [],
      url: document.url || '',
      language: document.language || 'en'
    };

    return NextResponse.json({ success: true, data: formattedDoc });
  } catch (error: any) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

