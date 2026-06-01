"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GraduationCap, Menu, X } from "lucide-react"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white/80  backdrop-blur-md border-b border-gray-100  transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <img
              src="images/quizbatter.png"
              alt="QuizBatter Logo"
              className="h-13 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900   transition-colors"
            >
              Home
            </Link>
            <Link
              href="/generate"
              className="text-gray-600 hover:text-gray-900   transition-colors"
            >
              Generate Quiz
            </Link>
            <Link
              href="/about"
              className="text-gray-600 hover:text-gray-900   transition-colors"
            >
              About
            </Link>
            <Link
              href="/team"
              className="text-gray-600 hover:text-gray-900   transition-colors"
            >
              Team
            </Link>
            <Button
              asChild
              size="lg"
              className="text-white px-8 py-4 text-lg rounded-full"
              style={{ backgroundColor: "#4E342E" }}
            >
              <Link href="/login">Login</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100  bg-white ">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900   transition-colors"
              >
                Home
              </Link>
              <Link
                href="/generate"
                className="text-gray-600 hover:text-gray-900   transition-colors"
              >
                Generate Quiz
              </Link>
              <Link
                href="/about"
                className="text-gray-600 hover:text-gray-900   transition-colors"
              >
                About
              </Link>
              <Link
                href="/team"
                className="text-gray-600 hover:text-gray-900   transition-colors"
              >
                Team
              </Link>
              <Link
                href="/legal"
                className="text-gray-600 hover:text-gray-900   transition-colors"
              >
                Legal
              </Link>
              <ThemeToggle />
              <Button asChild className="bg-blue-600 hover:bg-blue-700 w-fit">
                <Link href="/generate">Get Started</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}