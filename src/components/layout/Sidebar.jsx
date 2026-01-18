"use client"

import { motion, AnimatePresence } from "framer-motion"
import { PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react"
import { cls } from "@/lib/utils"
import ThemeToggle from "../ui/ThemeToggle"

export default function Sidebar({
  open,
  onClose,
  theme,
  setTheme,
  navigationItems,
  activeView,
  onViewChange,
  sources,
  topics,
  searchRef,
  sidebarCollapsed = false,
  setSidebarCollapsed = () => {},
}) {
  if (sidebarCollapsed) {
    return (
      <motion.aside
        /*initial={{ width: 320 }}
        animate={{ width: 64 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="z-50 flex h-full shrink-0 flex-col border-r border-border bg-sidebar-background"*/

        key="sidebar"
        initial={{ width: sidebarCollapsed ? 64 : 320 }}
        animate={{ width: sidebarCollapsed ? 64 : 320 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className={cls(
          "z-50 flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar-background",
          "fixed inset-y-0 left-0 md:static md:translate-x-0",
          sidebarCollapsed ? "w-16 md:w-20" : "w-64 md:w-80" // responsive widths
        )}

      >
        <div className="flex items-center justify-center border-b border-sidebar-border px-3 py-3">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="rounded-xl p-2 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            aria-label={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
            title={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 pt-4">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cls(
                "rounded-xl p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                activeView === item.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50",
              )}
              title={item.label}
            >
              <item.icon className="h-5 w-5" />
            </button>
          ))}
        </div>
      </motion.aside>
    )
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(open || typeof window !== "undefined") && (
          <motion.aside
            key="sidebar"
            initial={{ x: -340 }}
            animate={{ x: open ? 0 : 0 }}
            exit={{ x: -340 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className={cls(
              "z-50 flex h-full w-80 shrink-0 flex-col border-r border-sidebar-border bg-sidebar-background",
              "fixed inset-y-0 left-0 md:static md:translate-x-0",
            )}
          >
            <div className="flex items-center gap-2 border-b border-sidebar-border px-3 py-3">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <img src="/P.png" alt="Pofact Logo" className="h-8 w-8 object-contain" />
                </div>
                <div className="text-sm font-semibold tracking-tight"> {!sidebarCollapsed && "POfact"}</div>
              </div>
              <div className="ml-auto flex items-center gap-1">
              <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:block rounded-xl p-2 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                aria-label={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
                title={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
              </button>

                <button
                  onClick={onClose}
                  className="md:hidden rounded-xl p-2 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                  aria-label="Close sidebar"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-3">
              {/* Navigation items */}
              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={cls(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      activeView === item.id
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </nav>

            {/* Data Sources at bottom, just above Settings */}
            <div className="mt-auto mb-4 px-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {!sidebarCollapsed && "Data Sources"}
              </h3>
              <div className="space-y-3">
                {/* 1st Class Card */}
                <div className="rounded-lg bg-green-100 dark:bg-green-900/40 p-2">
                  <div className="mb-1 text-xs font-bold text-green-800 dark:text-green-200">Official Sources</div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 py-1 text-sm">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="truncate text-green-900 dark:text-green-100">Hansard</span>
                      <span className="ml-2 rounded-full bg-green-200 dark:bg-green-800 px-2 py-0.5 text-xs font-semibold text-green-800 dark:text-green-200">1st class</span>
                    </div>
                    <div className="flex items-center gap-2 py-1 text-sm">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="truncate text-green-900 dark:text-green-100">Law Gazette</span>
                      <span className="ml-2 rounded-full bg-green-200 dark:bg-green-800 px-2 py-0.5 text-xs font-semibold text-green-800 dark:text-green-200">1st class</span>
                    </div>
                  </div>
                </div>
                {/* 2nd Class Card */}
                <div className="rounded-lg bg-gray-100 dark:bg-gray-800/60 p-2">
                  <div className="mb-1 text-xs font-bold text-gray-800 dark:text-gray-200">News Outlets</div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 py-1 text-sm">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="truncate text-gray-900 dark:text-gray-100">Channel News Asia</span>
                      <span className="ml-2 rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-800 dark:text-gray-200">2nd class</span>
                    </div>
                    <div className="flex items-center gap-2 py-1 text-sm">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="truncate text-gray-900 dark:text-gray-100">Lian He Zao Bao</span>
                      <span className="ml-2 rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-800 dark:text-gray-200">2nd class</span>
                    </div>
                    <div className="flex items-center gap-2 py-1 text-sm">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="truncate text-gray-900 dark:text-gray-100">Straits Times</span>
                      <span className="ml-2 rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-800 dark:text-gray-200">2nd class</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto border-t border-sidebar-border px-3 py-3">
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
                </button>
                <div className="ml-auto">
                  <ThemeToggle theme={theme} setTheme={setTheme} />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-sidebar-accent/30 p-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  SG
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs text-muted-foreground"> {!sidebarCollapsed && "Brought to you by the POfact team"}</div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
