"use client"
import { useState, useRef, useEffect } from "react"
import { Search, Filter, ExternalLink, Clock, User, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { formatDateShort, getSourceTypeColor, truncateText, normalizeConfidence } from "@/lib/formatters"
import { ConfidenceBadge } from "../ui/ConfidenceBadge"
import { EmptyState } from "../ui/EmptyState"
import { LoadingState } from "../ui/LoadingState"
import TimelineView from "./TimelineView"

// Build search params for backend, including filters (P1.2)
function buildSearchParams(query, filters) {
  const params = new URLSearchParams()
  if (query && query.trim()) params.append("q", query.trim())

  if (filters?.sourceType && filters.sourceType !== "all") {
    params.append("sourceType", filters.sourceType)
  }

  // Date range: map to from/to ISO dates
  if (filters?.dateRange && filters.dateRange !== "all") {
    const now = new Date()
    const to = now.toISOString().slice(0, 10)
    let from
    if (filters.dateRange === "week") {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      from = d.toISOString().slice(0, 10)
    } else if (filters.dateRange === "month") {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 1)
      from = d.toISOString().slice(0, 10)
    } else if (filters.dateRange === "year") {
      const d = new Date(now)
      d.setFullYear(d.getFullYear() - 1)
      from = d.toISOString().slice(0, 10)
    }
    if (from) {
      params.append("dateFrom", from)
      params.append("dateTo", to)
    }
  }

  if (filters?.speaker && filters.speaker !== "all") {
    params.append("speakerCategory", filters.speaker)
  }

  if (filters?.language && filters.language !== "all") {
    params.append("language", filters.language)
  }

  if (filters?.topicId) {
    params.append("topicId", filters.topicId)
  }

  return params
}
export default function SearchPane({
  onViewTimeline,
  onViewDocument
}) {
  const searchRef = useRef()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [filters, setFilters] = useState({
    sourceType: "all",
    dateRange: "all",
    speaker: "all",
    language: "all",
    topicId: "",
  })
  const [trendingTopics, setTrendingTopics] = useState([])
  const [topicsById, setTopicsById] = useState({})
  const [isLoadingTrending, setIsLoadingTrending] = useState(false)

  // Fetch trending topics on component mount
  useEffect(() => {
    const FALLBACK_TRENDING = [
      "housing",
      "GST",
      "COVID-19",
      "TraceTogether",
      "climate change",
      "healthcare",
      "education",
      "CPF",
    ]

    async function fetchTrendingTopics() {
      setIsLoadingTrending(true)
      try {
        const res = await fetch('/api/topics')
        const data = await res.json()
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const allTopics = data.data
          // Build lookup map for displaying topic names from IDs
          const byId = allTopics.reduce((acc, t) => {
            acc[t.id] = t
            return acc
          }, {})
          setTopicsById(byId)

          // Sort by documentCount (descending) or lastUpdated (recent), take top 8-10
          const sorted = [...allTopics]
            .sort((a, b) => {
              // Primary sort: documentCount (descending)
              if (b.documentCount !== a.documentCount) {
                return (b.documentCount || 0) - (a.documentCount || 0)
              }
              // Secondary sort: lastUpdated (recent first)
              const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0
              const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0
              return dateB - dateA
            })
            .slice(0, 10)
          setTrendingTopics(sorted)
        } else {
          // Supabase not populated yet - use fallback trending keywords
          setTrendingTopics(FALLBACK_TRENDING.map((name) => ({ id: null, name })))
        }
      } catch (err) {
        console.error("Error fetching trending topics:", err)
        setTrendingTopics(FALLBACK_TRENDING.map((name) => ({ id: null, name })))
      } finally {
        setIsLoadingTrending(false)
      }
    }
    fetchTrendingTopics()
  }, [])

  // Unified search using Supabase API with filters (P1.2)
  async function onSearch(query, overrideFilters) {
    setIsSearching(true)
    setSearchQuery(query)
    try {
      const activeFilters = overrideFilters || filters
      const params = buildSearchParams(query, activeFilters)
      let url = `/api/documents`
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const res = await fetch(url)
      const data = await res.json()
      
      const supabaseReturnedArray = data.success && Array.isArray(data.data)
      const supabaseHasResults = supabaseReturnedArray && data.data.length > 0

      if (supabaseHasResults || (supabaseReturnedArray && !query?.trim())) {
        // Supabase returned results (or this is a browse-with-filters call)
        setSearchResults(data.data)
        return
      }

      // If Supabase has no results and we're querying keywords (common when Supabase isn't populated yet),
      // fall back to Flask CSV search. Flask does not support topicId/language filters, so we only fall back
      // for plain keyword searches.
      const canFallbackToFlask = Boolean(query?.trim()) && !activeFilters.topicId
      if (!canFallbackToFlask) {
        setSearchResults([])
        return
      }

      let flaskUrl = `/api/search`
      const legacyParams = buildSearchParams(query, { sourceType: "all", dateRange: "all", speaker: "all", language: "all", topicId: "" })
      if (legacyParams.toString()) flaskUrl += `?${legacyParams.toString()}`
      const flaskRes = await fetch(flaskUrl)
      const flaskData = await flaskRes.json()
      
      // Transform Flask results to Document format
      setSearchResults(
        (flaskData.results || []).map((row, idx) => ({
          id: row.id || `flask-${idx}`,
          title: row.policies ? row.policies.join(", ") : row.title || "Untitled",
          content: row.content || "",
          speaker: row.names ? row.names.join(", ") : row.speaker || "",
          publishedAt: row.date || row.published_at || null,
          sourceType: row.source_type || "parliamentary",
          verified: true,
          topics: row.policies || [],
          url: row.url || "#",
          contradictions: [],
          source: row.source || "",
          confidence: normalizeConfidence(row.confidence),
          role: row.role || "",
          tags: row.tags || [],
          summary: row.summary || ""
        }))
      )
    } catch (err) {
      console.error("Search error:", err)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }
  const handleSearchForm = (e) => {
    e.preventDefault()
    const query = searchRef.current?.value || ""
    onSearch(query)
  }
  // Auto-apply filters when they change (P1.2 improvement)
  const handleFilterChange = (field, value) => {
    setFilters(prev => {
      const updated = { ...prev, [field]: value }
      const hasAnyFilter =
        updated.sourceType !== "all" ||
        updated.dateRange !== "all" ||
        updated.speaker !== "all" ||
        updated.language !== "all" ||
        Boolean(updated.topicId)

      // Re-run search with new filters if we have an active query or any active filter
      if (searchQuery || hasAnyFilter) {
        setTimeout(() => {
          onSearch(searchQuery, updated)
        }, 0)
      }
      return updated
    })
  }

  const activeTopicName = filters.topicId
    ? (topicsById?.[filters.topicId]?.name || filters.topicId)
    : ""
  const activeSearchLabel = searchQuery || activeTopicName
  const hasActiveSearch =
    Boolean(activeSearchLabel) ||
    filters.sourceType !== "all" ||
    filters.dateRange !== "all" ||
    filters.speaker !== "all" ||
    filters.language !== "all"

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        {/* Search Header */}
        <div className="border-b border-border bg-card/50 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-2">
              <h1 className="text-2xl font-semibold mb-1 text-balance">
                Trending Search
              </h1>
              <p className="text-sm text-muted-foreground">
                Browse popular topics and search through verified parliamentary documents, ministerial releases, and news sources
              </p>
            </div>
            <form onSubmit={handleSearchForm} className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input
                  ref={searchRef}
                  placeholder="Search by keyword, topic, speaker, or date... (Cmd+K)"
                  className="pl-10 h-12 text-base"
                  defaultValue={searchQuery}
                />
              </div>
              <Button type="submit" size="lg" className="px-6">
                Search
              </Button>
            </form>
            {/* Trending Topics */}
            {trendingTopics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Trending:</span>
                {trendingTopics.map((topic) => (
                  <Button
                    key={topic.id || topic.name}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const label = topic.name
                      // If topic has an ID, use topicId filter for accurate results.
                      if (topic.id) {
                        const updated = { ...filters, topicId: topic.id }
                        setFilters(updated)
                        if (searchRef.current) searchRef.current.value = ""
                        onSearch("", updated)
                        return
                      }
                      // Fallback topics (no ID): treat as keyword search
                      const updated = { ...filters, topicId: "" }
                      setFilters(updated)
                      if (searchRef.current) {
                        searchRef.current.value = label
                      }
                      onSearch(label, updated)
                    }}
                    className="text-xs"
                    disabled={isLoadingTrending}
                  >
                    <i>{topic.name}</i>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Search Results */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            {isSearching && (
              <LoadingState message="Searching parliamentary data..." />
            )}
            {!isSearching && searchResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">
                    Found <strong>{searchResults.length}</strong> result{searchResults.length === 1 ? "" : "s"}
                    {activeSearchLabel && <> for "{activeSearchLabel}"</>}
                    {(filters.sourceType !== "all" || filters.dateRange !== "all" || filters.speaker !== "all" || filters.language !== "all" || filters.topicId) && (
                      <span className="ml-2 text-xs">
                        (filtered: {filters.sourceType !== "all" && filters.sourceType}{" "}
                        {filters.dateRange !== "all" && filters.dateRange}{" "}
                        {filters.speaker !== "all" && filters.speaker}{" "}
                        {filters.language !== "all" && filters.language}{" "}
                        {filters.topicId && `topic:${activeTopicName}`})
                      </span>
                    )}
                  </p>
                </div>
                {searchResults.map((result) => (
                <Card 
                  key={result.id} 
                  className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-border bg-card"
                >
                  {/* Accent border on hover */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all duration-300 group-hover:w-1.5" />
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        {/* Badges row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getSourceTypeColor(result.sourceType)} variant="outline">
                            {result.sourceType || "parliamentary"}
                          </Badge>
                          {result.source_name && (
                            <Badge variant="secondary" className="text-xs">{result.source_name}</Badge>
                          )}
                          {result.language && result.language !== "en" && (
                            <Badge variant="outline" className="text-xs">
                              {result.language === "zh" ? "中文" : String(result.language).toUpperCase()}
                            </Badge>
                          )}
                          {result.confidence !== undefined && (
                            <ConfidenceBadge confidence={result.confidence} className="text-xs" />
                          )}
                          {result.verified ? (
                            <Badge variant="outline" className="text-xs border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Unverified
                            </Badge>
                          )}
                        </div>
                        
                        {/* Title */}
                        <CardTitle className="text-xl font-semibold leading-tight group-hover:text-primary transition-colors duration-200">
                          {result.title}
                        </CardTitle>
                        
                        {/* Metadata */}
                        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
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
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-4">
                    {/* Content Preview */}
                    <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                      {truncateText(result.content, 200)}
                    </p>
                    
                    {/* Topics Section */}
                    {(result.topics || []).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Related Topics
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(result.topics || []).slice(0, 4).map((topic, idx) => (
                            <Badge 
                              key={idx} 
                              variant="outline"
                              className="text-xs bg-background hover:bg-accent transition-colors cursor-pointer"
                              onClick={() => {
                                // If the topic looks like a topic ID (topic-*), filter by topicId.
                                // Otherwise (e.g., Flask policies are names), fall back to keyword search.
                                const isTopicId = typeof topic === "string" && topic.startsWith("topic-")
                                if (isTopicId) {
                                  const updated = { ...filters, topicId: topic }
                                  setFilters(updated)
                                  onSearch(searchQuery, updated)
                                } else {
                                  const updated = { ...filters, topicId: "" }
                                  setFilters(updated)
                                  if (searchRef.current) searchRef.current.value = topic
                                  onSearch(topic, updated)
                                }
                              }}
                            >
                              {topicsById?.[topic]?.name || topic}
                            </Badge>
                          ))}
                        </div>
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
                    
                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border">
                      <div className="flex gap-2">
                        {result.sourceType === "parliamentary" && onViewTimeline && (
                          <Button variant="outline" size="sm" onClick={onViewTimeline}>
                            View Timeline
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {onViewDocument ? (
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
                  </CardContent>
                  
                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-primary/5 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
                </Card>
              ))}
              </div>
            )}
            {!isSearching && hasActiveSearch && searchResults.length === 0 && (
              <EmptyState
                icon={Search}
                title="No results found"
                description="Try adjusting your search terms or check the spelling"
                action={{
                  label: "Clear Search",
                  onClick: () => {
                    if (searchRef.current) {
                      searchRef.current.value = ""
                      const reset = {
                        sourceType: "all",
                        dateRange: "all",
                        speaker: "all",
                        language: "all",
                        topicId: "",
                      }
                      setFilters(reset)
                      onSearch("", reset)
                    }
                  }
                }}
              />
            )}
            {!hasActiveSearch && (
              <EmptyState
                icon={Search}
                title="Search Parliamentary Data"
                description="Keyword search through parliamentary debates, ministerial statements, press releases, and verified government communications with exact source attribution."
              />
            )}
          </div>
        </div>
      </div>
      {/* Sidebar Filters */}
      <div className="w-80 border-l border-border bg-card/30 p-4 hidden lg:block">
        <h3 className="font-medium mb-4">Refine Search</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Source Type</label>
            <Select value={filters.sourceType} onValueChange={(value) => handleFilterChange("sourceType", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="parliamentary">Parliamentary</SelectItem>
                <SelectItem value="ministerial">Ministerial</SelectItem>
                <SelectItem value="news">News Media</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange("dateRange", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Past Week</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
                <SelectItem value="year">Past Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Speaker</label>
            <Select value={filters.speaker} onValueChange={(value) => handleFilterChange("speaker", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Speakers</SelectItem>
                <SelectItem value="ministers">Ministers Only</SelectItem>
                <SelectItem value="mps">MPs Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Language</label>
            <Select value={filters.language} onValueChange={(value) => handleFilterChange("language", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh">Chinese (中文)</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
