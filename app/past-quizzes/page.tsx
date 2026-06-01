"use client";
import React from "react";
import { Navigation } from "@/components/navigation";
import { ShowPastQuizzes } from "@/components/show-past-quizzes";

const quizzes = [
  { id: "quiz-1", title: "Quiz 1 - Math Basics", dateCreated: "2024-07-01", numberOfQuestions: 10 },
  { id: "quiz-2", title: "Quiz 2 - Algebra", dateCreated: "2024-07-10", numberOfQuestions: 12 },
];

export default function PastQuizzesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <Navigation />
      <main className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ShowPastQuizzes quizzes={quizzes} />
      </main>
    </div>
  );
}