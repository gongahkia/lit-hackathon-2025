"use client"

import { QueryResponse, Citation } from "@/lib/types/query"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { ExternalLink, FileText, AlertTriangle, CheckCircle, Quote } from "lucide-react"
import { formatDateShort, getSourceTypeColor, buildCitation } from "@/lib/formatters"
import { ConfidenceBadge } from "../ui/ConfidenceBadge"
import { Separator } from "../ui/separator"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface RAGResponseViewProps {
  response: QueryResponse
  onViewDocument?: (docId: string) => void
}

/**
 * Component to display RAG-style query responses with structured citations
 * Improved formatting with better spacing, typography, and visual hierarchy
 */
export function RAGResponseView({ response, onViewDocument }: RAGResponseViewProps) {
  if (!response.success) {
    return (
      <Card className="border-destructive shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div>
              <span className="font-semibold block">Error</span>
              <span className="text-sm">{response.error || "Failed to process query"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full max-w-full overflow-x-hidden">
      {/* Answer Section - Enhanced */}
      <Card className="shadow-sm border-primary/20 w-full max-w-full overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <CardTitle className="text-xl font-semibold truncate">Answer</CardTitle>
            <ConfidenceBadge confidence={response.confidence} showLabel />
          </div>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-semibold mb-3 mt-5 first:mt-0" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                em: ({node, ...props}) => <em className="italic" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 my-3" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 my-3" {...props} />,
                li: ({node, ...props}) => <li className="ml-4" {...props} />,
                p: ({node, ...props}) => <p className="mb-3 leading-7 text-foreground" {...props} />,
                code: ({node, className, ...props}: any) => {
                  const isInline = !className?.includes('language-')
                  return isInline ? (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                  ) : (
                    <code className="block bg-muted p-3 rounded text-sm font-mono overflow-x-auto" {...props} />
                  )
                },
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-4 border-primary/30 pl-4 italic my-3 text-muted-foreground" {...props} />
                ),
                a: ({node, ...props}) => (
                  <a className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer" {...props} />
                )
              }}
            >
              {response.answer}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Citations Section - Enhanced */}
      {response.citations && response.citations.length > 0 && (
        <Card className="shadow-sm w-full max-w-full overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary flex-shrink-0" />
              Sources
              <Badge variant="secondary" className="ml-2 flex-shrink-0">
                {response.citations.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {response.citations.map((citation, idx) => (
              <div 
                key={idx} 
                className="border rounded-lg p-6 space-y-4 bg-card hover:bg-accent/50 transition-colors w-full max-w-full overflow-hidden"
              >
                <div className="flex flex-col md:flex-row items-start justify-between gap-4 w-full min-w-0">
                  <div className="flex-1 space-y-4 min-w-0 w-full md:w-auto md:pr-4">
                    {/* Document Title */}
                    <div className="min-w-0">
                      <h4 className="font-semibold text-lg mb-3 leading-tight break-words overflow-wrap-anywhere">
                        {citation.document_title}
                      </h4>
                      {/* Metadata Row */}
                      <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                        <Badge 
                          variant="outline" 
                          className={`${getSourceTypeColor(citation.source_name)} text-xs flex-shrink-0`}
                        >
                          {citation.source_name || "Unknown Source"}
                        </Badge>
                        {citation.hierarchy_level && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            Level {citation.hierarchy_level}
                          </Badge>
                        )}
                        {citation.relevance_score !== undefined && (
                          <span className="text-sm font-medium whitespace-nowrap">
                            Relevance: {Math.round(citation.relevance_score * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Quote Section - Enhanced */}
                    {citation.quote && (
                      <div className="relative pl-5 border-l-4 border-primary/30 bg-muted/30 rounded-r-md py-4 min-w-0">
                        <Quote className="absolute -left-3 top-4 h-5 w-5 text-primary/40 flex-shrink-0" />
                        <blockquote className="text-base leading-relaxed text-foreground italic pl-6 break-words overflow-wrap-anywhere">
                          {citation.quote}
                        </blockquote>
                      </div>
                    )}

                    {/* Legal Citation - Without URL */}
                    <div className="pt-3 border-t border-border/50 min-w-0">
                      <p className="text-sm text-muted-foreground font-mono leading-relaxed break-words overflow-wrap-anywhere">
                        {buildCitation({
                          source_name: citation.source_name,
                          publishedAt: (citation as any).published_at,
                          documentId: citation.document_id
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons - Enhanced */}
                  <div className="flex flex-row md:flex-col gap-2 flex-shrink-0 w-full md:w-auto">
                    {onViewDocument && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDocument(citation.document_id)}
                        className="whitespace-nowrap"
                      >
                        <FileText className="h-4 w-4 mr-1.5" />
                        View Doc
                      </Button>
                    )}
                    {citation.source_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(citation.source_url, "_blank")}
                        className="whitespace-nowrap"
                      >
                        <ExternalLink className="h-4 w-4 mr-1.5" />
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
        <Card className="border-yellow-300 bg-yellow-50/80 dark:bg-yellow-900/30 shadow-sm w-full max-w-full overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              Unsupported Claims
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-base text-yellow-800 dark:text-yellow-200">
              {response.unsupported_claims.map((claim, idx) => (
                <li key={idx} className="leading-relaxed break-words overflow-wrap-anywhere">{claim}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Audit Trail Link (P2) */}
      {response.audit_trail_id && (
        <Card className="shadow-sm w-full max-w-full overflow-hidden">
          <CardContent className="p-5">
            <Button variant="outline" size="default" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              View Audit Trail
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

