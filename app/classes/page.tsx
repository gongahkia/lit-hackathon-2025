"use client";
import React from "react";
import { Navigation } from "@/components/navigation";
import { ShowClasses } from "@/components/show-classes";

const classes = [
  { id: "math-101", name: "Math 101", studentCount: 22 },
  { id: "algebra-1", name: "Algebra I", studentCount: 19 },
];

export default function ClassesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <Navigation />
      <main className="py-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ShowClasses classes={classes} />
      </main>
    </div>
  );
}