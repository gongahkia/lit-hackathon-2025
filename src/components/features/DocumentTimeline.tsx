"use client"

import { useEffect, useState } from "react"
import { formatDateShort } from "@/lib/formatters"
import { EmptyState } from "../ui/EmptyState"
import { LoadingState } from "../ui/LoadingState"
import { Clock, FileText, ExternalLink, Plus, Edit, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import type { TimelineEvent } from "../../../lib/timeline-service"
import { getDocumentTimeline } from "@/lib/actions/timeline-actions"

interface DocumentTimelineProps {
  documentId: string
  onViewDocument?: (docId: string) => void
}

export default function DocumentTimeline({ documentId, onViewDocument }: DocumentTimelineProps) {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!documentId) return

    setIsLoading(true)
    setError(null)

    getDocumentTimeline(documentId)
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setTimelineEvents(result.data)
        } else {
          setError(result.error || "Failed to load timeline")
        }
      })
      .catch((err) => {
        console.error("Error fetching timeline:", err)
        setError(err.message || "Failed to load timeline")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [documentId])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Policy Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingState message="Loading policy timeline..." />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Policy Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (timelineEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Policy Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Clock}
            title="No timeline data available"
            description="No related policy development documents found for this document's topics."
          />
        </CardContent>
      </Card>
    )
  }

  // Group events by topic
  const eventsByTopic = new Map<string, TimelineEvent[]>()
  timelineEvents.forEach((event) => {
    const existing = eventsByTopic.get(event.topic) || []
    existing.push(event)
    eventsByTopic.set(event.topic, existing)
  })

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "creation":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
      case "amendment":
        return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"
      case "dissolution":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800"
    }
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "creation":
        return <Plus className="h-3 w-3" />
      case "amendment":
        return <Edit className="h-3 w-3" />
      case "dissolution":
        return <X className="h-3 w-3" />
      default:
        return <FileText className="h-3 w-3" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Related Policy Development
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Array.from(eventsByTopic.entries()).map(([topicId, events], topicIdx) => {
          const topicName = events[0]?.topic_name || topicId
          return (
            <div key={topicId} className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base">{topicName}</h3>
                <Badge variant="outline" className="text-xs">
                  {events.length} event{events.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              {/* Vertical timeline */}
              <div className="relative pl-6 border-l-2 border-border space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-primary border-2 border-background" />

                    {/* Event card */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-xs flex items-center gap-1 ${getEventTypeColor(event.type)}`}
                        >
                          {getEventTypeIcon(event.type)}
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </Badge>
                        {event.isAiGenerated && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                            AI Generated
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {event.date ? formatDateShort(event.date) : 'Date unknown'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-1">{event.document_title}</h4>
                        {event.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {event.summary}
                          </p>
                        )}
                      </div>

                      {event.speakers && event.speakers.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Speakers: </span>
                          {event.speakers.join(", ")}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {onViewDocument && event.document_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewDocument(event.document_id!)}
                            className="h-7 text-xs"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            View Document
                          </Button>
                        )}
                        {event.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(event.url, "_blank")}
                            className="h-7 text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Source
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {topicIdx < Array.from(eventsByTopic.entries()).length - 1 && (
                <Separator className="my-4" />
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

