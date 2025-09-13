"use client"
import React, { useRef, useState } from "react"
import { Paperclip, Search, CheckCircle, Clock, User, ExternalLink, AlertCircle, Filter } from "lucide-react"

// --- Pofman bot SVG (minimal, replace with your brand asset as needed) ---
function PofmanIcon() {
  return (
    <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center shadow">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="Pofman bot">
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
  "Pofman is Preprocessing query text",
  "Pofman is Identifying root words and stems",
  "Pofman is Detecting key concepts",
  "Pofman is Running Named Entity Recognition (NER)",
  "Pofman is Classifying document domains",
  "Pofman is Generating language embeddings",
  "Pofman is Searching for matches in vector space",
  "Pofman is Ranking article relevance",
  "Pofman is Checking for contradictions",
  "Pofman is Synthesizing response and sources"
]

// Utility for delays
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

export default function AIAssistantSearch() {
  const [query, setQuery] = useState("")
  const [file, setFile] = useState(null)
  const [searchResults, setSearchResults] = useState([])
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
    setError(null)
    setThinkingStep(-1)
    setSearchQueryLabel(query)
    // Animate "thinking" sequence with ticks
    for (let i = 0; i < THINKING_STEPS.length; i++) {
      setThinkingStep(i)
      await delay(1600)     // Slower step for realism
    }
    // Backend search
    try {
      const formData = new FormData()
      formData.append("query", query)
      if (file) formData.append("file", file)
      const res = await fetch("http://localhost:5000/api/search", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Search failed.")
      const data = await res.json()
      setSearchResults((data.results || []).map((row, idx) => {
        let sourceType = "parliamentary"
        let newsSource = null
        let url = "#"
        const source = row.source || ""
        if (source.toLowerCase().includes("cna")) {
          sourceType = "news"
          newsSource = "CNA"
          url = row.url || "#"
        } else if (source.toLowerCase().includes("strait")) {
          sourceType = "news"
          newsSource = "Straits Times"
          url = row.url || "#"
        } else if (source.toLowerCase().includes("hansard")) {
          sourceType = "parliamentary"
          url = `https://sprs.parl.gov.sg/search/#/fullreport?sittingdate=${row.date}` || "#"
        }
        return {
          id: idx,
          title: row.policies ? row.policies.join(", ") : "",
          content: row.content,
          speaker: row.names ? row.names.join(", ") : "",
          publishedAt: row.date,
          sourceType,
          newsSource,
          verified: true,
          topics: row.policies || [],
          url,
          contradictions: []
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

  // Badge color for source type
  function getSourceTypeColor(type) {
    switch (type) {
      case "parliamentary":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "ministerial":
        return "bg-gray-100 text-gray-700 border-gray-200"
      case "news":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }
  // Format date
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-SG", {
      year: "numeric", month: "short", day: "numeric"
    })
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-150">
      <div className="w-full max-w-2xl p-8 rounded-xl shadow-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-8">
        {/* --- Pofman Bot Header --- */}
        <div className="flex flex-col items-center mb-2">
          <PofmanIcon />
          <div className="text-lg font-bold text-center tracking-tight">Pofman</div>
          <div className="text-xs text-zinc-400 font-medium mb-1">Semantic Deep Search Assistant</div>
        </div>

        {/* --- Search bar and attachment --- */}
        <form
          className="flex items-center space-x-3"
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
            className="flex-1 p-3 border rounded focus:outline-none text-base bg-zinc-100 dark:bg-zinc-800"
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

        {/* --- Search Results --- */}
        {!isSearching && searchResults.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-zinc-500">
                Found {searchResults.length} results for
                <span className="font-semibold ml-1">&quot;{searchQueryLabel}&quot;</span>
              </p>
              <button type="button" className="px-2 py-1 flex items-center gap-1 rounded border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800">
                <Filter className="h-3 w-3" />
                Filters
              </button>
            </div>
            {searchResults.map((result) => (
              <div key={result.id} className="rounded-lg border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-col flex-1">
                    <div className="text-lg font-semibold leading-tight mb-1">
                      {result.title || "Untitled"}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {result.speaker}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(result.publishedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded border text-xs capitalize font-medium ${getSourceTypeColor(result.sourceType)}`}>
                      {result.sourceType}
                    </span>
                    {/* News badges */}
                    {result.newsSource && (
                      <span className="px-2 py-0.5 rounded border text-xs bg-yellow-100 text-yellow-800 border-yellow-200">{result.newsSource}</span>
                    )}
                    {result.verified ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                    )}
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-3 text-zinc-800 dark:text-zinc-200">
                  {result.content && result.content.length > 220 ? result.content.substring(0, 220) + "..." : result.content}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {result.topics.slice(0, 3).map((topic, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 text-xs font-medium">{topic}</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {result.sourceType === "parliamentary" && (
                      <button className="px-2 py-1 rounded border border-zinc-200 text-xs bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-700 dark:hover:bg-zinc-800">View Timeline</button>
                    )}
                    <button
                      className="px-2 py-1 rounded text-indigo-700 dark:text-indigo-300 text-xs flex items-center gap-1 hover:underline"
                      onClick={() => window.open(result.url, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Document
                    </button>
                  </div>
                </div>
                {result.contradictions.length > 0 && (
                  <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800 flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                    <AlertCircle className="h-3 w-3" />
                    Potential contradictions detected
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* --- No Results or initial state --- */}
        {!isSearching && !error && query && searchResults.length === 0 && (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
            <div className="text-lg font-medium mb-1">No results found</div>
            <div className="text-zinc-500 mb-4">Try different terms or check for typos</div>
          </div>
        )}
        {!isSearching && !error && !query && searchResults.length === 0 && (
          <div className="text-center py-8">
            <Search className="h-14 w-14 text-zinc-200 mx-auto mb-4" />
            <div className="text-2xl font-bold mb-1">Welcome to Pofman AI Deep Search</div>
            <div className="text-zinc-500 max-w-md mx-auto">
              Search in-depth through parliamentary debates, press, or personal files using natural language.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}