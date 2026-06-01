"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, Loader2, CheckCircle, Presentation } from "lucide-react"
import { QuizDisplay } from "@/components/quiz-display"

interface Quiz {
  Question: string
  Options: string[]
  Correct: string
  Explanation: string
}

interface QuizResponse {
  quizzes: Quiz[]
}

interface ParsedQuestion {
  stem: string
  options: { label: string; text: string }[]
  correctAnswer: string
  explanation: string
}

/**
 * A heuristic parser for raw AI quiz text, expecting a format like:
 * 
 * **Question X:**
 * 
 * **Stem:** ...
 * **(a)** ...
 * **(b)** ...
 * **Correct Answer:** (b)
 * **Explanation:** ...
 *
 * Adjust the regexes if your format varies.
 */

function parseRawQuiz(rawJSON: string): ParsedQuestion[] {
  let parsedArray;
  try {
    parsedArray = JSON.parse(rawJSON);
  } catch (err) {
    console.error("Failed to parse JSON:", err);
    return [];
  }

  if (!Array.isArray(parsedArray)) {
    console.error("Parsed JSON is not an array");
    return [];
  }

  return parsedArray.map((item, idx) => {
    const optionsArray: { label: string; text: string }[] = [];

    if (item.options && typeof item.options === "object") {
      for (const [key, value] of Object.entries(item.options)) {
        optionsArray.push({ label: key.toLowerCase(), text: String(value) });
      }
      optionsArray.sort((a, b) => a.label.localeCompare(b.label));
    }

    return {
      stem: item.question ?? `Question ${idx + 1}`,
      options: optionsArray,
      correctAnswer: (item.correct ?? "").toLowerCase(),
      explanation: item.explanation ?? "",
    };
  });
}

