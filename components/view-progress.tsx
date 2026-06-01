import React from "react";

interface ProgressEntry {
  quizName: string;
  score: number; // out of 100
  dateTaken: string; // ISO date
}

interface ViewProgressProps {
  studentName: string;
  studentEmail: string;
  progressData: ProgressEntry[];
}

export function ViewProgress({
  studentName,
  studentEmail,
  progressData,
}: ViewProgressProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Progress for {studentName} ({studentEmail})
      </h2>

      {progressData.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 italic">No quiz attempts found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                <th className="p-3 text-left">Quiz Name</th>
                <th className="p-3 text-left">Score (%)</th>
                <th className="p-3 text-left">Date Taken</th>
              </tr>
            </thead>
            <tbody>
              {progressData.map((entry, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="p-3">{entry.quizName}</td>
                  <td className="p-3">{entry.score}</td>
                  <td className="p-3">{new Date(entry.dateTaken).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}