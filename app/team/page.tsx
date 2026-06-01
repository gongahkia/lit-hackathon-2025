import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Github, Linkedin, Twitter } from "lucide-react"

const teamMembers = [
  {
    name: "Mr. Richard Lei",
    role: "Co-Founder & CEO",
    bio: "Seasoned fintech strategist with a knack for turning spreadsheets into stories. Richard brings the finance flair and startup hustle energy to every project.",
    image: "/team/richard.jpeg",
    skills: ["Professional", "Vibe", "Coder"],
    social: {
      linkedin: "#",
      twitter: "#",
      github: "#",
    },
  },
  {
    name: "Mr. Gabriel Ong",
    role: "Co-Founder & CTO",
    bio: "A full-stack whiz who lives for clean code and late-night debugging. Gabriel builds the backbone of our platform and dreams in JavaScript.",
    image: "/team/gabriel.jpeg",
    skills: ["Handsome", "Healthy", "Hardworking"],
    social: {
      linkedin: "#",
      twitter: "#",
      github: "#",
    },
  },
  {
    name: "Ms. Arya Govind",
    role: "Head of AI Research",
    bio: "Data detective by day, spreadsheet wizard by night. Arya translates messy data into meaningful insights with a sharp analytical eye.",
    image: "/team/arya.jpeg",
    skills: ["Analytical", "Strategic", "Calm"],
    social: {
      linkedin: "#",
      twitter: "#",
      github: "#",
    },
  },
  {
    name: "Ms. Tan Le Xuan",
    role: "Lead Frontend Engineer",
    bio: "Vibe curator and design mind behind our interfaces. Le Xuan ensures everything looks good, feels smooth, and makes sense — with style.",
    image: "/team/lexuan.jpeg",
    skills: ["Creative", "Chill", "Empathetic"],
    social: {
      linkedin: "#",
      twitter: "#",
      github: "#",
    },
  },
  {
    name: "Ms. Nichole Bun",
    role: "Frontend & UX Specialist",
    bio: "Bridging code and creativity, Nichole shapes pages, themes, and interfaces that work as beautifully as they look. She blends thoughtful design with smooth functionality, making sure every interaction feels just right.",
    image: "/team/nichole.jpeg",
    skills: ["Creative", "Versatile", "Detail-oriented"],
    social: {
      linkedin: "#",
      twitter: "#",
      github: "#",
    },
  },
  {
    name: "Mr. Kevan Wee and Mr. Astin Tay",
    role: "Customer Service Officers",
    bio: "Our go-to duo for digital transformation and soulful pep talks. With deep roots in education and automation, they make change feel doable — and even fun.",
    image: ["/team/kevan.jpeg", "/team/astin.jpeg"],
    skills: ["Curriculum Design", "Assessment", "Pedagogy"],
    social: {
      linkedin: "#",
      twitter: "#",
    },
  }
]

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-white ">
      <Navigation />
      <main className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900  mb-6">Meet Kitchen</h1>
            <p className="text-xl text-gray-600  max-w-2xl mx-auto">
              We're a passionate group of educators, engineers, and researchers dedicated to revolutionizing learning
              through AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white "
              >
                <CardContent className="p-8 text-center">
                <div className="mb-6 flex justify-center gap-4">
                  {Array.isArray(member.image) ? (
                    member.image.map((imgSrc, idx) => (
                      <img
                        key={idx}
                        src={imgSrc}
                        alt={`${member.name} ${idx + 1}`}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ))
                  ) : (
                    <img
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      className="w-32 h-32 rounded-full mx-auto object-cover"
                    />
                  )}
                </div>

                  <h3 className="text-xl font-semibold text-gray-900  mb-2">{member.name}</h3>

                  <p className="text-[#e89ca0]  font-medium mb-4">{member.role}</p>

                  <p className="text-[#4E342E]  text-sm leading-relaxed mb-6">{member.bio}</p>

                  <div className="flex flex-wrap gap-2 justify-center mb-6">
                    {member.skills.map((skill, skillIndex) => (
                      <Badge
                        key={skillIndex}
                        variant="secondary"
                        className="text-xs bg-[#eddaca]  text-gray-700 "
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-center space-x-4">
                    {member.social.linkedin && (
                      <a
                        href={member.social.linkedin}
                        className="text-[#8B6C53] hover:text-[#F4B6A7]  transition-colors"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {member.social.twitter && (
                      <a href={member.social.twitter} className="text-[#8B6C53] hover:text-[#F4B6A7] transition-colors">
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                    {member.social.github && (
                      <a
                        href={member.social.github}
                        className="text-[#8B6C53] hover:text-[#F4B6A7]  transition-colors"
                      >
                        <Github className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 bg-gray-50  rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900  mb-6 text-center">Join Our Mission</h2>
            <p className="text-lg text-gray-600  leading-relaxed text-center max-w-3xl mx-auto mb-8">
              We're always looking for talented individuals who share our passion for education and technology. If
              you're interested in making a meaningful impact on how people learn, we'd love to hear from you.
            </p>
            <div className="text-center">
              <a
                href="https://youtu.be/dQw4w9WgXcQ?si=OKUpDjV3emMYxcgg"
                className="inline-flex items-center px-6 py-3 bg-[#8B6C53] hover:bg-blue-700 text-white font-medium rounded-full transition-colors"
              >
                View Open Positions
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}