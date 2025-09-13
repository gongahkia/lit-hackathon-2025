"use client"

import { useEffect, useState } from "react"

export default function TimelineView() {
  const [timeline, setTimeline] = useState([])
  
  useEffect(() => {
    fetch("http://localhost:5000/api/timeline")
      .then((res) => res.json())
      .then((data) => {
        console.log("Timeline API response:", data)

        if (Array.isArray(data)) {
          setTimeline(data)              
        } else if (Array.isArray(data.timeline)) {
          setTimeline(data.timeline)     
        } else {
          console.error("Unexpected data format:", data)
        }
      })
      .catch((err) => console.error("Error fetching timeline:", err))
  }, [])


  return (
    <div className="w-full h-full overflow-y-auto relative p-6">
      {/* Central vertical line */}
      <div className="absolute left-1/2 top-0 w-0.5 h-full bg-gray-300 transform -translate-x-1/2"></div>

      <div className="flex flex-col items-center relative space-y-12">
        {timeline.map((event, index) => {
          const isLeft = index % 2 === 0
          return (
            <div key={index} className="flex w-full items-start relative">
              {/* Card */}
              <div
                className={`w-80 p-4 rounded shadow bg-white absolute ${
                  isLeft ? "right-1/2 mr-8" : "left-1/2 ml-8"
                }`}
              >
                <h3 className="font-medium">{event.policy}</h3>
                <p className="text-sm text-muted-foreground">{event.summary}</p>
              </div>

              {/* Dot */}
              <div className="w-4 h-4 rounded-full bg-primary z-10 mx-auto"></div>

              {/* Horizontal connector from dot to card */}
              <div
                className={`absolute top-2.5 w-8 h-0.5 bg-gray-400 z-0 ${
                  isLeft ? "right-1/2" : "left-1/2"
                }`}
              ></div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
