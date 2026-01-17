"use client"

import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"
import { Textarea } from "../ui/textarea"
import { Download, Folder, FileText, Loader2, Trash2, User, Clock, Building } from "lucide-react"
import { formatDateShort, buildCitation } from "@/lib/formatters"
import { EmptyState } from "../ui/EmptyState"
import { LoadingState } from "../ui/LoadingState"

export default function EvidenceBundleView() {
  const [matters, setMatters] = useState([])
  const [selectedMatterId, setSelectedMatterId] = useState("")
  const [evidenceItems, setEvidenceItems] = useState([])
  const [isLoadingMatters, setIsLoadingMatters] = useState(true)
  const [isLoadingItems, setIsLoadingItems] = useState(false)

  // Load matters on mount
  useEffect(() => {
    const loadMatters = async () => {
      try {
        setIsLoadingMatters(true)
        const res = await fetch("/api/matters")
        const data = await res.json()
        if (data.success) {
          setMatters(data.matters || [])
          if (data.matters && data.matters.length > 0) {
            setSelectedMatterId(data.matters[0].id)
          }
        }
      } catch (error) {
        console.error("Error loading matters:", error)
      } finally {
        setIsLoadingMatters(false)
      }
    }

    loadMatters()
  }, [])

  // Load evidence items when selected matter changes
  useEffect(() => {
    const loadEvidenceItems = async () => {
      if (!selectedMatterId) {
        setEvidenceItems([])
        return
      }

      try {
        setIsLoadingItems(true)
        console.log('[UI DEBUG] Fetching evidence items for matterId:', selectedMatterId)
        const res = await fetch(`/api/evidence-items?matter_id=${encodeURIComponent(selectedMatterId)}`)
        const data = await res.json()
        console.log('[UI DEBUG] API response evidenceItems:', data.evidenceItems)
        if (data.success) {
          setEvidenceItems(data.evidenceItems || [])
        }
      } catch (error) {
        console.error("Error loading evidence items:", error)
      } finally {
        setIsLoadingItems(false)
      }
    }

    loadEvidenceItems()
  }, [selectedMatterId])

  const selectedMatter = matters.find((m) => m.id === selectedMatterId)

  const handleSelectMatter = (matterId) => {
    setSelectedMatterId(matterId)
  }

  const handleDeleteEvidenceItem = async (itemId) => {
    if (!confirm("Remove this evidence item from the bundle?")) return

    try {
      const res = await fetch(`/api/evidence-items/${itemId}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        setEvidenceItems((items) => items.filter((item) => item.id !== itemId))
      }
    } catch (error) {
      console.error("Error deleting evidence item:", error)
    }
  }


  const exportAsPdf = () => {
    if (!selectedMatter || evidenceItems.length === 0) return

    const citationLines = (item) => {
      const c = item.citation_json || {}
      const lines = []
      if (c.speaker) {
        lines.push(`Speaker: ${c.speaker}${c.role ? ` (${c.role})` : ""}`)
      }
      const dateStr = formatDateShort(c.publishedAt || c.date)
      if (dateStr) lines.push(`Date: ${dateStr}`)
      if (c.source) lines.push(`Source: ${c.source}`)
      if (c.url) lines.push(`URL: ${c.url}`)
      if (c.documentId) lines.push(`Document ID: ${c.documentId}`)
      return lines.join(" · ")
    }

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charSet="utf-8" />
    <title>Evidence Bundle - ${selectedMatter.name}</title>
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 24px; color: #111827; }
      h1 { font-size: 24px; margin-bottom: 4px; }
      h2 { font-size: 18px; margin-top: 24px; margin-bottom: 4px; }
      p { margin: 4px 0; }
      .matter-desc { color: #4b5563; margin-bottom: 16px; }
      .quote { margin: 8px 0 4px 0; padding-left: 12px; border-left: 3px solid #e5e7eb; font-style: italic; }
      .meta { font-size: 12px; color: #4b5563; margin-bottom: 8px; }
      .note { font-size: 12px; color: #374151; margin-bottom: 8px; }
      .hr { border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0; }
    </style>
  </head>
  <body>
    <h1>Evidence Bundle: ${selectedMatter.name}</h1>
    ${selectedMatter.description ? `<p class="matter-desc">${selectedMatter.description}</p>` : ""}
    ${evidenceItems
      .map((item, index) => {
        const c = item.citation_json || {}
        return `
      <h2>${index + 1}. ${c.title || "Untitled"}</h2>
      <p class="quote">"${item.quote_text}"</p>
      <p class="meta">${citationLines(item)}</p>
      ${
        item.user_note
          ? `<p class="note"><strong>Note:</strong> ${item.user_note}</p>`
          : ""
      }
      <hr class="hr" />
    `
      })
      .join("")}
  </body>
</html>`

    try {
      const printWindow = window.open("", "_blank")
      if (!printWindow) return
      printWindow.document.open()
      printWindow.document.write(html)
      printWindow.document.close()
      // Give the browser a moment to render before printing
      printWindow.focus()
      printWindow.print()
    } catch (error) {
      console.error("Error exporting PDF:", error)
    }
  }

  return (
    <div className="flex h-full gap-4">
      {/* Matters list */}
      <div className="w-72 border border-border bg-card/40 rounded-lg flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            <span className="text-sm font-semibold">Matters</span>
          </div>
          {isLoadingMatters && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex-1 overflow-auto">
          {matters.length === 0 && !isLoadingMatters ? (
            <EmptyState
              icon={Folder}
              title="No matters yet"
              description="Use Add to Bundle in DocumentViewer to create one."
              className="p-4"
            />
          ) : (
            <div className="p-2 space-y-1">
              {matters.map((matter) => (
                <button
                  key={matter.id}
                  onClick={() => handleSelectMatter(matter.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent ${
                    selectedMatterId === matter.id ? "bg-accent text-accent-foreground" : "text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{matter.name}</span>
                  </div>
                  {matter.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{matter.description}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Evidence items and export */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {selectedMatter ? selectedMatter.name : "No matter selected"}
            </h2>
            {selectedMatter && selectedMatter.description && (
              <p className="text-sm text-muted-foreground mt-1">{selectedMatter.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {evidenceItems.length} item{evidenceItems.length === 1 ? "" : "s"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={exportAsPdf}
              disabled={!selectedMatter || evidenceItems.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto space-y-3">
          {isLoadingItems && (
            <LoadingState message="Loading evidence items..." />
          )}

          {!isLoadingItems && selectedMatter && evidenceItems.length === 0 && (
            <EmptyState
              icon={FileText}
              title="No evidence items yet"
              description="Open a document, select text, and click Add to Bundle to start building this bundle."
            />
          )}

          {!isLoadingItems &&
            evidenceItems.map((item, index) => {
              const citation = item.citation_json || {}
              return (
                <Card key={item.id} className="group relative overflow-hidden transition-all duration-300 hover:shadow-md border-border">
                  {/* Accent border */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-all duration-300" />
                  
                  <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <CardTitle className="text-base flex items-center gap-3">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20">
                          {index + 1}
                        </span>
                        <span className="truncate font-semibold">{citation.title || "Untitled"}</span>
                      </CardTitle>
                      
                      {/* Enhanced Citation Display */}
                      <div className="pl-10 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          {citation.speaker && (
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-medium">{citation.speaker}</span>
                              {citation.role && (
                                <span className="text-xs text-muted-foreground">({citation.role})</span>
                              )}
                            </div>
                          )}
                          {citation.publishedAt && (
                            <>
                              <Separator orientation="vertical" className="h-4" />
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{formatDateShort(citation.publishedAt || citation.date)}</span>
                              </div>
                            </>
                          )}
                          {(citation.source_name || citation.source) && (
                            <>
                              <Separator orientation="vertical" className="h-4" />
                              <div className="flex items-center gap-1.5">
                                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{citation.source_name || citation.source}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={() => handleDeleteEvidenceItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0 pl-10">
                    {/* Quote - Enhanced Styling */}
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/40 rounded-full" />
                      <blockquote className="pl-4 text-sm leading-relaxed text-foreground italic border-l-2 border-primary/30 bg-muted/30 p-3 rounded-r-md">
                        "{item.quote_text}"
                      </blockquote>
                    </div>

                    {/* User Note - Enhanced */}
                    {item.user_note && (
                      <div className="bg-accent/30 rounded-lg p-4 border border-accent/50">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                          Your Note
                        </label>
                        <p className="text-sm leading-relaxed">{item.user_note}</p>
                      </div>
                    )}
                    
                    {/* Citation Footer */}
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground font-mono">
                        {buildCitation({
                          speaker: citation.speaker,
                          role: citation.role,
                          publishedAt: citation.publishedAt || citation.date,
                          source_name: citation.source_name,
                          source: citation.source,
                          url: citation.url,
                          documentId: citation.documentId
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
        </div>

      </div>
    </div>
  )
}