export function QuizBattererator() {
  const [prompt, setPrompt] = useState("")
  const [numQuizzes, setNumQuizzes] = useState(5)
  const [questions, setQuestions] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [slidesFile, setSlidesFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [rawResponse, setRawResponse] = useState<string>("")
  const [error, setError] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleSlidesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setSlidesFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      setError("Please provide lecture content or topic");
      return;
    }

    setIsLoading(true);
    setError("");
    setRawResponse("");
    setQuizzes([]);

    try {
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("num_quizzes", numQuizzes.toString());

      if (questions.trim()) {
        formData.append("questions", questions);
      }

      if (slidesFile) {
        formData.append("file", slidesFile);
      } else if (file) {
        formData.append("file", file);
      }

      const response = await fetch("http://localhost:5011/generate-quiz", {
        method: "POST",
        body: formData,
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || "Failed to generate quiz");
      }

      // Parse outer object
      const outer = JSON.parse(text);

      if (!outer.raw_response) {
        throw new Error("Response missing 'raw_response' field");
      }

      // Parse inner JSON string with quiz array
      const quizArray2 = JSON.parse(outer.raw_response);

      if (!Array.isArray(quizArray2) || quizArray2.length === 0) {
        throw new Error("No quiz questions parsed from response");
      }

      // Map quizArray into ParsedQuestion types
      const parsedQuestions = quizArray2.map((item: any, idx: number) => {
        const optionsArray: { label: string; text: string }[] = [];

        if (item.options && typeof item.options === "object") {
          for (const [key, value] of Object.entries(item.options)) {
            optionsArray.push({ label: key.toLowerCase(), text: String(value) });
          }
          optionsArray.sort((a, b) => a.label.localeCompare(b.label));
        }

        return {
          stem: item.question ?? `Question ${idx + 1}`,
          options: optionsArray,
          correctAnswer: (item.correct ?? "").toLowerCase(),
          explanation: item.explanation ?? "",
        };
      });

      console.log("Parsed questions:", parsedQuestions);
      const quizArray: Quiz[] = parsedQuestions.map(q => ({
        Question: q.stem,
        Options: q.options.map(opt => opt.text),
        Correct: q.correctAnswer,
        Explanation: q.explanation,
      }));
      setQuizzes(quizArray);
      setRawResponse("");

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (quizzes.length > 0) {
    console.log("Rendering QuizDisplay with quizzes:", quizzes);
    return <QuizDisplay quizzes={quizzes} onReset={() => setQuizzes([])} />;
  }

  // Default: show the quiz generation form
  return (
    <Card className="border-0 shadow-lg bg-white  border ">
      <CardHeader className="text-center pb-8">
        <CardTitle className="text-2xl font-semibold text-gray-900 ">
          Quiz Generation Form
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Lecture Content and Slides Upload - Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lecture Content */}
            <div className="space-y-2">
              <Label
                htmlFor="prompt"
                className="text-base font-medium text-gray-900 "
              >
                Lecture Content or Topic *
              </Label>
              <Textarea
                id="prompt"
                placeholder="Enter your lecture content, topic, or key concepts you want to create quizzes about..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-40 resize-none border-gray-200  focus:border-[#F4B6A7] focus:ring-[#F4B6A7] bg-white  text-gray-900 "
                required
              />
            </div>

            {/* Slides Upload */}
            <div className="space-y-2">
              <Label
                htmlFor="slidesFile"
                className="text-base font-medium text-gray-900 "
              >
                Upload Your Slides
              </Label>
              <div className="border-2 border-dashed border-gray-200  rounded-lg p-6 text-center hover:border-gray-300  transition-colors bg-gray-50  min-h-40 flex flex-col justify-center">
                <input
                  id="slidesFile"
                  type="file"
                  onChange={handleSlidesFileChange}
                  accept=".pdf,.pptx,.ppt,.key"
                  className="hidden"
                />
                <label htmlFor="slidesFile" className="cursor-pointer">
                  <div className="flex flex-col items-center space-y-3">
                    {slidesFile ? (
                      <>
                        <CheckCircle className="w-10 h-10 text-green-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 ">
                            {slidesFile.name}
                          </p>
                          <p className="text-xs text-gray-500 ">
                            Click to change slides
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Presentation className="w-10 h-10" style={{ color: "#F4B6A7" }} />
                        <div>
                          <p className="text-sm font-medium text-gray-900 ">
                            Upload Presentation Slides
                          </p>
                          <p className="text-xs text-gray-500 ">
                            PowerPoint, PDF, Keynote supported
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Number of Quizzes */}
          <div className="space-y-2">
            <Label
              htmlFor="numQuizzes"
              className="text-base font-medium text-gray-900 "
            >
              Number of Questions *
            </Label>
            <Input
              id="numQuizzes"
              type="number"
              min={1}
              max={20}
              value={numQuizzes}
              onChange={(e) => setNumQuizzes(Number.parseInt(e.target.value) || 5)}
              className="border-gray-200  focus:border-blue-500 focus:ring-blue-500 bg-white  text-gray-900  max-w-xs"
              required
            />
          </div>

          {/* Student Questions */}
          <div className="space-y-2">
            <Label
              htmlFor="questions"
              className="text-base font-medium text-gray-900 "
            >
              Specific Questions to Cover (Optional)
            </Label>
            <Textarea
              id="questions"
              placeholder="Enter specific questions from students or topics you want to ensure are covered in the quiz..."
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              className="min-h-24 resize-none border-gray-200  focus:border-blue-500 focus:ring-blue-500 bg-white  text-gray-900 "
            />
          </div>

          {/* Additional Materials Upload */}
          <div className="space-y-2">
            <Label
              htmlFor="file"
              className="text-base font-medium text-gray-900 "
            >
              Upload Additional Materials (Optional)
            </Label>
            <div className="border-2 border-dashed border-gray-200  rounded-lg p-6 text-center hover:border-gray-300  transition-colors bg-gray-50 ">
              <input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.txt,.docx,.doc,.pptx,.ppt,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.ico,.webp"
                className="hidden"
              />
              <label htmlFor="file" className="cursor-pointer">
                <div className="flex flex-col items-center space-y-4">
                  {file ? (
                    <>
                      <CheckCircle className="w-12 h-12 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 ">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 ">
                          Click to change file
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 ">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 ">
                          Documents, spreadsheets, images supported
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* File Priority Notice */}
          {slidesFile && file && (
            <div className="p-3 bg-blue-50  border border-blue-200  rounded-lg">
              <p className="text-sm text-blue-700 ">
                <strong>Note:</strong> Your slides will be used as the primary source for quiz generation. Additional
                materials will be used as supplementary content.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50  border border-red-200  rounded-lg">
              <p className="text-sm text-red-600 ">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="w-full bg-[#4E342E] hover:bg-[#3a241c] text-white py-4 text-lg rounded-full disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 mr-2" />
                Generate Quiz
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}