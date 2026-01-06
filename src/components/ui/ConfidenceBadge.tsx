"use client"

import { Badge } from "./badge"
import { formatConfidence, getConfidenceColor } from "@/lib/formatters"

interface ConfidenceBadgeProps {
  confidence: number | null | undefined
  showLabel?: boolean
  className?: string
}

/**
 * Reusable confidence badge component
 * Shows confidence score with color-coded styling
 */
export function ConfidenceBadge({ confidence, showLabel = false, className = "" }: ConfidenceBadgeProps) {
  const confidenceText = formatConfidence(confidence)
  const colorClasses = getConfidenceColor(confidence)

  return (
    <Badge className={`${colorClasses} ${className}`} variant="outline">
      {showLabel && "Confidence: "}
      {confidenceText}
    </Badge>
  )
}

