import React, { useState, ChangeEvent, FormEvent } from "react";

export function UploadMaterials() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage("Please select a file before uploading.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      // Implement actual upload logic here
      // Example: Use fetch() or axios() to POST to backend upload API

      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate delay
      setMessage(`File "${selectedFile.name}" uploaded successfully!`);
      setSelectedFile(null);
    } catch (err) {
      setMessage("Error uploading file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Upload Materials</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="file"
          onChange={handleFileChange}
          className="block mb-4 w-full text-gray-900 dark:text-white"
          accept=".pdf,.txt,.docx,.doc,.pptx,.ppt,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.ico,.webp"
        />

        <button
          type="submit"
          className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold transition disabled:opacity-50"
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {message && <p className="mt-4 text-gray-700 dark:text-gray-300">{message}</p>}
    </div>
  );
}