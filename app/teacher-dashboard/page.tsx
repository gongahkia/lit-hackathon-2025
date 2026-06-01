"use client";

import React from "react";
import { Navigation } from "@/components/navigation";
import { TeacherDashboard } from "@/components/teacher-dashboard";

// Example data, you would fetch this from your backend
const students = [
  { name: "Stella Walton", email: "stella@example.com" },
  { name: "Alex Kim", email: "alex.kim@example.com" },
  { name: "Maria Ivanova", email: "maria.ivanova@example.com" },
];

export default function TeacherDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <Navigation />
      <main className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Teacher Dashboard
        </h1>
        <TeacherDashboard students={students} />
      </main>
    </div>
  );
}
