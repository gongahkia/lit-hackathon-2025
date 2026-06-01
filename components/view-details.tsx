import React from "react";

interface QuestionOption {
  a: string;
  b: string;
  c: string;
  d: string;
}

interface QuizQuestion {
  question: string;
  options: QuestionOption;
  correct: string;
  explanation: string;
}

interface ViewDetailsProps {
  quizTitle: string;
  quizDescription?: string;
  questions: QuizQuestion[];
}

export function ViewDetails({ quizTitle, quizDescription, questions }: ViewDetailsProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{quizTitle}</h2>
      {quizDescription && (
        <p className="text-gray-700 dark:text-gray-300 mb-6">{quizDescription}</p>
      )}
      {questions.length === 0 ? (
        <p className="italic text-gray-600 dark:text-gray-400">No questions available.</p>
      ) : (
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={idx} className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
              <p className="font-semibold mb-2">{idx + 1}. {q.question}</p>
              <ul className="list-disc pl-5 mb-2">
                <li><strong>a.</strong> {q.options.a}</li>
                <li><strong>b.</strong> {q.options.b}</li>
                <li><strong>c.</strong> {q.options.c}</li>
                <li><strong>d.</strong> {q.options.d}</li>
              </ul>
              <p><strong>Correct answer:</strong> {q.correct}</p>
              <p className="text-sm italic mt-1">{q.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}