// components/show-classes.tsx
import React from "react";

interface ClassEntry {
  id: string;
  name: string;
  studentCount: number;
}

interface ShowClassesProps {
  classes: ClassEntry[];
}

export function ShowClasses({ classes }: ShowClassesProps) {
  return (
    <div className="rounded-2xl shadow-md p-6 max-w-4xl mx-auto bg-[#FFF4E6]">
      <h2 className="text-2xl font-bold mb-4 text-[#4E342E]">Classes</h2>
      {classes.length === 0 ? (
        <p className="italic text-[#8B6C53]">No classes found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead className="sticky top-0 z-10 bg-[#FFD7A5]">
              <tr>
                <th className="p-3 text-left font-semibold text-[#4E342E]">Class Name</th>
                <th className="p-3 text-left font-semibold text-[#4E342E]">Students Enrolled</th>
                <th className="p-3 text-left font-semibold text-[#4E342E]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr
                  key={cls.id}
                  className="border-b border-[#D8BFA2] hover:bg-[#FFD7A5]/40 transition"
                >
                  <td className="p-3 text-[#8B6C53]">{cls.name}</td>
                  <td className="p-3 text-[#8B6C53]">{cls.studentCount}</td>
                  <td className="p-3">
                    <a
                      href={`/classes/${cls.id}`}
                      className="text-[#4E342E] hover:underline"
                    >
                      View Class
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