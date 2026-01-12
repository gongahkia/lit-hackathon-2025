import { NextRequest, NextResponse } from 'next/server'
import { DataService } from '../../../../lib/dataService'

export async function GET(request: NextRequest) {
  try {
    const topics = await DataService.getTopics()
    return NextResponse.json({ success: true, data: topics })
  } catch (error: any) {
    console.error('Error fetching topics:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch topics' },
      { status: 500 }
    )
  }
}
