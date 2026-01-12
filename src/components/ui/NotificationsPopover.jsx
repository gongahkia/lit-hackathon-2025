"use client"

import { useState } from "react"
import { Bell, Check, Info, AlertTriangle, FileText, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import { ScrollArea } from "./scroll-area"
import { Badge } from "./badge"
import { Separator } from "./separator"
import { formatDateShort } from "@/lib/formatters"

const INITIAL_NOTIFICATIONS = [
  {
    id: "n1",
    type: "alert",
    title: "New Contradiction Detected",
    message: "Potential conflict found between Ministry of Health statement and recent press release.",
    time: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    read: false,
  },
  {
    id: "n2",
    type: "info",
    title: "Database Updated",
    message: "Successfully ingested 15 new parliamentary documents from yesterday's sitting.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: false,
  },
  {
    id: "n3",
    type: "document",
    title: "Evidence Bundle Ready",
    message: "Your 'Healthcare Policy 2024' bundle has been generated and is ready for download.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
  },
  {
    id: "n4",
    type: "info",
    title: "System Maintenance",
    message: "Scheduled maintenance completed successfully. All systems operational.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    read: true,
  }
]

export default function NotificationsPopover() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [open, setOpen] = useState(false)

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
