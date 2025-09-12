"use client"

import { useState, useMemo } from "react"
import { AlertTriangle, Search, Clock, ArrowRight, CheckCircle, XCircle } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Alert, AlertDescription } from "../ui/alert"
import { Separator } from "../ui/separator"

export default function ContradictionDetector({ documents, onViewDocument }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [confidenceFilter, setConfidenceFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedContradiction, setSelectedContradiction] = useState(null)

  // Generate mock contradictions from documents
  const contradictions = useMemo(() => {
    if (!documents) return []

    // Find documents with contradictions
    const contradictoryDocs = documents.filter((doc) => doc.contradictions && doc.contradictions.length > 0)

    return contradictoryDocs.map((doc, index) => ({
      id: `contradiction-${index}`,
      primaryDocument: doc,
      conflictingDocuments: doc.contradictions.map((id) => documents.find((d) => d.id === id)).filter(Boolean),
      confidence: 0.75 + Math.random() * 0.2, // Mock confidence between 0.75-0.95
      detectedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: Math.random() > 0.7 ? "reviewed" : "pending",
      type: Math.random() > 0.5 ? "policy_change" : "factual_inconsistency",
      description: `Potential contradiction detected between statements about ${doc.topics[0]} policy`,
      reviewedBy: Math.random() > 0.5 ? "Policy Analyst" : null,
    }))
  }, [documents])

  const filteredContradictions = useMemo(() => {
    return contradictions.filter((contradiction) => {
      const matchesSearch =
        !searchQuery ||
        contradiction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contradiction.primaryDocument.title.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesConfidence =
        confidenceFilter === "all" ||
        (confidenceFilter === "high" && contradiction.confidence >= 0.8) ||
        (confidenceFilter === "medium" && contradiction.confidence >= 0.6 && contradiction.confidence < 0.8) ||
        (confidenceFilter === "low" && contradiction.confidence < 0.6)

      const matchesStatus = statusFilter === "all" || contradiction.status === statusFilter

      return matchesSearch && matchesConfidence && matchesStatus
    })
  }, [contradictions, searchQuery, confidenceFilter, statusFilter])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-SG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return "text-red-600 bg-red-50 border-red-200"
    if (confidence >= 0.6) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-blue-600 bg-blue-50 border-blue-200"
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "reviewed":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "dismissed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const markAsReviewed = (contradictionId, status) => {
    // Handle marking contradiction as reviewed/dismissed
    console.log(`Marking contradiction ${contradictionId} as ${status}`)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            <h1 className="text-2xl font-semibold">Contradiction Detection</h1>
          </div>

          <p className="text-muted-foreground mb-4">
            AI-powered detection of potential contradictions and policy changes across parliamentary statements and
            government communications.
          </p>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contradictions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Confidence</SelectItem>
                <SelectItem value="high">High (80%+)</SelectItem>
                <SelectItem value="medium">Medium (60-80%)</SelectItem>
                <SelectItem value="low">Low (&lt;60%)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Total Detected</span>
                </div>
                <p className="text-2xl font-bold mt-1">{contradictions.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Pending Review</span>
                </div>
                <p className="text-2xl font-bold mt-1">{contradictions.filter((c) => c.status === "pending").length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Reviewed</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {contradictions.filter((c) => c.status === "reviewed").length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">High Confidence</span>
                </div>
                <p className="text-2xl font-bold mt-1">{contradictions.filter((c) => c.confidence >= 0.8).length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Contradictions List */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium">Detected Contradictions ({filteredContradictions.length})</h3>

              {filteredContradictions.map((contradiction) => (
                <Card
                  key={contradiction.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedContradiction?.id === contradiction.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedContradiction(contradiction)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-base leading-tight mb-2">{contradiction.description}</CardTitle>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>Detected {formatDate(contradiction.detectedAt)}</span>
                          <Badge className={getConfidenceColor(contradiction.confidence)}>
                            {Math.round(contradiction.confidence * 100)}% confidence
                          </Badge>
                        </div>
                      </div>

                      <Badge className={getStatusColor(contradiction.status)}>{contradiction.status}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Primary Document
                        </label>
                        <p className="text-sm mt-1">{contradiction.primaryDocument.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {contradiction.primaryDocument.speaker} •{" "}
                          {formatDate(contradiction.primaryDocument.publishedAt)}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Conflicting Documents ({contradiction.conflictingDocuments.length})
                        </label>
                        {contradiction.conflictingDocuments.slice(0, 2).map((doc) => (
                          <div key={doc.id} className="text-sm mt-1">
                            <p>{doc.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.speaker} • {formatDate(doc.publishedAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredContradictions.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <h4 className="font-medium mb-2">No contradictions found</h4>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery
                        ? "Try adjusting your search terms or filters"
                        : "No contradictions detected in the current dataset"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Contradiction Details */}
            <div>
              {selectedContradiction ? (
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Contradiction Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className={getConfidenceColor(selectedContradiction.confidence)}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{Math.round(selectedContradiction.confidence * 100)}% confidence</strong> contradiction
                        detected between {selectedContradiction.conflictingDocuments.length + 1} documents
                      </AlertDescription>
                    </Alert>

                    <div>
                      <h4 className="font-medium mb-3">Document Comparison</h4>

                      {/* Primary Document */}
                      <div className="p-3 border rounded-lg mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">Primary</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDocument(selectedContradiction.primaryDocument.id)}
                          >
                            View Document
                          </Button>
                        </div>
                        <h5 className="font-medium text-sm mb-1">{selectedContradiction.primaryDocument.title}</h5>
                        <p className="text-xs text-muted-foreground mb-2">
                          {selectedContradiction.primaryDocument.speaker} •{" "}
                          {formatDate(selectedContradiction.primaryDocument.publishedAt)}
                        </p>
                        <p className="text-sm leading-relaxed">
                          {selectedContradiction.primaryDocument.content.substring(0, 200)}...
                        </p>
                      </div>

                      <div className="flex items-center justify-center py-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground ml-2">conflicts with</span>
                      </div>

                      {/* Conflicting Documents */}
                      {selectedContradiction.conflictingDocuments.map((doc) => (
                        <div key={doc.id} className="p-3 border rounded-lg mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="destructive">Conflicting</Badge>
                            <Button variant="ghost" size="sm" onClick={() => onViewDocument(doc.id)}>
                              View Document
                            </Button>
                          </div>
                          <h5 className="font-medium text-sm mb-1">{doc.title}</h5>
                          <p className="text-xs text-muted-foreground mb-2">
                            {doc.speaker} • {formatDate(doc.publishedAt)}
                          </p>
                          <p className="text-sm leading-relaxed">{doc.content.substring(0, 200)}...</p>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Type
                        </label>
                        <p className="text-sm mt-1 capitalize">{selectedContradiction.type.replace("_", " ")}</p>
                      </div>

                      {selectedContradiction.reviewedBy && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Reviewed By
                          </label>
                          <p className="text-sm mt-1">{selectedContradiction.reviewedBy}</p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {selectedContradiction.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => markAsReviewed(selectedContradiction.id, "reviewed")}>
                          Mark as Reviewed
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsReviewed(selectedContradiction.id, "dismissed")}
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="sticky top-6">
                  <CardContent className="p-6 text-center">
                    <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <h4 className="font-medium mb-2">Select a Contradiction</h4>
                    <p className="text-sm text-muted-foreground">
                      Click on any contradiction to view detailed analysis and comparison
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
