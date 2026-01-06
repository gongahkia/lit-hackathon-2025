import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../../lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docId = params.id;
    
    // Get all documents and find the one with matching ID
    // TODO: Optimize this with a direct query in DatabaseService
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

