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
  })
  const [trendingTopics, setTrendingTopics] = useState([])
  const [isLoadingTrending, setIsLoadingTrending] = useState(false)

  // Fetch trending topics on component mount
  useEffect(() => {
    async function fetchTrendingTopics() {
      setIsLoadingTrending(true)
      try {
        const res = await fetch('/api/topics')
        const data = await res.json()
        if (data.success && data.data) {
          // Sort by documentCount (descending) or lastUpdated (recent), take top 8-10
          const sorted = data.data
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
            .map(topic => topic.name)
          setTrendingTopics(sorted)
        }
      } catch (err) {
        console.error("Error fetching trending topics:", err)
        // Fallback to empty array on error
        setTrendingTopics([])
      } finally {
        setIsLoadingTrending(false)
      }
    }
    fetchTrendingTopics()
  }, [])

  // Unified search using Supabase API with filters (P1.2)
  async function onSearch(query) {
    setIsSearching(true)
    setSearchQuery(query)
    try {
      const params = buildSearchParams(query, filters)
      let url = `/api/documents`
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const res = await fetch(url)
      const data = await res.json()
      
      if (data.success && data.data) {
        // Results are already in the correct Document format from Supabase
        setSearchResults(data.data)
      } else {
        // Fallback: try Flask API if Supabase fails
        let flaskUrl = `/api/search`
        const legacyParams = buildSearchParams(query, { sourceType: "all", dateRange: "all", speaker: "all" })
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
      }
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
      // Re-run search with new filters if we have a query
      if (searchQuery) {
        setTimeout(() => {
          onSearch(searchQuery)
        }, 0)
      }
      return updated
    })
  }
  // Fetch trending topics on mount
  useEffect(() => {
    const fetchTrendingTopics = async () => {
      setIsLoadingTrending(true)
      try {
        const res = await fetch("/api/topics")
        const data = await res.json()
        if (data.success && data.data) {
          // Sort by documentCount (descending) and take top 8-10
          const sorted = [...data.data]
            .sort((a, b) => (b.documentCount || 0) - (a.documentCount || 0))
            .slice(0, 10)
            .map(topic => topic.name)
          setTrendingTopics(sorted)
        }
      } catch (err) {
        console.error("Error fetching trending topics:", err)
        // Fallback to empty array on error
        setTrendingTopics([])
      } finally {
        setIsLoadingTrending(false)
      }
    }
    fetchTrendingTopics()
  }, [])
  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        {/* Search Header */}
        <div className="border-b border-border bg-card/50 p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4 text-balance">
              Search Verified Sources
            </h1>
            <form onSubmit={handleSearchForm} className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input
                  ref={searchRef}
                  placeholder="Search for policies, statements, or speakers... (Cmd+K)"
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
                    key={topic}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (searchRef.current) {
                        searchRef.current.value = topic
                        onSearch(topic)
                      }
                    }}
                    className="text-xs"
                    disabled={isLoadingTrending}
                  >
                    <i>{topic}</i>
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
                    Found <strong>{searchResults.length}</strong> result{searchResults.length === 1 ? "" : "s"} for "{searchQuery}"
                    {(filters.sourceType !== "all" || filters.dateRange !== "all" || filters.speaker !== "all") && (
                      <span className="ml-2 text-xs">
                        (filtered: {filters.sourceType !== "all" && filters.sourceType}{" "}
                        {filters.dateRange !== "all" && filters.dateRange}{" "}
                        {filters.speaker !== "all" && filters.speaker})
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
                            >
                              {topic}
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
            {!isSearching && searchQuery && searchResults.length === 0 && (
              <EmptyState
                icon={Search}
                title="No results found"
                description="Try adjusting your search terms or check the spelling"
                action={{
                  label: "Clear Search",
                  onClick: () => {
                    if (searchRef.current) {
                      searchRef.current.value = ""
                      onSearch("")
                    }
                  }
                }}
              />
            )}
            {!searchQuery && (
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
        </div>
      </div>
    </div>
  )
}
