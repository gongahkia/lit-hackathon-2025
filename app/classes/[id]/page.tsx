"use client";
import React from "react";
import { useParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { ViewClass } from "@/components/view-class";

// Mock class data
const classes = [
  {
    id: "math-101",
    name: "Math 101",
    description: "Introduction to basic mathematics concepts.",
    students: [
      { id: "1", name: "Alex Kim", email: "alex.kim@example.com" },
      { id: "2", name: "Maria Ivanova", email: "maria.ivanova@example.com" },
    ],
  },
  {
    id: "algebra-1",
    name: "Algebra I",
    description: "Fundamental Algebra topics and practice.",
    students: [
      { id: "3", name: "Stella Walton", email: "stella@example.com" },
    ],
  },
];

export default function ViewClassPage() {
  const params = useParams();
  const classId = params?.id;
  
  const classInfo = classes.find((cls) => cls.id === classId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <Navigation />
      <main className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {classInfo ? (
          <ViewClass
            className={classInfo.name}
            classDescription={classInfo.description}
            students={classInfo.students}
          />
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 text-center">
            <h2 className="text-xl text-red-600 dark:text-red-400 font-bold">Class not found!</h2>
          </div>
        )}
      </main>
    </div>
  );
}