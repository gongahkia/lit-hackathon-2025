"use client"

import { useEffect, useRef, useState } from "react"
import { Search, Clock, AlertTriangle, Calculator, Settings, Menu, Bot } from "lucide-react"
import Sidebar from "./layout/Sidebar"
import Header from "./layout/Header"
import SearchPane from "./features/SearchPane"
import DocumentViewer from "./features/DocumentViewer"
import TimelineView from "./features/TimelineView"
import ContradictionDetector from "./features/ContradictionDetector"
import LABCalculator from "./features/LABCalculator"
import AdminDashboard from "./features/AdminDashboard"
import AIQueryPane from "./features/AIQueryPane"
import GhostIconButton from "./ui/GhostIconButton"
import ThemeToggle from "./ui/ThemeToggle"
import { INITIAL_SOURCES, INITIAL_DOCUMENTS, INITIAL_TOPICS } from "@/lib/mockData"

export default function MinLaw2Platform() {
  // Simplified theme management to prevent hydration issues
  const [theme, setTheme] = useState("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Apply theme after mount to prevent hydration mismatch
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)
  }, [])

  useEffect(() => {
    if (mounted) {
      document.documentElement.className = theme === "dark" ? "dark" : ""
      localStorage.setItem("theme", theme)
    }
  }, [theme, mounted])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState("search")
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState(null)

  // Data states
  const [sources, setSources] = useState(INITIAL_SOURCES)
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS)
  const [topics, setTopics] = useState(INITIAL_TOPICS)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  const searchRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [sidebarOpen])

  // Search functionality
  function performSearch(query) {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setSearchQuery(query)

    // Simulate search with mock data
    setTimeout(() => {
      const results = documents
        .filter(
          (doc) =>
            doc.title.toLowerCase().includes(query.toLowerCase()) ||
            doc.content.toLowerCase().includes(query.toLowerCase()) ||
            doc.speaker.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 10)

      setSearchResults(results)
      setIsSearching(false)
    }, 800)
  }

  function viewDocument(docId) {
    const doc = documents.find((d) => d.id === docId)
    setSelectedDocument(doc)
    setActiveView("document")
  }

  function viewTimeline(topicId) {
    const topic = topics.find((t) => t.id === topicId)
    setSelectedTopic(topic)
    setActiveView("timeline")
  }

  const navigationItems = [
    { id: "search", label: "Search", icon: Search },
    { id: "ai", label: "AI Assistant", icon: Bot },
    { id: "timeline", label: "Policy Timeline", icon: Clock },
    { id: "contradictions", label: "Contradictions", icon: AlertTriangle },
    { id: "calculator", label: "LAB Calculator", icon: Calculator },
    { id: "admin", label: "Admin", icon: Settings },
  ]

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="h-screen w-full bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <div className="mt-2 text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-background text-foreground">
      <div className="md:hidden sticky top-0 z-40 flex items-center gap-2 border-b border-border bg-card/80 px-3 py-2 backdrop-blur">
        <div className="ml-1 flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="inline-flex h-4 w-4 items-center justify-center text-primary">⚖</span>
          MinLaw 2
        </div>
        <div className="ml-auto flex items-center gap-2">
          <GhostIconButton label="Menu" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-4 w-4" />
          </GhostIconButton>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </div>

      <div className="mx-auto flex h-[calc(100vh-0px)] max-w-[1600px]">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          theme={theme}
          setTheme={setTheme}
          navigationItems={navigationItems}
          activeView={activeView}
          onViewChange={setActiveView}
          sources={sources}
          topics={topics}
          searchRef={searchRef}
        />

        <main className="relative flex min-w-0 flex-1 flex-col">
          <Header
            activeView={activeView}
            setSidebarOpen={setSidebarOpen}
            searchRef={searchRef}
            onSearch={performSearch}
          />

          <div className="flex-1 overflow-hidden">
            {activeView === "search" && (
              <SearchPane
                searchQuery={searchQuery}
                searchResults={searchResults}
                isSearching={isSearching}
                onSearch={performSearch}
                onViewDocument={viewDocument}
                onViewTimeline={viewTimeline}
                searchRef={searchRef}
              />
            )}

            {activeView === "ai" && (
              <AIQueryPane onViewDocument={viewDocument} onViewTimeline={viewTimeline} documents={documents} />
            )}

            {activeView === "document" && (
              <DocumentViewer document={selectedDocument} onBack={() => setActiveView("search")} />
            )}

            {activeView === "timeline" && (
              <TimelineView topic={selectedTopic} documents={documents} onViewDocument={viewDocument} />
            )}

            {activeView === "contradictions" && (
              <ContradictionDetector documents={documents} onViewDocument={viewDocument} />
            )}

            {activeView === "calculator" && <LABCalculator />}

            {activeView === "admin" && (
              <AdminDashboard sources={sources} setSources={setSources} documents={documents} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
