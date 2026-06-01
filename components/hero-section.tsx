"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, BookOpen, Brain, Zap } from "lucide-react"
import { motion } from "framer-motion"

const titleWords = [
  "Whip", "Up",
  "\n",
  "Better", "Quizzes",
  "\n",
  "with", "QuizBatter"
];  

const wordVariants = {
  hidden: { opacity: 0, y: 40, rotate: -10, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: {
      delay: i * 0.13,
      duration: 0.7,
      type: "spring",
      stiffness: 120,
      damping: 10,
    }
  })
};

export function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('images/hero-background.png')" }}
    >

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Croissant */}
        <div className="absolute top-20 left-10 animate-float">
          <div className="w-16 h-16 bg-[#FFD7A5] rounded-2xl flex items-center justify-center shadow-md">
            <img src="/icons/croissant.png" alt="Croissant" className="w-10 h-10 object-contain" />
          </div>
        </div>

        {/* Donut */}
        <div className="absolute top-40 right-20 animate-float-delayed">
          <div className="w-12 h-12 bg-[#D8BFA2] rounded-xl flex items-center justify-center shadow-md">
            <img src="/icons/donut.png" alt="Donut" className="w-8 h-8 object-contain" />
          </div>
        </div>

        {/* Cupcake */}
        <div className="absolute bottom-40 left-20 animate-float">
          <div className="w-14 h-14 bg-[#F4B6A7] rounded-2xl flex items-center justify-center shadow-md">
            <img src="/icons/cupcake.png" alt="Cupcake" className="w-9 h-9 object-contain" />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-kualine text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight flex flex-wrap justify-center gap-x-3 gap-y-2">
          {titleWords.map((word, i) => (
            <motion.span
              key={word + i}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={wordVariants}
              className={
                word === "Better" || word === "Quizzes"
                  ? "block font-kualine text-[#8B6C53]"
                  : "block font-kualine text-gray-900"
              }
              style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.4)" }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          className="text-xl sm:text-2xl text-gray-900 mb-8 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
        >
          Let QuizBatter help you transform lecture slides and content into personalised quizzes!
        </motion.p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <motion.div
            whileHover={{ scale: 1.07, rotate: -2, boxShadow: "0 8px 32px 0 rgba(78,52,46,0.18)" }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="w-full sm:w-auto"
          >
            <Button
              asChild
              size="lg"
              className="text-white px-8 py-4 text-lg rounded-full"
              style={{ backgroundColor: "#4E342E" }}
            >
              <Link href="/generate" className="flex items-center gap-2">
                Start Baking
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-2 bg-white text-[#4E342E] hover:bg-[#f5f3f2] px-8 py-4 text-lg rounded-full"
            style={{ borderColor: "#4E342E" }}>
            <Link href="#features">Learn More</Link>
          </Button>
        </div>

        <div className="mt-12 text-sm text-gray-900 ">
          Powered by Google Gemini AI • Free to use • No signup required
        </div>
      </div>
    </section>
  )
}
