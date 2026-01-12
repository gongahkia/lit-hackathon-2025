import { NextRequest, NextResponse } from 'next/server'
import { DataService } from '../../../../lib/dataService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    // For MVP with file storage fallback, we mainly support text search
    // The DataService.searchDocuments handles the fallback logic
    let documents
    if (query) {
      documents = await DataService.searchDocuments(query)
    } else {
      documents = await DataService.getDocuments()
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
