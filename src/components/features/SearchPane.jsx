"use client"
import { useState, useRef } from "react"
import { Search, Filter, ExternalLink, Clock, User, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import TimelineView from "./TimelineView"
// Build search string for backend (now always indiscriminate q)
function buildSearchParams(query) {
  const params = new URLSearchParams()
  if (query) params.append("q", query)
  // If you later add backend filter support, append filter params here
  return params
}
export default function SearchPane({
  onViewTimeline
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
  // Unified search
  async function onSearch(query) {
    setIsSearching(true)
    setSearchQuery(query)
    try {
      const params = buildSearchParams(query)
      let url = `http://localhost:5000/api/search`
      if (params.toString()) url += `?${params}`
      const res = await fetch(url)
      const data = await res.json()
      setSearchResults(
        (data.results || []).map((row, idx) => {
          let sourceType = "parliamentary"
          let newsSource = null
          let url = "#" // <- declare here so it's in scope for the returned object

          const source = row.source || ""
          if (source.toLowerCase().includes("cna")) {
            sourceType = "news"
            newsSource = "CNA"
            url = row.url || "#"
          } else if (source.toLowerCase().includes("strait")) {
            sourceType = "news"
            newsSource = "Straits Times"
            url = row.url || "#"
          } else if (source.toLowerCase().includes("lawgazette")) {
            sourceType = "articles"
            newsSource = "Singapore Law Gazette"
            url = row.url || "#"
          } else if (source.toLowerCase().includes("hansard")) {
            sourceType = "parliamentary"
            url = `https://sprs.parl.gov.sg/search/#/fullreport?sittingdate=${row.date}` || "#" // or your hansard link if desired
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
            url, // always refers to the correct url after all if/else
            contradictions: []
          }
        })
      )

    } catch (err) {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }
  const handleFilterChange = (field, value) => {
    setFilters(prev => {
      const updated = { ...prev, [field]: value }
      // Optionally, you could re-filter here; currently, filters are frontend-only
      return updated
    })
  }
  const handleSearchForm = (e) => {
    e.preventDefault()
    const query = searchRef.current?.value || ""
    onSearch(query)
  }
  const getSourceTypeColor = (type) => {
    switch (type) {
      case "parliamentary":
        return "bg-primary/10 text-primary"
      case "ministerial":
        return "bg-secondary/10 text-secondary"
      case "news":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-SG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }
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
            {/* Quick Examples */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Trending:</span>
              {["housing policy", "covid-19", "tracetogether", "straitstimes", "cna", "hansard", "climate change", "GST increase"].map((example) => (
                <Button
                  key={example}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (searchRef.current) {
                      searchRef.current.value = example
                      onSearch(example)
                    }
                  }}
                  className="text-xs"
                >
                  <i>{example}</i>
                </Button>
              ))}
            </div>
          </div>
        </div>
        {/* Search Results */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            {isSearching && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-muted-foreground">Searching parliamentary data...</span>
              </div>
            )}
            {!isSearching && searchResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Found {searchResults.length} results for "{searchQuery}"
                  </p>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
                {searchResults.map((result) => (
                <Card key={result.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg leading-tight mb-2">{result.title}</CardTitle>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {result.speaker}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(result.publishedAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSourceTypeColor(result.sourceType)}>
                          {result.sourceType}
                        </Badge>
                        {/* Hansard badge for parliamentary */}
                        {result.sourceType === "parliamentary" && (
                          <Badge variant="outline" className="text-xs">Hansard</Badge>
                        )}
                        {/* CNA or Straits Times badge for news */}
                        {result.newsSource && (
                          <Badge variant="secondary" className="text-xs">{result.newsSource}</Badge>
                        )}
                        {result.verified ? (
                          <CheckCircle className="h-4 w-4 text-secondary" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm leading-relaxed mb-4 text-pretty">{result.content.substring(0, 200)}...</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {result.topics.slice(0, 3).map((topic) => (
                          <Badge key={topic} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {/* Only show View Timeline for parliamentary/hansard results */}
                        {result.sourceType === "parliamentary" && (
                          <Button variant="outline" size="sm" onClick={onViewTimeline}>
                            View Timeline
                          </Button>
                        )}
                        {/* Show correct URL for CNA/Straits Times, fallback to "#" for parliamentary */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(result.url, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Document
                      </Button>
                      </div>
                    </div>
                    {result.contradictions.length > 0 && (
                      <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                          <AlertCircle className="h-3 w-3" />
                          Potential contradictions detected
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
            {!isSearching && searchQuery && searchResults.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your search terms or check the spelling</p>
                <Button variant="outline" onClick={() => { searchRef.current.value = ""; onSearch(""); }}>
                  Clear Search
                </Button>
              </div>
            )}
            {!searchQuery && (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                <h2 className="text-xl font-semibold mb-3">Search Parliamentary Data</h2>
                <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Keyword search through parliamentary debates, ministerial statements, press releases, and verified government
                  communications with exact source attribution.
                </p>
              </div>
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
