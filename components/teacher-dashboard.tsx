import React from "react";

interface Student {
  name: string;
  email: string;
}

interface TeacherDashboardProps {
  students: Student[];
}

export function TeacherDashboard({ students }: TeacherDashboardProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-8 bg-[#FFF4E6] p-6 min-h-screen">
      {/* Left Panel */}
      <aside className="w-full lg:w-1/3 rounded-xl shadow-md p-6 bg-[#F5E2C4] text-[#4E342E]">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Welcome, Teacher!</h2>
          <p className="text-sm">
            View student progress, manage accounts, upload materials, and monitor engagement.
          </p>
        </div>

        {/* Navigation */}
        <nav className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Dashboard Menu</h3>
          <ul className="space-y-2">
            {[
              { name: "Generate Quizzes", path: "/generate" },
              { name: "Generate Reports", path: "/generate-report" },
              { name: "Show Past Quizzes", path: "/past-quizzes" },
              { name: "Show Classes", path: "/classes" },
              { name: "Manage Students", path: "/manage-students" },
              { name: "Dashboard (Flagged Students)", path: "/teacher-dashboard", active: true },
            ].map(({ name, path, active }) => (
              <li key={name}>
                <a
                  href={path}
                  className={`block px-4 py-2 rounded transition font-medium ${
                    active
                      ? "bg-[#F4B6A7] text-[#4E342E] font-semibold"
                      : "bg-[#FFF4E6] hover:bg-[#F5E2C4] text-[#8B6C53]"
                  }`}
                >
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Quick Actions */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <a
              href="/accounts"
              className="block px-4 py-2 rounded bg-[#FFF4E6] hover:bg-[#F5E2C4] text-[#4E342E] font-medium transition"
            >
              Manage Accounts
            </a>
            <a
              href="/upload"
              className="block px-4 py-2 rounded bg-[#FFF4E6] hover:bg- [#F5E2C4]] text-[#4E342E] font-medium transition"
            >
              Upload Materials
            </a>
          </div>
        </div>

        {/* Overview Stats */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Overview</h3>
          <div className="flex gap-4">
            <div className="flex-1 bg-[#F4B6A7] rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-[#4E342E]">
                {students.length}
              </div>
              <div className="text-sm text-[#4E342E]">Students</div>
            </div>
            <div className="flex-1 bg-[#D8BFA2] rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-[#4E342E]">7</div>
              <div className="text-sm text-[#4E342E]">Active Classes</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <section className="flex-1 bg-white rounded-xl shadow-md p-6 text-[#4E342E]">
        <h3 className="text-xl font-bold mb-4">Students</h3>
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full table-auto">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#F5E2C4] text-[#4E342E]">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Flags</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 italic text-[#8B6C53]">
                    No students yet
                  </td>
                </tr>
              )}
              {students.map((student, idx) => {
                const flagged = student.email.toLowerCase().includes("flag");
                return (
                  <tr
                    key={idx}
                    className={`border-b ${
                      flagged ? "bg-[#F4B6A7]" : "bg-[#FFF4E6]"
                    } hover:bg-[#F5E2C4] transition`}
                  >
                    <td className="p-3">{student.name}</td>
                    <td className="p-3">{student.email}</td>
                    <td className="p-3 font-semibold">
                      {flagged ? (
                        <span className="text-[#8B6C53]">⚠️ Flagged</span>
                      ) : (
                        <span className="text-green-700">✓ OK</span>
                      )}
                    </td>
                    <td className="p-3">
                      <a
                        href={`/students/${encodeURIComponent(student.email)}`}
                        className="text-[#8B6C53] hover:underline font-medium"
                      >
                        View Progress
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}