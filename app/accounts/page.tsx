"use client";
import React from "react";
import { Navigation } from "@/components/navigation";
import { ManageAccount } from "@/components/manage-account";

// Mock teacher info
const teacherInfo = {
  name: "Dr. Sarah Chen",
  email: "sarah.chen@example.com",
};

export default function ManageAccountPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <Navigation />
      <main className="py-10 max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <ManageAccount initialName={teacherInfo.name} initialEmail={teacherInfo.email} />
      </main>
    </div>
  );
}