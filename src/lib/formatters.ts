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

  // Note: URLs are NOT included in legal citations - they should be displayed separately
  // Document ID can be included if no other identifier is available
  if (!citation.url && citation.documentId) {
    parts.push(`Document ID: ${citation.documentId}`)
  }

  return parts.join(", ")
}

/**
 * Normalize confidence score to 0-1 range
 * Handles both 0-1 and 0-100 ranges gracefully
 */
export function normalizeConfidence(confidence: number | null | undefined): number | null {
  if (confidence === null || confidence === undefined) return null
  // If confidence is > 1, assume it's in 0-100 range and normalize
  if (confidence > 1) {
    return Math.max(0, Math.min(1, confidence / 100))
  }
  // Already in 0-1 range
  return Math.max(0, Math.min(1, confidence))
}

/**
 * Format confidence score as percentage
 * Input: 0.0 - 1.0 (or 0-100, will be normalized)
 * Output: "85%" or "N/A"
 */
export function formatConfidence(confidence: number | null | undefined): string {
  const normalized = normalizeConfidence(confidence)
  if (normalized === null) return "N/A"
  return `${Math.round(normalized * 100)}%`
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

