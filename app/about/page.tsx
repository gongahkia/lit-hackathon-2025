import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, Zap, Shield, Users, FileText, Search, Upload, Database, CheckCircle, Sparkles } from "lucide-react"

export default function AboutPage() {
  return (
    <div
      className="bg-cover bg-fixed bg-center"
      style={{ backgroundImage: "url('images/hero-background.png')" }}
    >
      <Navigation />
      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900  mb-6">About QuizBatter</h1>
            <p className="text-xl text-gray-600  max-w-2xl mx-auto">
              We're revolutionizing education by making quiz creation effortless and intelligent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <Card className="border-0 shadow-sm bg-white ">
              <CardContent className="p-8 text-center">
                <Brain className="w-12 h-12 text-[#F4B6A7]  mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900  mb-4">AI-Powered Intelligence</h3>
                <p className="text-gray-600 ">
                  Our platform uses Google's advanced Gemini AI to understand your content and generate relevant,
                  challenging questions.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white ">
              <CardContent className="p-8 text-center">
                <Zap className="w-12 h-12 text-[#D8BFA2]  mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900  mb-4">Lightning Fast</h3>
                <p className="text-gray-600 ">
                  Generate comprehensive quizzes in seconds, not hours. Perfect for educators and students with tight
                  schedules.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white ">
              <CardContent className="p-8 text-center">
                <Shield className="w-12 h-12 text-[#D8BFA2]  mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900  mb-4">Privacy First</h3>
                <p className="text-gray-600">
                  Your files are processed securely and deleted immediately after quiz generation. We never store your
                  content.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white ">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-[#F4B6A7]  mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900  mb-4">Built for Everyone</h3>
                <p className="text-gray-600 ">
                  Whether you're a teacher, student, or trainer, our intuitive interface makes quiz creation accessible
                  to all.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900  mb-8 text-center">Our Technology Stack</h2>

            <Card className="border-0 shadow-lg bg-white  mb-8">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold text-gray-900  mb-6 text-center">
                  Advanced RAG Pipeline
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  Our Retrieval-Augmented Generation (RAG) pipeline combines the power of information retrieval with
                  generative AI to create highly relevant and contextual quiz questions from your educational materials.
                </p>

                {/* Architecture Diagram */}
                <div className="mb-8 p-6 bg-gray-50  rounded-xl">
                  <h4 className="text-lg font-semibold text-gray-900  mb-6 text-center">
                    System Architecture
                  </h4>

                  <div className="relative">
                    {/* User Input Layer */}
                    <div className="flex justify-center mb-8">
                      <div className="bg-blue-100  rounded-lg p-4 text-center max-w-xs">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                        <h5 className="font-semibold text-gray-900  text-sm">User Input</h5>
                        <p className="text-xs text-gray-600 mt-1">Documents, Questions, Prompts</p>
                      </div>
                    </div>

                    {/* Arrow Down */}
                    <div className="flex justify-center mb-6">
                      <div className="w-0.5 h-8 bg-gray-300 "></div>
                      <div className="absolute w-3 h-3 bg-gray-300  rotate-45 transform translate-y-6"></div>
                    </div>

                    {/* Processing Layer */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-green-100  rounded-lg p-4 text-center">
                        <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <h5 className="font-semibold text-gray-900  text-sm">Document Parser</h5>
                        <p className="text-xs text-gray-600  mt-1">Extract & Clean Text</p>
                      </div>

                      <div className="bg-purple-100  rounded-lg p-4 text-center">
                        <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Brain className="w-6 h-6 text-white" />
                        </div>
                        <h5 className="font-semibold text-gray-900  text-sm">Text Chunking</h5>
                        <p className="text-xs text-gray-600 mt-1">Semantic Segmentation</p>
                      </div>

                      <div className="bg-orange-100 rounded-lg p-4 text-center">
                        <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <h5 className="font-semibold text-gray-900 text-sm">Embedding</h5>
                        <p className="text-xs text-gray-600 mt-1">OpenAI text-embedding-3</p>
                      </div>
                    </div>

                    {/* Arrow Down */}
                    <div className="flex justify-center mb-6">
                      <div className="w-0.5 h-8 bg-gray-300 "></div>
                      <div className="absolute w-3 h-3 bg-gray-300 rotate-45 transform translate-y-6"></div>
                    </div>

                    {/* Storage Layer */}
                    <div className="flex justify-center mb-8">
                      <div className="bg-indigo-100  rounded-lg p-4 text-center max-w-xs">
                        <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Database className="w-6 h-6 text-white" />
                        </div>
                        <h5 className="font-semibold text-gray-900  text-sm">Vector Database</h5>
                        <p className="text-xs text-gray-600  mt-1">Pinecone Storage</p>
                      </div>
                    </div>

                    {/* Bidirectional Arrow */}
                    <div className="flex justify-center mb-6">
                      <div className="flex flex-col items-center">
                        <div className="w-0.5 h-6 bg-gray-300 "></div>
                        <div className="w-3 h-3 bg-gray-300  rotate-45 transform"></div>
                        <div className="w-0.5 h-6 bg-gray-300 "></div>
                        <div className="w-3 h-3 bg-gray-300  rotate-45 transform rotate-180"></div>
                      </div>
                    </div>

                    {/* Retrieval & Generation Layer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-teal-100  rounded-lg p-4 text-center">
                        <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Search className="w-6 h-6 text-white" />
                        </div>
                        <h5 className="font-semibold text-gray-900  text-sm">Similarity Search</h5>
                        <p className="text-xs text-gray-600  mt-1">Retrieve Relevant Context</p>
                      </div>

                      <div className="bg-red-100  rounded-lg p-4 text-center">
                        <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <h5 className="font-semibold text-gray-900  text-sm">AI Generation</h5>
                        <p className="text-xs text-gray-600  mt-1">Google Gemini 2.0</p>
                      </div>
                    </div>

                    {/* Arrow Down */}
                    <div className="flex justify-center mb-6">
                      <div className="w-0.5 h-8 bg-gray-300 "></div>
                      <div className="absolute w-3 h-3 bg-gray-300  rotate-45 transform translate-y-6"></div>
                    </div>

                    {/* Output Layer */}
                    <div className="flex justify-center">
                      <div className="bg-yellow-100  rounded-lg p-4 text-center max-w-xs">
                        <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <h5 className="font-semibold text-gray-900  text-sm">Generated Quiz</h5>
                        <p className="text-xs text-gray-600  mt-1">
                          Questions, Options, Explanations
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100  rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-blue-600 " />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900  mb-2">Document Processing</h4>
                    <p className="text-sm text-gray-600 ">
                      Advanced parsing and chunking of uploaded documents using semantic segmentation
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100  rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-green-600 " />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900  mb-2">Vector Retrieval</h4>
                    <p className="text-sm text-gray-600 ">
                      Embedding-based similarity search to find the most relevant content sections
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100  rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-8 h-8 text-purple-600 " />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900  mb-2">Contextual Generation</h4>
                    <p className="text-sm text-gray-600 ">
                      Gemini AI generates questions using retrieved context for maximum relevance
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-gray-50  rounded-xl">
                  <h4 className="text-lg font-semibold text-gray-900  mb-3">Technical Implementation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="text-sm text-gray-600  space-y-2">
                      <li>
                        • <strong>Embedding Model:</strong> OpenAI text-embedding-3-large for high-quality vector
                        representations
                      </li>
                      <li>
                        • <strong>Vector Database:</strong> Pinecone for fast similarity search and retrieval
                      </li>
                      <li>
                        • <strong>Chunking Strategy:</strong> Semantic chunking with overlap to preserve context
                      </li>
                    </ul>
                    <ul className="text-sm text-gray-600  space-y-2">
                      <li>
                        • <strong>Retrieval Method:</strong> Hybrid search combining semantic and keyword matching
                      </li>
                      <li>
                        • <strong>Generation Model:</strong> Google Gemini 2.0 Flash Lite with optimized prompting
                      </li>
                      <li>
                        • <strong>Processing Pipeline:</strong> Async processing with error handling and retry logic
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gray-50  rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900  mb-6 text-center">Our Mission</h2>
            <p className="text-lg text-gray-600  leading-relaxed text-center max-w-3xl mx-auto">
              We believe that learning should be engaging, accessible, and personalized. By combining cutting-edge AI
              with thoughtful design, we're making it easier than ever for educators to create meaningful assessments
              that help students learn and grow. Our goal is to save time for teachers while improving learning outcomes
              for students everywhere.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}