"use client"

import React from "react";

type Quiz = { quiz: string; date: string; score: string; status: string };

const quizzes: Quiz[] = [
  { quiz: "Vocabulary Test 1", date: "12.07.2022", score: "90%", status: "Passed" },
  { quiz: "Essay Writing", date: "17.07.2022", score: "85%", status: "Passed" },
  { quiz: "Grammar Quiz", date: "22.07.2022", score: "78%", status: "Review" },
  { quiz: "Reading Comprehension", date: "25.07.2022", score: "82%", status: "Passed" },
  { quiz: "Listening Skills", date: "28.07.2022", score: "70%", status: "Review" },
  { quiz: "Vocabulary Test 2", date: "30.07.2022", score: "88%", status: "Passed" },
  { quiz: "Grammar Quiz 2", date: "02.08.2022", score: "75%", status: "Review" }
];

const PastQuizzesTable: React.FC = () => (
  <div
    style={{
      height: "12rem",
      overflowY: "auto",
      borderRadius: "12px",
      background: "#fff",
      marginTop: "2rem",
      boxShadow: "0 4px 8px rgba(0,0,0,0.05)"
    }}
  >
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ background: "#fff" }}>
          {["Quiz", "Date", "Score", "Status", "Review"].map((header) => (
            <th
              key={header}
              style={{
                padding: "1rem",
                position: "sticky",
                top: 0,
                background: "#fff",
                zIndex: 1,
                borderBottom: "1px solid #ddd",
                textAlign: "center"
              }}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {quizzes.map((q, i) => (
          <tr key={i}>
            <td style={{ textAlign: "center", padding: "1rem" }}>{q.quiz}</td>
            <td style={{ textAlign: "center", padding: "1rem" }}>{q.date}</td>
            <td style={{ textAlign: "center", padding: "1rem" }}>{q.score}</td>
            <td style={{ textAlign: "center", padding: "1rem" }}>{q.status}</td>
            <td style={{ textAlign: "center", padding: "1rem" }}>
              <button
                style={{
                  padding: "0.4rem 0.9rem",
                  borderRadius: "5px",
                  background: "#4E342E",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer"
                }}
                onClick={() => alert(`Viewing results for ${q.quiz}`)} // Replace with navigation logic
              >
                View
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default PastQuizzesTable;