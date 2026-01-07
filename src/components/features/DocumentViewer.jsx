"use client"

import { useState, useEffect } from "react"
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
  BookmarkPlus,
  Plus,
  FileText,
} from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"
import { Alert, AlertDescription } from "../ui/alert"
import { Textarea } from "../ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Input } from "../ui/input"
import { formatDateLong, formatDateShort, getSourceTypeColor, buildCitation, formatConfidence } from "@/lib/formatters"
import { ConfidenceBadge } from "../ui/ConfidenceBadge"
import { EmptyState } from "../ui/EmptyState"

export default function DocumentViewer({ document, onBack }) {
  const [selectedText, setSelectedText] = useState("")
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportReason, setReportReason] = useState("")
  // P1.1: Evidence Bundle state
  const [matters, setMatters] = useState([])
  const [selectedMatterId, setSelectedMatterId] = useState("")
  const [showBundleDialog, setShowBundleDialog] = useState(false)
  const [newMatterName, setNewMatterName] = useState("")
  const [newMatterDescription, setNewMatterDescription] = useState("")
  const [isCreatingMatter, setIsCreatingMatter] = useState(false)
  const [userNote, setUserNote] = useState("")
  const [isAddingEvidence, setIsAddingEvidence] = useState(false)
  const [topicsById, setTopicsById] = useState({})

  if (!document) {
    return (
      <EmptyState
        icon={FileText}
        title="No document selected"
        description="Select a document from search results to view it here"
        action={{
          label: "Back to Search",
          onClick: onBack
        }}
      />
    )
  }

  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection.toString().length > 0) {
      setSelectedText(selection.toString())
    }
  }

  // Format document content with proper paragraphs, lists, and structure
  const formatDocumentContent = (content) => {
    if (!content) return ""
    
    // Split by double newlines to create paragraphs
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    
    // Process each paragraph
    return paragraphs.map(para => {
      const trimmed = para.trim()
      
      // Detect and format numbered lists (1. 2. 3. or 1) 2) 3))
      if (/^\d+[\.\)]\s/.test(trimmed) || /^\d+[\.\)]\s/.test(trimmed.split('\n')[0])) {
        return trimmed
          .split('\n')
          .map(line => {
            const listMatch = line.match(/^(\d+[\.\)])\s*(.+)/)
            if (listMatch) {
              return `${listMatch[1]} ${listMatch[2].trim()}`
            }
            return line.trim()
          })
          .filter(line => line.length > 0)
          .join('\n')
      }
      
      // Detect and format bullet lists (- * •)
      if (/^[-*•]\s/.test(trimmed) || /^[-*•]\s/.test(trimmed.split('\n')[0])) {
        return trimmed
          .split('\n')
          .map(line => {
            const bulletMatch = line.match(/^([-*•])\s*(.+)/)
            if (bulletMatch) {
              return `• ${bulletMatch[2].trim()}`
            }
            return line.trim()
          })
          .filter(line => line.length > 0)
          .join('\n')
      }
      
      // Regular paragraph: clean up whitespace but preserve structure
      return trimmed
        .split(/\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join(' ')
    }).join('\n\n')
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

  // P1.1: Fetch matters on mount
  useEffect(() => {
    const fetchMatters = async () => {
      try {
        const res = await fetch("/api/matters")
        const data = await res.json()
        if (data.success) {
          setMatters(data.matters || [])
        }
      } catch (error) {
        console.error("Error fetching matters:", error)
      }
    }
    const fetchTopics = async () => {
      try {
        const res = await fetch("/api/topics")
        const data = await res.json()
        if (data.success && Array.isArray(data.data)) {
          const byId = data.data.reduce((acc, t) => {
            acc[t.id] = t
            return acc
          }, {})
          setTopicsById(byId)
        }
      } catch (error) {
        console.error("Error fetching topics:", error)
      }
    }
    fetchMatters()
    fetchTopics()
  }, [])

  // P1.1: Create new matter
  const createMatter = async () => {
    if (!newMatterName.trim()) return

    setIsCreatingMatter(true)
    try {
      const res = await fetch("/api/matters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMatterName.trim(),
          description: newMatterDescription.trim() || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMatters([...matters, data.matter])
        setSelectedMatterId(data.matter.id)
        setNewMatterName("")
        setNewMatterDescription("")
      }
    } catch (error) {
      console.error("Error creating matter:", error)
    } finally {
      setIsCreatingMatter(false)
    }
  }

  // P1.1: Add evidence item to bundle
  const addToEvidenceBundle = async () => {
    if (!selectedMatterId || !selectedText.trim()) return

    setIsAddingEvidence(true)
    try {
      // Build citation JSON
      const citationJson = {
        title: document.title,
        speaker: document.speaker,
        role: document.role,
        date: document.date,
        publishedAt: document.publishedAt,
        source: document.source,
        sourceType: document.sourceType,
        url: document.url,
        documentId: document.id,
      }

      const res = await fetch("/api/evidence-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matter_id: selectedMatterId,
          document_id: document.id,
          quote_text: selectedText.trim(),
          citation_json: citationJson,
          user_note: userNote.trim() || null,
        }),
      })

      const data = await res.json()
      if (data.success) {
        // Success - close dialog and clear selection
        setShowBundleDialog(false)
        setSelectedText("")
        setUserNote("")
        // You could add a toast notification here
        alert("Quote added to evidence bundle!")
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error adding evidence item:", error)
      alert("Failed to add quote to evidence bundle")
    } finally {
      setIsAddingEvidence(false)
    }
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
            {document.url && (
            <Button variant="outline" size="sm" onClick={() => window.open(document.url, "_blank")}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Source
            </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowReportForm(true)}>
              <Flag className="h-4 w-4 mr-2" />
              Report Error
            </Button>
          </div>
        </div>

        <div className="max-w-4xl">
          <h1 className="text-2xl font-semibold mb-3 text-balance">{document.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
            {document.speaker && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">{document.speaker}</span>
                {document.role && <span>({document.role})</span>}
            </div>
            )}
            {document.publishedAt && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
                {formatDateLong(document.publishedAt)}
            </div>
            )}
            {document.source && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
                {document.source_name || document.source}
            </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Badge className={getSourceTypeColor(document.sourceType)}>{document.sourceType}</Badge>
            {document.language && document.language !== "en" && (
              <Badge variant="outline" className="text-xs">
                {document.language === "zh" ? "中文" : String(document.language).toUpperCase()}
              </Badge>
            )}

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

            {document.confidence !== undefined && (
              <ConfidenceBadge confidence={document.confidence} showLabel />
            )}
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
                className="prose prose-sm max-w-none leading-relaxed text-pretty whitespace-pre-wrap"
                onMouseUp={handleTextSelection}
                style={{ userSelect: "text", lineHeight: "1.75" }}
              >
                {formatDocumentContent(document.content)}
              </div>

              {selectedText && (
                <div className="mt-4 p-3 bg-muted rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Selected Text:</span>
                    <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                          copyToClipboard(`"${selectedText}" - ${buildCitation({
                            speaker: document.speaker,
                            role: document.role,
                            publishedAt: document.publishedAt,
                            source_name: document.source_name,
                            url: document.url,
                            documentId: document.id
                          })}`)
                      }
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Quote
                    </Button>
                      {/* P1.1: Add to Evidence Bundle button */}
                      <Dialog open={showBundleDialog} onOpenChange={setShowBundleDialog}>
                        <DialogTrigger asChild>
                          <Button variant="default" size="sm">
                            <BookmarkPlus className="h-3 w-3 mr-1" />
                            Add to Bundle
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add to Evidence Bundle</DialogTitle>
                            <DialogDescription>
                              Select a matter or create a new one to add this quote to your evidence bundle.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Selected Quote</label>
                              <p className="text-sm italic bg-muted p-2 rounded">"{selectedText}"</p>
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-2 block">Matter</label>
                              <Select value={selectedMatterId} onValueChange={setSelectedMatterId}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a matter or create new" />
                                </SelectTrigger>
                                <SelectContent>
                                  {matters.map((matter) => (
                                    <SelectItem key={matter.id} value={matter.id}>
                                      {matter.name}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="__new__">+ Create New Matter</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {selectedMatterId === "__new__" && (
                              <div className="space-y-2 p-3 bg-muted rounded-lg">
                                <Input
                                  placeholder="Matter name (required)"
                                  value={newMatterName}
                                  onChange={(e) => setNewMatterName(e.target.value)}
                                />
                                <Textarea
                                  placeholder="Description (optional)"
                                  value={newMatterDescription}
                                  onChange={(e) => setNewMatterDescription(e.target.value)}
                                  className="min-h-[80px]"
                                />
                                <Button
                                  onClick={createMatter}
                                  disabled={!newMatterName.trim() || isCreatingMatter}
                                  size="sm"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  {isCreatingMatter ? "Creating..." : "Create Matter"}
                                </Button>
                              </div>
                            )}

                            <div>
                              <label className="text-sm font-medium mb-2 block">Note (optional)</label>
                              <Textarea
                                placeholder="Add a note about this quote..."
                                value={userNote}
                                onChange={(e) => setUserNote(e.target.value)}
                                className="min-h-[80px]"
                              />
                            </div>

                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" onClick={() => setShowBundleDialog(false)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={addToEvidenceBundle}
                                disabled={!selectedMatterId || selectedMatterId === "__new__" || isAddingEvidence}
                              >
                                {isAddingEvidence ? "Adding..." : "Add to Bundle"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <p className="text-sm italic">"{selectedText}"</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Source Attribution - Enhanced for Legal Use */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Source Attribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Citation Block - Prominent for Legal Practitioners */}
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                    Legal Citation
                  </label>
                  <p className="text-sm font-medium leading-relaxed">
                    {buildCitation({
                      speaker: document.speaker,
                      role: document.role,
                      publishedAt: document.publishedAt,
                      source_name: document.source_name,
                      url: document.url,
                      documentId: document.id
                    })}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const citation = buildCitation({
                        speaker: document.speaker,
                        role: document.role,
                        publishedAt: document.publishedAt,
                        source_name: document.source_name,
                        url: document.url,
                        documentId: document.id
                      })
                      copyToClipboard(citation)
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1.5" />
                    Copy Citation
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Original URL</label>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-3 py-2 rounded-md flex-1 truncate border border-border">
                      {document.url || "N/A"}
                    </code>
                    {document.url && (
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(document.url)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
                      Document ID
                    </label>
                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded border border-border">
                      {document.id}
                    </p>
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
                      Last Verified
                    </label>
                    <p className="text-sm">{formatDateLong(document.publishedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Topics & Classification - Enhanced */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  Topics & Classification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">
                      Related Topics
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(document.topics || []).length > 0 ? (
                        (document.topics || []).map((topic, idx) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className="text-xs bg-background hover:bg-accent transition-colors"
                          >
                          {topicsById?.[topic]?.name || topic}
                        </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No topics assigned</span>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                      Reliability Score
                    </label>
                    <div className="flex items-center gap-3">
                      <ConfidenceBadge confidence={document.confidence} showLabel />
                      {document.confidence !== undefined && (
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(document.confidence || 0) * 100}%` }}
                        />
                      </div>
                      )}
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
