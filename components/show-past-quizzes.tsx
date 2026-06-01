// components/show-past-quizzes.tsx
import React from "react";

interface Quiz {
  id: string;
  title: string;
  dateCreated: string; // ISO string
  numberOfQuestions: number;
}

interface ShowPastQuizzesProps {
  quizzes: Quiz[];
}

export function ShowPastQuizzes({ quizzes }: ShowPastQuizzesProps) {
  return (
    <div
      className="rounded-lg shadow-md p-6 max-w-5xl mx-auto"
      style={{ backgroundColor: "#FFF4E6" }} // 🥛 Soft Contrast - Vanilla Cream
    >
      <h2
        className="text-2xl font-bold mb-4"
        style={{ color: "#4E342E" }} // 🍫 Headings - Deep Brown
      >
        Past Quizzes
      </h2>
      {quizzes.length === 0 ? (
        <p
          className="italic"
          style={{ color: "#8B6C53" }} // 🍪 Text Base - Mocha Brown
        >
          No past quizzes found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table
            className="min-w-full table-auto"
            style={{
              borderCollapse: "collapse",
              width: "100%",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#FFD7A5", // 🍑 Main Accent - Peach Beige
                  color: "#4E342E", // 🍫 Headings - Deep Brown
                  fontWeight: "bold",
                }}
              >
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Date Created</th>
                <th className="p-3 text-left"># Questions</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => (
                <tr
                  key={quiz.id}
                  style={{
                    borderBottom: "1px solid #D8BFA2", // 🧂 Subtle Neutral - Oat Beige
                    backgroundColor: "#FFF4E6", // 🥛 Soft Contrast - Vanilla Cream
                    color: "#8B6C53", // 🍪 Text Base - Mocha Brown
                  }}
                  className="hover:bg-[#F4B6A7]" // 🍓 Friendly Accent - Blush Pink on hover
                >
                  <td className="p-3">{quiz.title}</td>
                  <td className="p-3">{new Date(quiz.dateCreated).toLocaleDateString()}</td>
                  <td className="p-3">{quiz.numberOfQuestions}</td>
                  <td className="p-3">
                    <a
                      href={`/quizzes/${quiz.id}`}
                      style={{ color: "#4E342E", fontWeight: "600" }} // 🍫 Headings - Deep Brown
                      className="hover:underline"
                    >
                      View Details
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
