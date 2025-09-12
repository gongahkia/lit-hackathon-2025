"use client"

import { useState } from "react"
import {
  Settings,
  Plus,
  Play,
  Pause,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Activity,
  FileText,
} from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Switch } from "../ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Alert, AlertDescription } from "../ui/alert"
import { Progress } from "../ui/progress"

export default function AdminDashboard({ sources, setSources, documents }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [showAddSource, setShowAddSource] = useState(false)
  const [newSource, setNewSource] = useState({
    name: "",
    type: "parliamentary",
    url: "",
    fetchFrequency: "daily",
    active: true,
  })

  // Mock system metrics
  const systemMetrics = {
    totalSources: sources.length,
    activeSources: sources.filter((s) => s.status === "active").length,
    totalDocuments: documents.length,
    indexingLatency: "4.2s",
    queryLatency: "245ms",
    uptime: "99.8%",
    lastIngestion: "2024-01-15T11:30:00Z",
  }

  // Mock ingestion logs
  const ingestionLogs = [
    {
      id: "log-1",
      source: "hansard",
      status: "success",
      documentsProcessed: 12,
      timestamp: "2024-01-15T11:30:00Z",
      duration: "3.2s",
    },
    {
      id: "log-2",
      source: "mti-press",
      status: "success",
      documentsProcessed: 3,
      timestamp: "2024-01-15T10:45:00Z",
      duration: "1.8s",
    },
    {
      id: "log-3",
      source: "cna-news",
      status: "error",
      documentsProcessed: 0,
      timestamp: "2024-01-15T10:30:00Z",
      duration: "0.5s",
      error: "Rate limit exceeded",
    },
  ]

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-SG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "error":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleAddSource = () => {
    const source = {
      id: `source-${Date.now()}`,
      ...newSource,
      status: newSource.active ? "active" : "inactive",
      lastFetched: new Date().toISOString(),
      documentsCount: 0,
    }

    setSources((prev) => [...prev, source])
    setNewSource({
      name: "",
      type: "parliamentary",
      url: "",
      fetchFrequency: "daily",
      active: true,
    })
    setShowAddSource(false)
  }

  const triggerScrape = (sourceId) => {
    console.log(`Triggering scrape for source: ${sourceId}`)
    // Update source status to show it's being processed
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, status: "processing", lastFetched: new Date().toISOString() } : s)),
    )

    // Simulate processing
    setTimeout(() => {
      setSources((prev) =>
        prev.map((s) => (s.id === sourceId ? { ...s, status: "active", documentsCount: s.documentsCount + 5 } : s)),
      )
    }, 3000)
  }

  const toggleSourceStatus = (sourceId) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, status: s.status === "active" ? "inactive" : "active" } : s)),
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="ingestion">Ingestion</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* System Health */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Total Sources</span>
                  </div>
                  <p className="text-2xl font-bold">{systemMetrics.totalSources}</p>
                  <p className="text-xs text-muted-foreground">{systemMetrics.activeSources} active</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-secondary" />
                    <span className="text-sm font-medium">Documents</span>
                  </div>
                  <p className="text-2xl font-bold">{systemMetrics.totalDocuments.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">indexed</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Query Latency</span>
                  </div>
                  <p className="text-2xl font-bold">{systemMetrics.queryLatency}</p>
                  <p className="text-xs text-muted-foreground">p95</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Uptime</span>
                  </div>
                  <p className="text-2xl font-bold">{systemMetrics.uptime}</p>
                  <p className="text-xs text-muted-foreground">last 30 days</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Ingestion Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ingestionLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {log.status === "success" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{sources.find((s) => s.id === log.source)?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.status === "success" ? `${log.documentsProcessed} documents processed` : log.error}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{formatDate(log.timestamp)}</p>
                        <p className="text-xs text-muted-foreground">{log.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sources Tab */}
          <TabsContent value="sources" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Data Sources</h2>
              <Button onClick={() => setShowAddSource(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Source
              </Button>
            </div>

            {/* Add Source Form */}
            {showAddSource && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Source</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="source-name">Source Name</Label>
                      <Input
                        id="source-name"
                        placeholder="e.g., MOH Press Releases"
                        value={newSource.name}
                        onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="source-type">Source Type</Label>
                      <Select
                        value={newSource.type}
                        onValueChange={(value) => setNewSource({ ...newSource, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parliamentary">Parliamentary</SelectItem>
                          <SelectItem value="ministerial">Ministerial</SelectItem>
                          <SelectItem value="news">News Media</SelectItem>
                          <SelectItem value="social">Social Media</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="source-url">Source URL</Label>
                    <Input
                      id="source-url"
                      placeholder="https://..."
                      value={newSource.url}
                      onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fetch-frequency">Fetch Frequency</Label>
                      <Select
                        value={newSource.fetchFrequency}
                        onValueChange={(value) => setNewSource({ ...newSource, fetchFrequency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id="source-active"
                        checked={newSource.active}
                        onCheckedChange={(checked) => setNewSource({ ...newSource, active: checked })}
                      />
                      <Label htmlFor="source-active">Active</Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleAddSource} disabled={!newSource.name || !newSource.url}>
                      Add Source
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddSource(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sources List */}
            <div className="grid gap-4">
              {sources.map((source) => (
                <Card key={source.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{source.name}</h3>
                          <Badge className={getStatusColor(source.status)}>{source.status}</Badge>
                          <Badge variant="outline">{source.type}</Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">{source.url}</p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{source.documentsCount} documents</span>
                          <span>Last fetched: {formatDate(source.lastFetched)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => triggerScrape(source.id)}
                          disabled={source.status === "processing"}
                        >
                          {source.status === "processing" ? (
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Play className="h-3 w-3 mr-1" />
                          )}
                          {source.status === "processing" ? "Processing" : "Scrape Now"}
                        </Button>

                        <Button variant="ghost" size="sm" onClick={() => toggleSourceStatus(source.id)}>
                          {source.status === "active" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Ingestion Tab */}
          <TabsContent value="ingestion" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Ingestion Logs</h2>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="space-y-4">
              {ingestionLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {log.status === "success" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}

                        <div>
                          <h3 className="font-medium">{sources.find((s) => s.id === log.source)?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {log.status === "success"
                              ? `Successfully processed ${log.documentsProcessed} documents`
                              : `Failed: ${log.error}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-medium">{formatDate(log.timestamp)}</p>
                        <p className="text-xs text-muted-foreground">Duration: {log.duration}</p>
                      </div>
                    </div>

                    {log.status === "success" && (
                      <div className="mt-3">
                        <Progress value={100} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <h2 className="text-lg font-semibold">System Configuration</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Indexing Batch Size</Label>
                    <Input type="number" defaultValue="100" />
                  </div>

                  <div>
                    <Label>Query Timeout (ms)</Label>
                    <Input type="number" defaultValue="5000" />
                  </div>

                  <div>
                    <Label>Max Concurrent Scrapers</Label>
                    <Input type="number" defaultValue="5" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Model Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Contradiction Detection Threshold</Label>
                    <Input type="number" step="0.1" min="0" max="1" defaultValue="0.75" />
                  </div>

                  <div>
                    <Label>Embedding Model</Label>
                    <Select defaultValue="sentence-transformers">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sentence-transformers">Sentence Transformers</SelectItem>
                        <SelectItem value="openai-ada">OpenAI Ada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>NLI Model Confidence</Label>
                    <Input type="number" step="0.1" min="0" max="1" defaultValue="0.8" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Changes to system configuration require a restart to take effect. Please coordinate with the development
                team before making changes.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
