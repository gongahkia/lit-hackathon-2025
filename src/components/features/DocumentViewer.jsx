"use client"

import { useState } from "react"
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Share2,
  Flag,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Building,
} from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"
import { Alert, AlertDescription } from "../ui/alert"
import { Textarea } from "../ui/textarea"

export default function DocumentViewer({ document, onBack }) {
  const [selectedText, setSelectedText] = useState("")
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportReason, setReportReason] = useState("")

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">No document selected</h3>
          <p className="text-muted-foreground mb-4">Select a document from search results to view it here</p>
          <Button onClick={onBack}>Back to Search</Button>
        </div>
      </div>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-SG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getSourceTypeColor = (type) => {
    switch (type) {
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

  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection.toString().length > 0) {
      setSelectedText(selection.toString())
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const shareDocument = () => {
    const shareData = {
      title: document.title,
      text: `${document.title} - ${document.speaker}`,
      url: document.url,
    }

    if (navigator.share) {
      navigator.share(shareData)
    } else {
      copyToClipboard(document.url)
    }
  }

  const submitReport = () => {
    // Handle report submission
    console.log("Report submitted:", { documentId: document.id, reason: reportReason })
    setShowReportForm(false)
    setReportReason("")
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 p-4">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={shareDocument}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(document.url, "_blank")}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Source
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowReportForm(true)}>
              <Flag className="h-4 w-4 mr-2" />
              Report Error
            </Button>
          </div>
        </div>

        <div className="max-w-4xl">
          <h1 className="text-2xl font-semibold mb-3 text-balance">{document.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">{document.speaker}</span>
              <span>({document.role})</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatDate(document.publishedAt)}
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              {document.source}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className={getSourceTypeColor(document.sourceType)}>{document.sourceType}</Badge>

            {document.verified ? (
              <div className="flex items-center gap-1 text-secondary">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Verified</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Unverified</span>
              </div>
            )}

            <div className="text-sm text-muted-foreground">Confidence: {Math.round(document.confidence * 100)}%</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Contradictions Alert */}
          {document.contradictions && document.contradictions.length > 0 && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <strong>Potential contradictions detected:</strong> This statement may conflict with{" "}
                {document.contradictions.length} other document(s).
                <Button variant="link" className="p-0 h-auto text-yellow-800 dark:text-yellow-200 underline ml-1">
                  View contradictions
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Document Content */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Document Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none leading-relaxed text-pretty"
                onMouseUp={handleTextSelection}
                style={{ userSelect: "text" }}
              >
                {document.content}
              </div>

              {selectedText && (
                <div className="mt-4 p-3 bg-muted rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Selected Text:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(`"${selectedText}" - ${document.speaker}, ${formatDate(document.publishedAt)}`)
                      }
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Quote
                    </Button>
                  </div>
                  <p className="text-sm italic">"{selectedText}"</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Source Attribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Source Attribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Original URL</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">{document.url}</code>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(document.url)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Document ID</label>
                  <p className="text-sm font-mono mt-1">{document.id}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Verified</label>
                  <p className="text-sm mt-1">{formatDate(document.publishedAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Topics & Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Topics & Classification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Related Topics</label>
                    <div className="flex flex-wrap gap-2">
                      {document.topics.map((topic) => (
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Reliability Score</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${document.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{Math.round(document.confidence * 100)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Error Form */}
          {showReportForm && (
            <Card className="mt-6 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  Report an Error
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Help us improve accuracy by reporting any errors in this document or its attribution.
                </p>

                <Textarea
                  placeholder="Describe the error or issue you found..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="min-h-[100px]"
                />

                <div className="flex gap-2">
                  <Button onClick={submitReport} disabled={!reportReason.trim()}>
                    Submit Report
                  </Button>
                  <Button variant="outline" onClick={() => setShowReportForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
