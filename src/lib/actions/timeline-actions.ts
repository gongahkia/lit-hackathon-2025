"use server"

import { TimelineService, TimelineEvent } from "../../../lib/timeline-service"

export async function getDocumentTimeline(documentId: string): Promise<{
  success: boolean
  data?: TimelineEvent[]
  error?: string
}> {
  try {
    if (!documentId) {
      return { success: false, error: "Document ID is required" }
    }

    const timelineEvents = await TimelineService.generateDocumentTimeline(documentId)

    return {
      success: true,
      data: timelineEvents
    }
  } catch (error: any) {
    console.error("Error fetching document timeline:", error)
    return {
      success: false,
      error: error.message || "Failed to fetch timeline"
    }
  }
}
