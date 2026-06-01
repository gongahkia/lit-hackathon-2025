"use client";
import React from "react";
import { Navigation } from "@/components/navigation";
import { ViewProgress } from "@/components/view-progress";
import { useParams } from "next/navigation";

const sampleProgress = [
  { quizName: "Quiz 1 - Math Basics", score: 85, dateTaken: "2024-07-15T10:00:00Z" },
  { quizName: "Quiz 2 - Algebra", score: 92, dateTaken: "2024-07-22T10:00:00Z" },
];

const students = [
  { name: "Alex Kim", email: "alex.kim@example.com" },
  { name: "Stella Walton", email: "stella@example.com" },
  { name: "Maria Ivanova", email: "maria.ivanova@example.com" },
];

export default function StudentProgressPage() {
  // useParams returns { email: 'alex.kim%40example.com' }
  const params = useParams();
  const decodedEmail = decodeURIComponent(params?.email as string);

  const student = students.find((s) => s.email === decodedEmail);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <Navigation />
      <main className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {student ? (
          <ViewProgress
            studentName={student.name}
            studentEmail={student.email}
            progressData={sampleProgress}
          />
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
            <h2 className="text-xl text-red-600 dark:text-red-400 font-bold">Student not found!</h2>
          </div>
        )}
      </main>
    </div>
  );
}
