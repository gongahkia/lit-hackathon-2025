"use client";
import React from "react";
import { Navigation } from "@/components/navigation";
import { ViewProgress } from "@/components/view-progress";

const sampleProgress = [
  {
    quizName: "Quiz 1 - Math Basics",
    score: 85,
    dateTaken: "2024-07-15T10:00:00Z",
  },
  {
    quizName: "Quiz 2 - Algebra",
    score: 92,
    dateTaken: "2024-07-22T10:00:00Z",
  },
];

export default function ViewProgressPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <Navigation />
      <main className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ViewProgress
          studentName="John Doe"
          studentEmail="john.doe@example.com"
          progressData={sampleProgress}
        />
      </main>
    </div>
  );
}