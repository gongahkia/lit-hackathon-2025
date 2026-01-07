"use client"
import React, { useRef, useState } from "react"
import { Paperclip, Search, CheckCircle, Clock, User, ExternalLink, AlertCircle, Filter } from "lucide-react"
import { formatDateShort, getSourceTypeColor, truncateText, normalizeConfidence } from "@/lib/formatters"
import { ConfidenceBadge } from "../ui/ConfidenceBadge"
import { EmptyState } from "../ui/EmptyState"
import { LoadingState } from "../ui/LoadingState"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
// P2: Hierarchical RAG implementation
import { RAGResponseView } from "./RAGResponseView"
import { QueryResponse } from "@/lib/types/query"
// --- POFMan bot SVG (minimal, replace with your brand asset as needed) ---
function POFManIcon() {
  return (
    <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center shadow">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="POFMan bot">
        <circle cx="16" cy="16" r="16" fill="#F4F6FA" />
        <ellipse cx="11" cy="14" rx="3" ry="4" fill="#6565F1" />
        <ellipse cx="21" cy="14" rx="3" ry="4" fill="#6565F1" />
        <ellipse cx="11.5" cy="15" rx="1" ry="1.4" fill="#fff" />
        <ellipse cx="20.5" cy="15" rx="1" ry="1.4" fill="#fff" />
        <ellipse cx="16" cy="22" rx="5" ry="2" fill="#B3C5F8" />
      </svg>
    </div>
  )
}
// --- Extended and detailed thinking steps ---
const THINKING_STEPS = [
  "POFMan is preprocessing query text",
  "POFMan is identifying root words and stems",
  "POFMan is detecting key concepts",
  "POFMan is running Named Entity Recognition (NER)",
  "POFMan is classifying document domains",
  "POFMan is generating language embeddings",
  "POFMan is searching for matches in vector space",
  "POFMan is ranking article relevance",
  "POFMan is checking for contradictions",
  "POFMan is synthesizing response and sources"
]
// Utility for delays
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * AIQueryPane component for semantic search
 * @param {Object} props
 * @param {Function} [props.onViewDocument] - Callback when viewing a document
 * @param {Function} [props.onViewTimeline] - Callback when viewing a timeline
 * @param {Array} [props.documents] - Array of documents
 */
