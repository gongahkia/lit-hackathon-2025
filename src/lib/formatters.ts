/**
 * Centralized formatting utilities for dates, citations, and confidence scores
 * Used across SearchPane, DocumentViewer, EvidenceBundleView, TimelineView, etc.
 */

/**
 * Format date for short display (search results, cards)
 * Format: "Jan 15, 2024"
 */
export function formatDateShort(dateString: string | null | undefined): string {
  if (!dateString) return "Date not available"
  try {
    return new Date(dateString).toLocaleDateString("en-SG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch (error) {
    return dateString
  }
}

/**
 * Format date for long display (document view, detailed views)
 * Format: "January 15, 2024, 10:30 AM"
 */
export function formatDateLong(dateString: string | null | undefined): string {
  if (!dateString) return "Date not available"
  try {
    return new Date(dateString).toLocaleDateString("en-SG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    return dateString
  }
}

/**
 * Format date for timeline display
 * Format: "Jan 15, 2024"
 */
export function formatDateTimeline(dateString: string | null | undefined): string {
  return formatDateShort(dateString)
}

/**
 * Build a legal citation string from document metadata
 * Format: "Speaker Name (Role), Date, Source Name, URL"
 * Used in DocumentViewer, EvidenceBundleView, and exports
 */
export interface CitationData {
  speaker?: string
  role?: string
  date?: string
  publishedAt?: string
  source_name?: string
  source?: string
  url?: string
  documentId?: string
}

export function buildCitation(citation: CitationData): string {
  const parts: string[] = []

  // Speaker and role
  if (citation.speaker) {
    let speakerPart = citation.speaker
    if (citation.role) {
      speakerPart += ` (${citation.role})`
    }
    parts.push(speakerPart)
  }

  // Date (prefer publishedAt, fallback to date)
  const dateStr = citation.publishedAt || citation.date
  if (dateStr) {
    parts.push(formatDateShort(dateStr))
  }

  // Source name
  const sourceName = citation.source_name || citation.source
  if (sourceName) {
    parts.push(sourceName)
  }

  // URL or document ID
  if (citation.url) {
    parts.push(citation.url)
  } else if (citation.documentId) {
    parts.push(`Document ID: ${citation.documentId}`)
  }

  return parts.join(", ")
}

/**
 * Format confidence score as percentage
 * Input: 0.0 - 1.0
 * Output: "85%" or "N/A"
 */
export function formatConfidence(confidence: number | null | undefined): string {
  if (confidence === null || confidence === undefined) return "N/A"
  return `${Math.round(confidence * 100)}%`
}

/**
 * Get color classes for confidence score
 * Returns Tailwind classes for confidence-based styling
 */
export function getConfidenceColor(confidence: number | null | undefined): string {
  if (confidence === null || confidence === undefined) {
    return "bg-muted text-muted-foreground"
  }
  if (confidence >= 0.8) {
    return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300"
  }
  if (confidence >= 0.6) {
    return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300"
  }
  return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300"
}

/**
 * Get color classes for source type
 * Consistent across all components
 */
export function getSourceTypeColor(sourceType: string | null | undefined): string {
  switch (sourceType) {
    case "parliamentary":
      return "bg-primary/10 text-primary border-primary/20"
    case "ministerial":
      return "bg-secondary/10 text-secondary border-secondary/20"
    case "news":
      return "bg-muted text-muted-foreground border-border"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

/**
 * Truncate text with ellipsis
 * Used for content previews in search results
 */
export function truncateText(text: string | null | undefined, maxLength: number = 200): string {
  if (!text) return "No content available"
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

