import { NextRequest, NextResponse } from 'next/server'
import { TimelineService } from '../../../../../../lib/timeline-service'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await context.params

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      )
    }

    const timelineEvents = await TimelineService.generateDocumentTimeline(documentId)

    return NextResponse.json({
      success: true,
      data: timelineEvents
    })
  } catch (error: any) {
    console.error('Error fetching document timeline:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch timeline' },
      { status: 500 }
    )
  }
}

