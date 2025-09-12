"use client"

import { useState, useMemo } from "react"
import { Calendar, ArrowLeft, ExternalLink, User, Clock, AlertTriangle, TrendingUp } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Separator } from "../ui/separator"

export default function TimelineView({ topic, documents, onViewDocument }) {
  const [timeRange, setTimeRange] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [selectedEvent, setSelectedEvent] = useState(null)

  // Filter and sort documents for timeline
  const timelineEvents = useMemo(() => {
    if (!documents || !topic) return []

    return documents
      .filter((doc) => doc.topics.includes(topic.id))
      .sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt))
      .map((doc, index, arr) => {
        // Detect potential policy changes
        const isSignificantChange =
          index > 0 &&
          (doc.speaker !== arr[index - 1].speaker ||
            Math.abs(new Date(doc.publishedAt) - new Date(arr[index - 1].publishedAt)) > 30 * 24 * 60 * 60 * 1000)

        return {
          ...doc,
          isSignificantChange,
          eventType:
            doc.sourceType === "parliamentary"
              ? "debate"
              : doc.sourceType === "ministerial"
                ? "announcement"
                : "coverage",
        }
      })
  }, [documents, topic, timeRange, sourceFilter])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-SG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-SG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getEventColor = (eventType, isSignificant) => {
    if (isSignificant) return "bg-yellow-500"

    switch (eventType) {
      case "debate":
        return "bg-primary"
      case "announcement":
        return "bg-secondary"
      case "coverage":
        return "bg-muted-foreground"
      default:
        return "bg-muted-foreground"
    }
  }

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case "debate":
        return "🏛️"
      case "announcement":
        return "📢"
      case "coverage":
        return "📰"
      default:
        return "📄"
    }
  }

  if (!topic) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No topic selected</h3>
          <p className="text-muted-foreground">Select a topic to view its policy timeline</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 p-4">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="year">Past Year</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
                <SelectItem value="week">Past Week</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="parliamentary">Parliamentary</SelectItem>
                <SelectItem value="ministerial">Ministerial</SelectItem>
                <SelectItem value="news">News</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold">{topic.name} Timeline</h1>
            {topic.trending && (
              <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trending
              </Badge>
            )}
          </div>

          <p className="text-muted-foreground mb-3">{topic.description}</p>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-medium">{timelineEvents.length}</span>
              <span>events tracked</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{topic.documentCount}</span>
              <span>total documents</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Last updated {formatDate(topic.lastUpdated)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Timeline */}
            <div className="lg:col-span-2">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>

                <div className="space-y-6">
                  {timelineEvents.map((event, index) => (
                    <div key={event.id} className="relative flex gap-4">
                      {/* Timeline dot */}
                      <div
                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background ${getEventColor(event.eventType, event.isSignificantChange)}`}
                      >
                        <span className="text-xs text-white">{getEventIcon(event.eventType)}</span>
                      </div>

                      {/* Event card */}
                      <Card
                        className={`flex-1 cursor-pointer transition-all hover:shadow-md ${selectedEvent?.id === event.id ? "ring-2 ring-primary" : ""}`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <CardTitle className="text-base leading-tight mb-2">{event.title}</CardTitle>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {event.speaker}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(event.publishedAt)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge variant={event.eventType === "debate" ? "default" : "secondary"}>
                                {event.eventType}
                              </Badge>
                              {event.isSignificantChange && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            {event.content.substring(0, 150)}...
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              {event.topics.slice(0, 2).map((topicTag) => (
                                <Badge key={topicTag} variant="outline" className="text-xs">
                                  {topicTag}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onViewDocument(event.id)
                                }}
                              >
                                View Details
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(event.url, "_blank")
                                }}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Event Details Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                {selectedEvent ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Event Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">{selectedEvent.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{selectedEvent.content}</p>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Speaker
                          </label>
                          <p className="text-sm mt-1">
                            {selectedEvent.speaker} ({selectedEvent.role})
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Date & Time
                          </label>
                          <p className="text-sm mt-1">{formatTime(selectedEvent.publishedAt)}</p>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Source
                          </label>
                          <p className="text-sm mt-1">{selectedEvent.source}</p>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Confidence
                          </label>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${selectedEvent.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-sm">{Math.round(selectedEvent.confidence * 100)}%</span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => onViewDocument(selectedEvent.id)}>
                          View Full Document
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.open(selectedEvent.url, "_blank")}>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Source
                        </Button>
                      </div>

                      {selectedEvent.contradictions && selectedEvent.contradictions.length > 0 && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="font-medium">Contradictions detected</span>
                          </div>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                            This statement may conflict with {selectedEvent.contradictions.length} other document(s)
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <h4 className="font-medium mb-2">Select an Event</h4>
                      <p className="text-sm text-muted-foreground">
                        Click on any timeline event to view detailed information
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
