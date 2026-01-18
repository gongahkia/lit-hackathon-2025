"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import { Checkbox } from "../ui/checkbox"
import { Search, Clock, Bot, Folder, FileText, ArrowRight, X } from "lucide-react"

const STEPS = [
  {
    title: "Welcome to POfact",
    description: "Your AI-powered platform for searching, verifying, and analyzing parliamentary data and government communications.",
    icon: <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary text-3xl">⚖</div>,
    content: (
      <div className="space-y-2 text-sm text-muted-foreground text-center">
        <p>Access thousands of verified parliamentary statements, press releases, and news articles in one place.</p>
        <p>Use AI to detect contradictions, build timelines, and verify facts instantly.</p>
      </div>
    )
  },
  {
    title: "Smart Search & Filters",
    description: "Find exactly what you need with semantic search and precise filtering.",
    icon: <Search className="h-16 w-16 text-blue-500 mb-4" />,
    content: (
      <ul className="space-y-2 text-sm text-left list-disc pl-4 text-muted-foreground">
        <li>Search by keyword, speaker, or topic</li>
        <li>Filter by source type (Parliament, News, Ministry)</li>
        <li>Instantly see source verification status</li>
      </ul>
    )
  },
  {
    title: "POFMan AI Assistant",
    description: "Ask complex questions and get cited answers from the knowledge base.",
    icon: <Bot className="h-16 w-16 text-indigo-500 mb-4" />,
    content: (
      <ul className="space-y-2 text-sm text-left list-disc pl-4 text-muted-foreground">
        <li>"What is the government's stance on EV subsidies?"</li>
        <li>"Find contradictions in statements about housing grants."</li>
        <li>All answers include direct citations to original documents.</li>
      </ul>
    )
  },
  {
    title: "Evidence Bundles",
    description: "Curate and export verified information for your reports.",
    icon: <Folder className="h-16 w-16 text-amber-500 mb-4" />,
    content: (
      <ul className="space-y-2 text-sm text-left list-disc pl-4 text-muted-foreground">
        <li>Select text from any document to add to a bundle</li>
        <li>Organize evidence by matter or case</li>
        <li>Export professionally formatted PDF reports</li>
      </ul>
    )
  }
]

export default function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    // Check local storage to see if user has already completed onboarding
    const hasSeenOnboarding = localStorage.getItem("pofact-onboarding-completed")
    if (!hasSeenOnboarding) {
      // Small delay for better UX
      const timer = setTimeout(() => setOpen(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      handleClose()
    }
  }

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem("pofact-onboarding-completed", "true")
    }
    setOpen(false)
  }

  const currentStep = STEPS[step]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <div className="p-6 flex flex-col items-center text-center pt-10 pb-6">
          {currentStep.icon}
          
          <DialogTitle className="text-2xl font-bold mb-2">
            {currentStep.title}
          </DialogTitle>
          
          <DialogDescription className="text-base mb-6">
            {currentStep.description}
          </DialogDescription>
          
          <div className="w-full bg-muted/50 p-4 rounded-lg mb-4">
            {currentStep.content}
          </div>

          {/* Progress Indicators */}
          <div className="flex gap-2 mt-4">
            {STEPS.map((_, i) => (
              <div 
                key={i} 
                className={`h-2 w-2 rounded-full transition-colors ${i === step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </div>

        <div className="bg-muted/30 p-4 flex items-center justify-between border-t border-border">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="dont-show" 
              checked={dontShowAgain}
              onCheckedChange={setDontShowAgain}
            />
            <label
              htmlFor="dont-show"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
            >
              Don't show again
            </label>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Skip
            </Button>
            <Button onClick={handleNext}>
              {step === STEPS.length - 1 ? "Get Started" : "Next"}
              {step !== STEPS.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
