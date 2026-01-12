"use client"

import { useState, useEffect } from "react"
import { Bell, Check, Info, AlertTriangle, FileText, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import { ScrollArea } from "./scroll-area"
import { Badge } from "./badge"
import { Separator } from "./separator"
import { formatDateShort } from "@/lib/formatters"

const STORAGE_KEY = 'notifications_v2'

const INITIAL_NOTIFICATIONS = [
  {
    id: "n1",
    type: "document",
    title: "New Budget 2026 Documents",
    message: "6 new documents from Parliament and news sources about Budget 2026 have been ingested and indexed.",
    time: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    read: false,
  },
  {
    id: "n2",
    type: "alert",
    title: "Source Update: TODAY",
    message: "TODAY has been successfully added to your sources. 156 documents are now available for search.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    read: false,
  },
  {
    id: "n3",
    type: "info",
    title: "Topic Updated: Education Policy",
    message: "2 new documents added to Education Policy topic. Total documents: 31.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    read: false,
  },
  {
    id: "n4",
    type: "document",
    title: "Evidence Bundle: Green Plan 2030 Progress Brief",
    message: "Your evidence bundle has been updated with 3 new citations from recent parliamentary statements.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
    read: true,
  },
  {
    id: "n5",
    type: "info",
    title: "Parliament Documents Synced",
    message: "Successfully ingested 12 documents from Parliament of Singapore sitting on 10 Jan 2026.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
  },
  {
    id: "n6",
    type: "alert",
    title: "High Confidence Match",
    message: "Found ministerial statement matching your query on Progressive Wage Model expansion (confidence: 98%).",
    time: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
    read: true,
  },
  {
    id: "n7",
    type: "document",
    title: "Matter Created: Budget 2026 Analysis",
    message: "New research matter created with 4 linked documents and 2 evidence items.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    read: true,
  },
  {
    id: "n8",
    type: "info",
    title: "Source Verification Complete",
    message: "All 9 sources have been verified and are actively syncing. Next update in 6 hours.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    read: true,
  }
]

export default function NotificationsPopover() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [open, setOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setNotifications(JSON.parse(saved))
      }
    } catch (e) {
      console.error("Failed to load notifications", e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save to localStorage whenever notifications change
  useEffect(() => {
    if (!isLoaded) return // Don't overwrite with initial state before loading
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
    } catch (e) {
      console.error("Failed to save notifications", e)
    }
  }, [notifications, isLoaded])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getIcon = (type) => {
    switch (type) {
      case "alert": return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "document": return <FileText className="h-4 w-4 text-blue-600" />
      default: return <Info className="h-4 w-4 text-zinc-600" />
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-1 ring-background" />
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-2">
          <h4 className="font-semibold leading-none tracking-tight">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-primary"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`relative flex items-start gap-3 p-4 transition-colors hover:bg-muted/50 ${!notification.read ? 'bg-muted/20' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notification.read ? 'bg-blue-600' : 'bg-transparent'}`} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium leading-none ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(notification.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
