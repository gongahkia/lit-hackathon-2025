"use client"

import { Search, Menu, Bell, HelpCircle } from "lucide-react"
import { useState } from "react"
import GhostIconButton from "../ui/GhostIconButton"
import { Input } from "../ui/input"

export default function Header({ activeView, setSidebarOpen, searchRef, onSearch }) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchQuery)
    }
  }

  const getViewTitle = (view) => {
    switch (view) {
      case "search":
        return "Parliamentary Search"
      case "document":
        return "Document Viewer"
      case "timeline":
        return "Policy Timeline"
      case "contradictions":
        return "Contradiction Detection"
      case "calculator":
        return "Calculator"
      case "admin":
        return "Admin Dashboard"
      default:
        return "Pofact"
    }
  }

  return (
    <div className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-card/80 px-4 py-3 backdrop-blur">
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden inline-flex items-center justify-center rounded-lg p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">{getViewTitle(activeView)}</h1>
      </div>

      {/*activeView === "search" && (
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder="Search parliamentary data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </form>
        </div>
      )*/}

      <div className="ml-auto flex items-center gap-2">
        <GhostIconButton label="Notifications">
          <Bell className="h-4 w-4" />
        </GhostIconButton>

        <GhostIconButton label="Help">
          <HelpCircle className="h-4 w-4" />
        </GhostIconButton>

        {activeView !== "search" && (
          <GhostIconButton label="Search" onClick={() => searchRef?.current?.focus()}>
            <Search className="h-4 w-4" />
          </GhostIconButton>
        )}
      </div>
    </div>
  )
}
