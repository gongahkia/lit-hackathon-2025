"use client"

import { useEffect, useRef, useState } from "react"
import { Search, Menu, Bot, Folder } from "lucide-react"
import Sidebar from "./layout/Sidebar"
import Header from "./layout/Header"
import SearchPane from "./features/SearchPane"
import DocumentViewer from "./features/DocumentViewer"
import TimelineView from "./features/TimelineView"
import ContradictionDetector from "./features/ContradictionDetector"
import AdminDashboard from "./features/AdminDashboard"
import AIQueryPane from "./features/AIQueryPane"
import EvidenceBundleView from "./features/EvidenceBundleView"
import OnboardingModal from "./features/OnboardingModal"
import GhostIconButton from "./ui/GhostIconButton"
import ThemeToggle from "./ui/ThemeToggle"

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
  const [sources, setSources] = useState([])
  const [documents, setDocuments] = useState([])
  const [topics, setTopics] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const searchRef = useRef(null)

  // Load data from API on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [sourcesRes, documentsRes, topicsRes] = await Promise.all([
          fetch('/api/sources'),
          fetch('/api/documents'),
          fetch('/api/topics')
        ])
        
        const [sourcesData, documentsData, topicsData] = await Promise.all([
          sourcesRes.json(),
          documentsRes.json(),
          topicsRes.json()
        ])
        
        if (sourcesData.success) setSources(sourcesData.data)
        if (documentsData.success) setDocuments(documentsData.data)
        if (topicsData.success) setTopics(topicsData.data)
        
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [])

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
  async function performSearch(query) {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setSearchQuery(query)

    try {
      const res = await fetch(`/api/documents?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      
      if (data.success && Array.isArray(data.data)) {
        setSearchResults(data.data.slice(0, 10))
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      // Fallback to client-side search
      const results = documents
        .filter(
          (doc) =>
            doc.title.toLowerCase().includes(query.toLowerCase()) ||
            doc.content.toLowerCase().includes(query.toLowerCase()) ||
            doc.speaker.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 10)
      setSearchResults(results)
    } finally {
      setIsSearching(false)
    }
  }

  async function viewDocument(docId) {
    // Try to find document in current documents array first
    let doc = documents.find((d) => d.id === docId)
    
    // If not found, fetch from API by ID
    if (!doc) {
      try {
        const res = await fetch(`/api/documents/${docId}`)
        const data = await res.json()
        if (data.success && data.data) {
          doc = data.data
        }
      } catch (error) {
        console.error("Error fetching document:", error)
      }
    }
    
    if (doc) {
    setSelectedDocument(doc)
    setActiveView("document")
    } else {
      console.error("Document not found:", docId)
      alert("Document not found. Please try searching again.")
    }
  }

  function viewTimeline(topicId) {
    const topic = topics.find((t) => t.id === topicId)
    setSelectedTopic(topic)
    setActiveView("timeline")
  }

  const navigationItems = [
    { id: "search", label: "Search", icon: Search },
    { id: "fact-checker", label: "POFMAn", icon: Bot },
    { id: "bundles", label: "Evidence Bundles", icon: Folder },
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
      <OnboardingModal />
      <div className="md:hidden sticky top-0 z-40 flex items-center gap-2 border-b border-border bg-card/80 px-3 py-2 backdrop-blur">
        <div className="ml-1 flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="inline-flex h-4 w-4 items-center justify-center text-primary">⚖</span>
          Pofact
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

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header
            activeView={activeView}
            setSidebarOpen={setSidebarOpen}
            searchRef={searchRef}
            onSearch={performSearch}
          />

          <div className="flex-1 overflow-auto p-4 md:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading data...</p>
                </div>
              </div>
            ) : activeView === "search" ? (
              <SearchPane onViewDocument={viewDocument} onViewTimeline={() => setActiveView("timeline")} />
            ) : activeView === "bundles" ? (
              <EvidenceBundleView />
            ) : null}

            {!isLoading && activeView === "fact-checker" && (
              <AIQueryPane onViewDocument={viewDocument} onViewTimeline={viewTimeline} documents={documents} />
            )}

            {!isLoading && activeView === "document" && (
              <DocumentViewer document={selectedDocument} onBack={() => setActiveView("search")} />
            )}

            {!isLoading && activeView === "timeline" && (
              <TimelineView
                topic={selectedTopic}
                documents={documents}
                onViewDocument={viewDocument}
                onBack={() => setActiveView("search")} // <-- this makes the back button return to search
              />
            )}

            {!isLoading && activeView === "contradictions" && (
              <ContradictionDetector documents={documents} onViewDocument={viewDocument} />
            )}

            {!isLoading && activeView === "admin" && (
              <AdminDashboard sources={sources} setSources={setSources} documents={documents} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
