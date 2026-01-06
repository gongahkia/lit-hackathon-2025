"use client"

import { QueryResponse, Citation } from "@/lib/types/query"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { ExternalLink, FileText, AlertTriangle, CheckCircle } from "lucide-react"
import { formatDateShort, getSourceTypeColor } from "@/lib/formatters"
import { ConfidenceBadge } from "../ui/ConfidenceBadge"
import { Separator } from "../ui/separator"

interface RAGResponseViewProps {
  response: QueryResponse
  onViewDocument?: (docId: string) => void
}

/**
 * Component to display RAG-style query responses with structured citations
 * Prepared for P2 hierarchical RAG implementation
 * 
 * This component will be used in AIQueryPane when P2 is implemented
 */
export function RAGResponseView({ response, onViewDocument }: RAGResponseViewProps) {
  if (!response.success) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Error: {response.error || "Failed to process query"}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Answer Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Answer</CardTitle>
            <ConfidenceBadge confidence={response.confidence} showLabel />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed whitespace-pre-wrap">{response.answer}</p>
        </CardContent>
      </Card>

      {/* Citations Section */}
      {response.citations && response.citations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Sources ({response.citations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {response.citations.map((citation, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{citation.document_title}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Badge className={getSourceTypeColor(citation.source_name)} variant="outline" className="text-xs">
                        Level {citation.hierarchy_level}
                      </Badge>
                      <span>{citation.source_name}</span>
                      {citation.relevance_score && (
                        <span className="text-xs">Relevance: {Math.round(citation.relevance_score * 100)}%</span>
                      )}
                    </div>
                    <blockquote className="text-sm italic text-muted-foreground border-l-2 border-primary pl-3 my-2">
                      "{citation.quote}"
                    </blockquote>
                  </div>
                  <div className="flex flex-col gap-2">
                    {onViewDocument && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDocument(citation.document_id)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                    {citation.source_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(citation.source_url, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Source
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Unsupported Claims Warning */}
      {response.unsupported_claims && response.unsupported_claims.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              Unsupported Claims
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
              {response.unsupported_claims.map((claim, idx) => (
                <li key={idx}>{claim}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Audit Trail Link (P2) */}
      {response.audit_trail_id && (
        <Card>
          <CardContent className="p-4">
            <Button variant="outline" size="sm" className="w-full">
              <FileText className="h-3 w-3 mr-2" />
              View Audit Trail
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

