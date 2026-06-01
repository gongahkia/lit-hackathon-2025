import React from "react";
import { Navigation } from "@/components/navigation";
import ClassCards from "@/components/class-cards";
import PastQuizzesTable from "@/components/past-quizzes";
import Link from "next/link";

const Dashboard: React.FC = () => {
  return (
    <div
      className="absolute top-0 left-0 w-full h-full bg-cover bg-center -z-10"
      style={{ backgroundImage: "url('/images/kitchen.jpg')" }}
    >
      <div>
        <Navigation />
        <main
          className="dashboard-main"
          style={{ padding: "2rem", background: "#f7f8fd", minHeight: "100vh" }}
        >
          <header style={{ marginBottom: "2rem", textAlign: "center" }}>
            <div className="welcome" style={{ display: "inline-block" }}>
              <h2 style={{ marginBottom: "0.5rem" }}>Welcome back, Kevan Wee!</h2>

              <img
                src="/team/kevan.jpeg"
                alt="Kevan's Profile"
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginBottom: "1rem",
                  display: "block",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              />

              <p style={{ marginBottom: "1rem" }}>Ready to start baking?</p>

              <Link href="/generate">
                <button
                  style={{
                    background: "#4E342E",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.5rem 1.2rem",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  Start Baking
                </button>
              </Link>
            </div>
          </header>

          <ClassCards />
          <PastQuizzesTable />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;