import { Navigation } from "@/components/navigation"
import { QuizBattererator } from "@/components/quiz-generator"

export default function GeneratePage() {
  return (
    <div className="min-h-screen bg-gray-50 ">
      <Navigation />
      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900  mb-4">Create Your Quiz</h1>
            <p className="text-xl text-gray-600 ">
              Upload your materials and let AI generate personalized quiz questions
            </p>
          </div>
          <QuizBattererator/>
        </div>
      </main>
    </div>
  )
}