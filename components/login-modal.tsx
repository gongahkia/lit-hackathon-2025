import React from "react";

interface LoginModalProps {
  onClose: () => void;
  onLogin: (role: "student" | "teacher") => void;
}

export function LoginModal({ onClose, onLogin }: LoginModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
      style={{
        backgroundImage: "url('/images/kitchen.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="relative bg-white  rounded-lg p-8 max-w-sm w-full text-center z-10 shadow-lg">
        {/* Logo centered */}
        <img
          src="/images/quizbatter.png"
          alt="Logo"
          className="mx-auto mb-6 w-50 h-40 object-contain"
        />

        <h2 className="text-xl font-semibold mb-6 text-gray-900 ">
          Select Account Type:
        </h2>

        <div className="flex justify-center gap-6 mb-4">
          <button
            className="px-6 py-3 rounded bg-[#D7B99D] hover:bg-[#C9A87F] text-gray-900 font-semibold transition"
            onClick={() => onLogin("student")}
          >
            Student
          </button>
          <button
            className="px-6 py-3 rounded bg-[#8B6C53] hover:bg-[#7A5B3F] text-white font-semibold transition"
            onClick={() => onLogin("teacher")}
          >
            Teacher
          </button>
        </div>
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close Modal"
        >
          ×
        </button>
      </div>
    </div>
  );
}
