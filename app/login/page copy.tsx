"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { LoginModal } from "@/components/login-modal";

export default function LoginPage() {
  const [showModal, setShowModal] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const router = useRouter();

  const handleLogin = (role: "student" | "teacher") => {
    console.log(`Login attempt as role: ${role}`);
    setLoggingIn(true);

    // Simulate login - replace with Firebase logic later
    setTimeout(() => {
      setShowModal(false);
      setLoggingIn(false);
      console.log(`Successfully logged in as ${role}`);
      router.push("/dashboard");
    }, 1200);
  };

  const handleClose = () => setShowModal(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 relative">
      <Navigation />
      <main className="py-24 flex items-center justify-center min-h-[60vh]">
        {loggingIn && (
          <div className="absolute z-50 flex items-center justify-center w-full h-full bg-black bg-opacity-70 text-white text-xl font-semibold rounded-lg">
            Logging you in...
          </div>
        )}
        {showModal && !loggingIn && (
          <LoginModal onLogin={handleLogin} onClose={handleClose} />
        )}
      </main>
    </div>
  );
}