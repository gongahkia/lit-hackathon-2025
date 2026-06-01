"use client"

import React, { useState } from "react"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { Navigation } from "@/components/navigation"
import { LoginModal } from "@/components/login-modal";

export default function HomePage() {
  const [showLogin, setShowLogin] = useState(false);

  function handleLogin(role: "student" | "teacher") {
    setShowLogin(false);
    // Here you can redirect based on role, e.g.:
    if (role === "student") {
      window.location.href = "/student/workspace";
    } else {
      window.location.href = "/teacher/workspace";
    }
  }
  return (
    <div className="min-h-screen bg-white ">
      <Navigation />
      <main>
        <HeroSection />
        <FeaturesSection />
      </main>


      {/* Show modal if showLogin is true */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
}