import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../../lib/database';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: docId } = await context.params;
    
    // Get all documents and find the one with matching ID
    const documents = await DatabaseService.getDocuments();
    const document = documents.find((doc) => doc.id === docId);
    
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: document });
  } catch (error: any) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

