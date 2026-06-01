import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileText, Brain, Download, Clock, Shield } from "lucide-react"

const features = [
  {
    icon: Upload,
    title: "Multiple File Formats",
    description: "Upload PDFs, Word docs, PowerPoints, and more. We support all major document and image formats.",
  },
  {
    icon: Brain,
    title: "AI-Powered Generation",
    description:
      "Advanced Gemini AI analyzes your content and creates relevant, challenging quiz questions automatically.",
  },
  {
    icon: FileText,
    title: "Custom Questions",
    description: "Add your own questions to ensure specific topics are covered in the generated quiz.",
  },
  {
    icon: Clock,
    title: "Instant Results",
    description: "Get your personalized quiz in seconds, not hours. Perfect for last-minute study sessions.",
  },
  {
    icon: Download,
    title: "Export Options",
    description: "Download your quizzes in multiple formats or take them directly in our interactive interface.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your files are processed securely and deleted immediately after quiz generation.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-gray-50 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900  mb-4">
            Everything you need to create
            <span className="block" style={{ color: "#8B6C53" }}>perfect quizzes</span>
          </h2>
          <p className="text-xl text-gray-600  max-w-2xl mx-auto">
            Our platform combines cutting-edge AI with intuitive design to make quiz creation effortless.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white  border "
            >
              <CardContent className="p-8 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: "#E9D5C4" }} // a lighter brown tone
              >
                  <feature.icon className="w-8 h-8 text-[#8B6C53]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900  mb-4">{feature.title}</h3>
                <p className="text-gray-600  leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}