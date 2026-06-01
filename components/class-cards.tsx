// src/components/ClassCards.tsx
"use client"

import React from "react";
import { FileText, User } from "lucide-react"; // Icon set

type ClassInfo = { name: string; instructor: string; files: number };

const classes: ClassInfo[] = [
  { name: "CS206: Software Product Management", instructor: "Richard Lei", files: 10 },
  { name: "LAW201: Corporate Law", instructor: "Gabriel Ong", files: 12 },
  { name: "LAW486: Privacy & Data Protection Law", instructor: "Astin Tay", files: 16 }
];


const ClassCards: React.FC = () => (
    <section
      className="class-cards"
      style={{
        display: "flex",
        gap: "1rem",
        marginBottom: "2rem",
        flexWrap: "wrap",
      }}
    >
      {classes.map((cls, i) => (
        <div
          className="class-card"
          key={i}
          style={{
            background: "#FFD7A5", // 🍑 Peach Beige
            borderRadius: "12px",
            padding: "1.5rem",
            flex: "1 1 250px",
            color: "#4E342E", // 🍫 Deep Brown for headings
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
          }}
        >
          <h4 style={{ marginBottom: "0.5rem", fontWeight: "600" }}>{cls.name}</h4>
  
          <p style={{ margin: "0.5rem 0", color: "#8B6C53", display: "flex", alignItems: "center" }}>
            <FileText size={16} style={{ marginRight: "0.5rem" }} />
            {cls.files} Files
          </p>
  
          <p style={{ margin: 0, color: "#8B6C53", display: "flex", alignItems: "center" }}>
            <User size={16} style={{ marginRight: "0.5rem" }} />
            Instructor: {cls.instructor}
          </p>
        </div>
      ))}
    </section>
  );
  
  export default ClassCards;