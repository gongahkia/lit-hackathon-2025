import React from "react";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface ViewClassProps {
  className: string;
  classDescription?: string;
  students: Student[];
}

export function ViewClass({ className, classDescription, students }: ViewClassProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{className}</h2>
      {classDescription && (
        <p className="text-gray-700 dark:text-gray-300 mb-6">{classDescription}</p>
      )}

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Enrolled Students</h3>
      {students.length === 0 ? (
        <p className="italic text-gray-600 dark:text-gray-400">No students enrolled in this class.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="p-3">{student.name}</td>
                  <td className="p-3">{student.email}</td>
                  <td className="p-3">
                    <a
                      href={`/students/${encodeURIComponent(student.email)}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Progress
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}