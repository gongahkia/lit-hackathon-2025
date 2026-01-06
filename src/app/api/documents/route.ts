import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '../../../../lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const sourceType = searchParams.get('sourceType')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const speakerCategory = searchParams.get('speakerCategory')
    
    let documents
    if (query || sourceType || dateFrom || dateTo || speakerCategory) {
      documents = await DatabaseService.searchDocumentsWithFilters({
        query: query || undefined,
        sourceType: sourceType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        speakerCategory: speakerCategory || undefined,
      })
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
