"use client";
import React from "react";
import { useParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { ViewDetails } from "@/components/view-details";

// Mock quizzes data
const quizzes = [
  {
    id: "quiz-1",
    title: "Quiz 1 - Math Basics",
    description: "Basic math concepts quiz to reinforce understanding.",
    questions: [
      {
        question: "What is 2 + 2?",
        options: {
          a: "3",
          b: "4",
          c: "5",
          d: "22",
        },
        correct: "b",
        explanation: "2 + 2 = 4; this is an arithmetic addition example.",
      },
      // Add more questions here
    ],
  },
  {
    id: "quiz-2",
    title: "Quiz 2 - Algebra",
    description: "Foundational algebra knowledge assessment.",
    questions: [
      {
        question: "Solve for x: 2x = 10",
        options: {
          a: "3",
          b: "5",
          c: "10",
          d: "7",
        },
        correct: "b",
        explanation: "2x = 10 implies x = 10 / 2, so x = 5.",
      },
    ],
  },
];

export default function QuizDetailsPage() {
  const params = useParams();
  const quizId = params?.id;
  const quizInfo = quizzes.find((quiz) => quiz.id === quizId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <Navigation />
      <main className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {quizInfo ? (
          <ViewDetails
            quizTitle={quizInfo.title}
            quizDescription={quizInfo.description}
            questions={quizInfo.questions}
          />
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 text-center">
            <h2 className="text-xl text-red-600 dark:text-red-400 font-bold">Quiz not found!</h2>
          </div>
        )}
      </main>
    </div>
  );
}