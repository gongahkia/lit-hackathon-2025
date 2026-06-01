"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, RotateCcw, Download } from "lucide-react"

interface Quiz {
  Question: string
  Options: string[]
  Correct: string
  Explanation: string
}

interface QuizDisplayProps {
  quizzes: Quiz[]
  onReset: () => void
}

export function QuizDisplay({ quizzes, onReset }: QuizDisplayProps) {
  const [currentQuiz, setCurrentQuiz] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(new Array(quizzes.length).fill(""))
  const [showResults, setShowResults] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuiz] = answer
    setSelectedAnswers(newAnswers)
    setShowExplanation(false)
  }

  const handleNext = () => {
    if (currentQuiz < quizzes.length - 1) {
      setCurrentQuiz(currentQuiz + 1)
      setShowExplanation(false)
    } else {
      setShowResults(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuiz > 0) {
      setCurrentQuiz(currentQuiz - 1)
      setShowExplanation(false)
    }
  }

  const calculateScore = () => {
    return selectedAnswers.reduce((score, answer, index) => {
      return answer === quizzes[index].Correct ? score + 1 : score
    }, 0)
  }

  const exportQuiz = () => {
    const quizData = {
      title: "Generated Quiz",
      questions: quizzes.map((quiz, index) => ({
        question: quiz.Question,
        options: quiz.Options,
        correct: quiz.Correct,
        explanation: quiz.Explanation,
        userAnswer: selectedAnswers[index] || "Not answered",
      })),
      score: calculateScore(),
      total: quizzes.length,
    }

    const blob = new Blob([JSON.stringify(quizData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "quiz-results.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (showResults) {
    const score = calculateScore()
    const percentage = Math.round((score / quizzes.length) * 100)

    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-lg bg-white  border ">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-gray-900 ">Quiz Complete!</CardTitle>
            <div className="mt-4">
              <div className="text-6xl font-bold text-blue-600  mb-2">{percentage}%</div>
              <p className="text-xl text-gray-600 ">
                You scored {score} out of {quizzes.length} questions correctly
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {quizzes.map((quiz, index) => {
                const isCorrect = selectedAnswers[index] === quiz.Correct
                const wasAnswered = selectedAnswers[index] !== ""

                return (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start gap-3 mb-3">
                      {isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900  mb-2">
                          Question {index + 1}: {quiz.Question}
                        </h3>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="font-medium">Your answer:</span>{" "}
                            <span
                              className={
                                wasAnswered ? (isCorrect ? "text-green-600" : "text-red-600") : "text-gray-500"
                              }
                            >
                              {selectedAnswers[index] || "Not answered"}
                            </span>
                          </p>
                          {!isCorrect && (
                            <p>
                              <span className="font-medium">Correct answer:</span>{" "}
                              <span className="text-green-600">{quiz.Correct}</span>
                            </p>
                          )}
                          <p className="text-gray-600 mt-2">
                            <span className="font-medium">Explanation:</span> {quiz.Explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={exportQuiz} variant="outline" className="flex items-center gap-2 bg-transparent">
                <Download className="w-4 h-4" />
                Export Results
              </Button>
              <Button onClick={onReset} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Create New Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuizData = quizzes[currentQuiz]
  const selectedAnswer = selectedAnswers[currentQuiz]

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuiz + 1) / quizzes.length) * 100}%` }}
        />
      </div>

      <Card className="border-0 shadow-lg bg-white  border ">
        <CardHeader>
          <div className="flex justify-between items-center">
            <Badge variant="secondary" className="text-sm">
              Question {currentQuiz + 1} of {quizzes.length}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {selectedAnswers.filter((a) => a !== "").length} answered
            </Badge>
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900 mt-4">{currentQuizData.Question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {currentQuizData.Options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 ${
                  selectedAnswer === option
                    ? "border-blue-500 bg-blue-50  text-blue-900 "
                    : "border-gray-200  hover:border-gray-300  hover:bg-gray-50  text-gray-900 "
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      selectedAnswer === option ? "border-blue-500 bg-blue-500" : "border-gray-300"
                    }`}
                  >
                    {selectedAnswer === option && <div className="w-full h-full rounded-full bg-white scale-50" />}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {selectedAnswer && (
            <div className="space-y-4">
              <Button onClick={() => setShowExplanation(!showExplanation)} variant="outline" className="w-full">
                {showExplanation ? "Hide" : "Show"} Explanation
              </Button>

              {showExplanation && (
                <div className="p-4 bg-blue-50  border border-blue-200  rounded-lg">
                  <p className="text-sm text-blue-900 ">
                    <span className="font-medium">Correct Answer:</span> {currentQuizData.Correct}
                  </p>
                  <p className="text-sm text-blue-800  mt-2">
                    <span className="font-medium">Explanation:</span> {currentQuizData.Explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between">
            <Button onClick={handlePrevious} disabled={currentQuiz === 0} variant="outline">
              Previous
            </Button>
            <Button onClick={handleNext} disabled={!selectedAnswer} className="bg-blue-600 hover:bg-blue-700">
              {currentQuiz === quizzes.length - 1 ? "Finish Quiz" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}