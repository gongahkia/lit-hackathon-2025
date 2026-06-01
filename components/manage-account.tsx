import React, { useState } from "react";

interface ManageAccountProps {
  initialName: string;
  initialEmail: string;
}

export function ManageAccount({ initialName, initialEmail }: ManageAccountProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement real save logic here (e.g., API call)
    setSuccessMsg("Account info saved successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Manage Account</h2>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            type="text"
            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
        >
          Save
        </button>
      </form>

      {successMsg && (
        <p className="mt-4 text-green-600 dark:text-green-400 font-medium">{successMsg}</p>
      )}
    </div>
  );
}