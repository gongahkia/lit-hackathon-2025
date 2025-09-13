import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '../../../../lib/database'

export async function GET(request: NextRequest) {
  try {
    const sources = await DatabaseService.getSources()
    return NextResponse.json({ success: true, data: sources })
  } catch (error: any) {
    console.error('Error fetching sources:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch sources' },
      { status: 500 }
    )
  }
}
