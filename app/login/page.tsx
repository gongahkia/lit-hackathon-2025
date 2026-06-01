"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

export default function LoginPage() {
  const [step, setStep] = useState<null | "student" | "teacher">(null);
  const [mode, setMode] = useState<"login" | "register">("login"); // Added mode toggle
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRoleSelect = (role: "student" | "teacher") => {
    setStep(role);
    setMode("login");
    setError("");
    setEmail("");
    setPassword("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect based on role
      if (step === "teacher") {
        router.push("/teacher-dashboard");
      } else {
        router.push("/student-dashboard");
      }
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setError("User not found. Would you like to register?");
        setMode("register");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else {
        setError("Login failed. Please try again.");
      }
      setLoggingIn(false);
    }
  };


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setError("");

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Redirect based on role
      if (step === "teacher") {
        router.push("/teacher-dashboard");
      } else {
        router.push("/student-dashboard");
      }
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email already in use. Please login.");
        setMode("login");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError("Registration failed. Please try again.");
      }
      setLoggingIn(false);
    }
  };


  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFF4E6" }}>
      <Navigation />
      <main className="py-24 flex items-center justify-center min-h-[60vh]">
        {!step ? (
          <div
            className="shadow-lg rounded-lg p-8 w-full max-w-md flex flex-col gap-6 items-center"
            style={{ backgroundColor: "#ffffffff" }}
          >
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: "#4E342E" }}
            >
              Login as
            </h2>
            <div className="flex gap-4 w-full">
              <button
                className="flex-1 font-semibold py-2 rounded transition-colors"
                style={{
                  backgroundColor: "#F4B6A7",
                  color: "#4E342E",
                  border: "2px solid #F4B6A7",
                }}
                onClick={() => handleRoleSelect("student")}
              >
                Student
              </button>
              <button
                className="flex-1 font-semibold py-2 rounded transition-colors"
                style={{
                  backgroundColor: "#D8BFA2",
                  color: "#4E342E",
                  border: "2px solid #D8BFA2",
                }}
                onClick={() => handleRoleSelect("teacher")}
              >
                Teacher
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={mode === "login" ? handleLogin : handleRegister}
            className="shadow-lg rounded-lg p-8 w-full max-w-md flex flex-col gap-4"
            style={{ backgroundColor: "#ffffffff" }}
          >
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: "#4E342E" }}
            >
              {step.charAt(0).toUpperCase() + step.slice(1)}{" "}
              {mode === "login" ? "Login" : "Register"}
            </h2>
            <input
              type="email"
              placeholder="Email"
              className="px-4 py-2 rounded border focus:outline-none"
              style={{
                backgroundColor: "#fff5ebff",
                color: "#8B6C53",
                borderColor: "#D8BFA2",
              }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loggingIn}
              autoFocus
            />
            <input
              type="password"
              placeholder="Password"
              className="px-4 py-2 rounded border focus:outline-none"
              style={{
                backgroundColor: "#fff5ebff",
                color: "#8B6C53",
                borderColor: "#D8BFA2",
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loggingIn}
            />
            {error && (
              <div className="text-sm" style={{ color: "#F4B6A7" }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              className="font-semibold py-2 rounded transition-colors"
              style={{
                backgroundColor: "#F4B6A7",
                color: "#4E342E",
                border: "2px solid #F4B6A7",
                opacity: loggingIn ? 0.7 : 1,
              }}
              disabled={loggingIn}
            >
              {loggingIn
                ? mode === "login"
                  ? "Logging in..."
                  : "Registering..."
                : mode === "login"
                ? "Login"
                : "Register"}
            </button>
            <button
              type="button"
              className="text-sm mt-2 underline"
              style={{ color: "#8B6C53" }}
              onClick={() =>
                setMode((prev) => (prev === "login" ? "register" : "login"))
              }
              disabled={loggingIn}
            >
              {mode === "login"
                ? "Don't have an account? Register here"
                : "Already have an account? Login here"}
            </button>
            <button
              type="button"
              className="text-sm mt-2 underline"
              style={{ color: "#8B6C53" }}
              onClick={() => {
                setStep(null);
                setMode("login");
                setError("");
                setEmail("");
                setPassword("");
              }}
              disabled={loggingIn}
            >
              Back
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
