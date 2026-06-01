import React, { useState } from "react";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface ManageStudentsProps {
  initialStudents: Student[];
}

export function ManageStudents({ initialStudents }: ManageStudentsProps) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");

  const addStudent = () => {
    if (!newStudentName.trim() || !newStudentEmail.trim()) return;
    const newStudent = {
      id: Math.random().toString(36).substr(2, 9),
      name: newStudentName,
      email: newStudentEmail,
    };
    setStudents([...students, newStudent]);
    setNewStudentName("");
    setNewStudentEmail("");
  };

  const removeStudent = (id: string) => {
    setStudents(students.filter((s) => s.id !== id));
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Manage Students
      </h2>
      <div className="mb-6 flex flex-col sm:flex-row gap-4 max-w-xl">
        <input
          type="text"
          placeholder="Student Name"
          value={newStudentName}
          onChange={(e) => setNewStudentName(e.target.value)}
          className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <input
          type="email"
          placeholder="Student Email"
          value={newStudentEmail}
          onChange={(e) => setNewStudentEmail(e.target.value)}
          className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <button
          onClick={addStudent}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
        >
          Add Student
        </button>
      </div>

      {students.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 italic">No students added.</p>
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
                    <button
                      onClick={() => removeStudent(student.id)}
                      className="text-red-600 dark:text-red-400 hover:underline"
                    >
                      Remove
                    </button>
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