export default function AIQueryPane({ onViewDocument, onViewTimeline, documents = [] }) {
  const [query, setQuery] = useState("")
  const [file, setFile] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [ragResponse, setRagResponse] = useState(null) // P2: RAG responses with structured citations
  const [thinkingStep, setThinkingStep] = useState(-1)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState(null)
  const [searchQueryLabel, setSearchQueryLabel] = useState("")
  const fileInputRef = useRef(null)
  // File upload handler
  function handleFileChange(e) {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    } else {
      setFile(null)
    }
  }
  // Triggers file selection dialog
  function triggerFileInput() {
    fileInputRef.current?.click()
  }
  // Handles the main search sequence including thinking
  async function handleSearch(e) {
    e?.preventDefault()
    if (!query.trim() && !file) return
    setIsSearching(true)
    setSearchResults([])
    setRagResponse(null) // Clear previous RAG response
    setError(null)
    setThinkingStep(-1)
    setSearchQueryLabel(query)
    // Animate "thinking" sequence with ticks
    for (let i = 0; i < THINKING_STEPS.length; i++) {
      setThinkingStep(i)
      await delay(1600)
    }
    // P2: Try RAG API first, fallback to document search
    try {
      // Try RAG API (P2) - POST with structured query
      let res = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          options: {
            provider: "auto",
            max_results: 10,
            min_confidence: 0.7,
            enable_cross_verification: true,
            include_audit_trail: true
          }
        })
      })
      
      if (res.ok) {
        const ragData = await res.json()
        
        // Check if this is a RAG response (has answer field)
        if (ragData.answer !== undefined) {
          setRagResponse(ragData)
          // Also populate searchResults for backward compatibility
          if (ragData.citations && ragData.citations.length > 0) {
            setSearchResults(ragData.citations.map((citation, idx) => ({
              id: `${citation.document_id}-${idx}`,
              title: citation.document_title,
              content: citation.quote,
              speaker: "",
              role: "",
              publishedAt: citation.published_at || citation.date || null,
              sourceType: citation.source_name || "parliamentary",
              source_name: citation.source_name,
              newsSource: null,
              verified: true,
              topics: [],
              url: citation.source_url,
              contradictions: [],
              rank: idx + 1,
              confidence: normalizeConfidence(citation.relevance_score)
            })))
          }
          return
        }
      }
      
      // Fallback to document search (P1.2)
      const params = new URLSearchParams()
      params.append("q", query)
      let res2 = await fetch(`/api/documents?q=${encodeURIComponent(query)}`, {
        method: "GET",
      })
      let data = await res2.json()
      
      // If Supabase fails, try Flask API
      if (!data.success || !data.data) {
        res2 = await fetch(`/api/search?${params.toString()}`, {
        method: "GET",
      })
      if (!res2.ok) throw new Error("Search failed.")
        data = await res2.json()
      }
      
      // Transform results to consistent format
      const results = data.success && data.data ? data.data : (data.results || [])
      setSearchResults(results.map((row, idx) => {
        // Use Supabase fields directly if available, otherwise transform Flask format
        const sourceType = row.source_type || row.sourceType || "parliamentary"
        const newsSource = row.source_name && (row.source_name.includes("CNA") || row.source_name.includes("Straits")) 
          ? row.source_name 
          : null
        const url = row.url || (row.date && sourceType === "parliamentary" 
          ? `https://sprs.parl.gov.sg/search/#/fullreport?sittingdate=${row.date}` 
          : "#")
        
        return {
          id: row.id ? `${row.id}-${idx}` : `result-${idx}`,
          title: row.title || (row.policies ? row.policies.join(", ") : "Untitled"),
          content: row.content || "",
          speaker: row.speaker || (row.names ? row.names.join(", ") : ""),
          role: row.role || "",
          publishedAt: row.published_at || row.publishedAt || row.date || null,
          sourceType,
          source_name: row.source_name || newsSource,
          newsSource,
          verified: row.verified !== false,
          topics: row.topics || row.policies || [],
          url,
          contradictions: row.contradictions || [],
          rank: idx + 1,
          confidence: normalizeConfidence(row.confidence), // Normalized to 0-1 range
        }
      }))
    } catch (err) {
      setError(err.message || "Error occurred")
    } finally {
      setIsSearching(false)
      setThinkingStep(-1)
    }
  }
  // Allow Enter key to trigger search
  function handleInputKeyDown(e) {
    if (e.key === "Enter") handleSearch(e)
  }
  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-150">
    <div className={`w-full transition-all duration-300
      ${searchResults.length > 0 ? 'max-w-5xl' : 'max-w-2xl'}
      p-8 md:p-10 rounded-xl shadow-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-6`}>

        {/* --- POFMan Bot Header --- */}
        <div className="flex flex-col items-center mb-4">
          <POFManIcon />
          <div className="text-xl font-bold text-center tracking-tight mb-1">POFMan</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Semantic Deep Search Assistant</div>
        </div>
        {/* --- Search bar and attachment --- */}
        <form
          className="flex items-center space-x-3 mb-2"
          onSubmit={handleSearch}
        >
          <button
            onClick={triggerFileInput}
            type="button"
            className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800"
            aria-label="Attach File"
          >
            <Paperclip className="h-5 w-5" />
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              aria-label="File input"
            />
          </button>
          <input
            type="text"
            className="flex-1 p-4 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base bg-white dark:bg-zinc-800 transition-all"
            placeholder="Enter your search query…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={isSearching}
            autoFocus
          />
          <button
            type="submit"
            aria-label="Search"
            className="p-2 rounded bg-zinc-950 text-white dark:bg-zinc-700 dark:text-zinc-100 hover:bg-zinc-700 transition"
            disabled={isSearching}
          >
            <Search className="h-5 w-5" />
          </button>
        </form>
        {/* Show filename if attached */}
        {file &&
          <div className="text-sm text-zinc-600 dark:text-zinc-400">Attached: {file.name}</div>
        }
        {/* --- Thinking Progress Steps --- */}
        {isSearching && (
          <div className="flex flex-col gap-2 items-start min-h-[304px]">
            {THINKING_STEPS.map((step, idx) => {
              // Show completed steps with green tick
              if (idx < thinkingStep) {
                return (
                  <div key={idx} className="flex items-center font-medium text-emerald-600 transition-opacity duration-300">
                    <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
                    <span>{step}</span>
                  </div>
                )
              }
              // Current (active) step is visible, indigo color, with bouncing ellipsis
              if (idx === thinkingStep) {
                return (
                  <div key={idx} className="flex items-center font-semibold text-indigo-700 transition-opacity duration-300">
                    <span className="mr-2 w-4 h-4 rounded-full bg-indigo-700 inline-block"></span>
                    {step}
                    <span className="ml-2 animate-bounce text-xs">…</span>
                  </div>
                )
              }
              // Next step (the one that is about to come): show translucently
              if (idx === thinkingStep + 1) {
                return (
                  <div key={idx} className="flex items-center transition-opacity duration-300 opacity-30 text-zinc-500">
                    <span className="mr-2 w-4 h-4 rounded-full bg-zinc-300 inline-block"></span>
                    {step}
                  </div>
                )
              }
              // Hide all future steps until reveal
              return null
            })}
          </div>
        )}
        {/* --- Search Error --- */}
        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}
        {/* --- RAG Response (P2) - Future implementation --- */}
        {/* P2: RAG Response View - Hierarchical RAG implementation */}
        {!isSearching && ragResponse && (
          <RAGResponseView response={ragResponse} onViewDocument={onViewDocument} />
        )}

        {/* --- Search Results (Current implementation) --- */}
        {!isSearching && searchResults.length > 0 && (
          <div className="flex flex-col gap-5 max-h-[32rem] overflow-y-auto pr-2">
            <div className="flex items-center justify-between mb-1 sticky top-0 bg-white dark:bg-zinc-900 z-10 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Found <span className="font-bold text-primary">{searchResults.length}</span> result{searchResults.length === 1 ? '' : 's'} for
                <span className="font-semibold ml-1 text-zinc-900 dark:text-zinc-100">&quot;{searchQueryLabel}&quot;</span>
              </p>
              <button type="button" className="px-3 py-1.5 flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                <Filter className="h-3.5 w-3.5" />
                Filters
              </button>
            </div>
            {searchResults.map((result) => (
              <div 
                key={result.id} 
                className="group relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-300 overflow-hidden"
              >
                {/* Accent border on hover */}
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all duration-300 group-hover:w-1.5" />
                
                {/* Rank badge - Improved */}
                <div className="absolute left-[-1rem] top-5 bg-primary text-primary-foreground text-xs font-bold rounded-full h-9 w-9 flex items-center justify-center shadow-md border-3 border-background z-10">
                  {result.rank}
                </div>
                
                {/* Confidence badge - Top right */}
                <div className="absolute right-4 top-4 z-10">
                  <ConfidenceBadge confidence={result.confidence} className="text-xs shadow-sm" />
                </div>
                
                <div className="pl-8 pr-24 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${getSourceTypeColor(result.sourceType)} text-xs capitalize`} variant="outline">
                          {result.sourceType}
                        </Badge>
                        {result.newsSource && (
                          <Badge variant="secondary" className="text-xs">{result.newsSource}</Badge>
                        )}
                        {result.verified ? (
                          <Badge variant="outline" className="text-xs border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Unverified
                          </Badge>
                        )}
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-xl font-semibold leading-tight group-hover:text-primary transition-colors duration-200 mb-1">
                        {result.title || "Untitled"}
                      </h3>
                      
                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400 flex-wrap">
                        {result.speaker && (
                          <div className="flex items-center gap-1.5">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{result.speaker}</span>
                            {result.role && <span className="text-xs">({result.role})</span>}
                          </div>
                        )}
                        {result.publishedAt && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {formatDateShort(result.publishedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Content Preview */}
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 line-clamp-3">
                    {truncateText(result.content, 250)}
                  </p>
                  
                  {/* Topics */}
                  {(result.topics || []).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(result.topics || []).slice(0, 3).map((topic, i) => (
                        <Badge 
                          key={i} 
                          variant="outline"
                          className="text-xs bg-background hover:bg-accent transition-colors"
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Contradictions Alert */}
                  {(result.contradictions || []).length > 0 && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">Potential contradictions detected</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                    {onViewDocument && result.id ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onViewDocument(result.id)}
                        className="group/btn"
                      >
                        View Document
                        <ExternalLink className="h-3 w-3 ml-1.5 transition-transform group-hover/btn:translate-x-0.5" />
                      </Button>
                    ) : result.url ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(result.url, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3 mr-1.5" />
                        View Source
                      </Button>
                    ) : null}
                  </div>
                </div>
                
                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-primary/5 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
              </div>
            ))}
          </div>
        )}
        {/* --- No Results or initial state --- */}
        {!isSearching && !error && query && searchResults.length === 0 && (
          <EmptyState
            icon={Search}
            title="No results found"
            description="Try different terms or check for typos"
          />
        )}
        {!isSearching && !error && !query && searchResults.length === 0 && (
          <EmptyState
            icon={Search}
            title="Welcome to POFMan's Deep Search"
            description="Search in-depth through parliamentary debates, press, or personal files using natural language embeddings."
          />
        )}
      </div>
    </div>
  )
}
