"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader2, FileText, Clock, AlertTriangle } from "lucide-react"
import GhostIconButton from "../ui/GhostIconButton"

export default function AIQueryPane({ onViewDocument, onViewTimeline, documents }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "assistant",
      content:
        "Hello! I'm your AI assistant for parliamentary data analysis. I can help you search through Hansard transcripts, ministerial statements, and policy documents. What would you like to know?",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleAIQuery = async (query) => {
    setIsLoading(true)

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: query,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Generate contextual response based on query content
    let response = ""
    let suggestions = []

    if (query.toLowerCase().includes("housing") || query.toLowerCase().includes("hdb")) {
      response =
        "Based on recent parliamentary statements, housing policy has been a key focus. I found several relevant documents discussing HDB policies, affordability measures, and supply targets."
      suggestions = [
        { type: "document", id: "doc-1", title: "Minister's Statement on Housing Supply 2024" },
        { type: "timeline", id: "housing", title: "Housing Policy Timeline" },
      ]
    } else if (query.toLowerCase().includes("budget") || query.toLowerCase().includes("finance")) {
      response =
        "I've analyzed the latest budget discussions and financial policy statements. Here are the key findings from ministerial speeches and parliamentary debates."
      suggestions = [
        { type: "document", id: "doc-2", title: "Budget 2024 Parliamentary Debate" },
        { type: "timeline", id: "finance", title: "Financial Policy Evolution" },
      ]
    } else if (query.toLowerCase().includes("contradiction") || query.toLowerCase().includes("conflict")) {
      response =
        "I've detected potential contradictions in policy statements. My analysis shows confidence scores and timeline comparisons for your review."
      suggestions = [{ type: "contradiction", id: "contra-1", title: "Policy Position Changes Detected" }]
    } else {
      response = `I've searched through ${documents.length} parliamentary documents and found relevant information about "${query}". Here are the most pertinent results with source attribution and verification status.`
      suggestions = [
        { type: "document", id: "doc-1", title: "Related Parliamentary Statement" },
        { type: "document", id: "doc-3", title: "Ministerial Press Release" },
      ]
    }

    const assistantMessage = {
      id: Date.now() + 1,
      type: "assistant",
      content: response,
      timestamp: new Date(),
      suggestions: suggestions,
    }

    setMessages((prev) => [...prev, assistantMessage])
    setIsLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const query = inputValue.trim()
    setInputValue("")
    await handleAIQuery(query)
  }

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === "document") {
      onViewDocument(suggestion.id)
    } else if (suggestion.type === "timeline") {
      onViewTimeline(suggestion.id)
    }
  }

  const exampleQueries = [
    "What did the Minister say about housing policy in 2024?",
    "Show me contradictions in budget statements",
    "Find recent parliamentary debates on healthcare",
    "Compare policy positions over time",
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">AI Parliamentary Assistant</h1>
            <p className="text-sm text-muted-foreground">
              Intelligent analysis of parliamentary data and policy documents
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card border border-border">
                {message.type === "user" ? (
                  <User className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Bot className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div className="prose prose-sm max-w-none text-foreground">
                  <p className="leading-relaxed">{message.content}</p>
                </div>

                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Suggested actions:</p>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          {suggestion.type === "document" && <FileText className="h-3 w-3" />}
                          {suggestion.type === "timeline" && <Clock className="h-3 w-3" />}
                          {suggestion.type === "contradiction" && <AlertTriangle className="h-3 w-3" />}
                          {suggestion.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">{message.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card border border-border">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analyzing parliamentary data...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Example queries (shown when no messages) */}
      {messages.length === 1 && (
        <div className="border-t border-border bg-card/30 px-6 py-4">
          <div className="mx-auto max-w-3xl">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Try asking:</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {exampleQueries.map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputValue(query)}
                  className="rounded-lg border border-border bg-card p-3 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  "{query}"
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-card/50 px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about parliamentary statements, policy changes, or contradictions..."
              className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={isLoading}
            />
            <GhostIconButton
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              label="Send message"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </GhostIconButton>
          </form>
        </div>
      </div>
    </div>
  )
}
