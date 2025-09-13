import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '../../../../lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    let documents
    if (query) {
      documents = await DatabaseService.searchDocuments(query)
    } else {
      documents = await DatabaseService.getDocuments()
    }
    
    return NextResponse.json({ success: true, data: documents })
  } catch (error: any) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}
