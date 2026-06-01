"use client";
import React from "react";
import { Navigation } from "@/components/navigation";
import { UploadMaterials } from "@/components/upload-materials";

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      <Navigation />
      <main className="py-10 max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <UploadMaterials />
      </main>
    </div>
  );
}
