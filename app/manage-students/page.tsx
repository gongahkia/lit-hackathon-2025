"use client";
import React from "react";
import { Navigation } from "@/components/navigation";
import { ManageStudents } from "@/components/manage-students";

const initialStudents = [
  { id: "1", name: "Alex Kim", email: "alex.kim@example.com" },
  { id: "2", name: "Stella Walton", email: "stella@example.com" },
  { id: "3", name: "Maria Ivanova", email: "maria.ivanova@example.com" },
];

export default function ManageStudentsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <Navigation />
      <main className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ManageStudents initialStudents={initialStudents} />
      </main>
    </div>
  );
}