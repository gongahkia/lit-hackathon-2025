"use client"
import { useEffect, useState } from "react"

function formatDate(dateString) {
  if (!dateString) return ""
  return new Date(dateString).toLocaleDateString("en-SG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function TimelineView({ topic, documents, onViewDocument, onBack }) {
  const [timeline, setTimeline] = useState([])
  useEffect(() => {
    fetch("http://localhost:5000/api/timeline")
      .then((res) => res.json())
      .then((data) => {
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
  // Flatten all events for vertical display, maintaining their parent policy context.
  function buildEventList(timeline) {
    const eventList = []
    timeline.forEach((entry) => {
      const { changes, policy, summary, speakers } = entry
      // Creation
      if (changes.creation) {
        eventList.push({
          ...changes.creation,
          type: "Creation",
          policy,
          policySummary: summary,
          policySpeakers: speakers,
        })
      }
      // Amendments
      if (Array.isArray(changes.amendments)) {
        changes.amendments.forEach((amend, i) => {
          eventList.push({
            ...amend,
            type: "Amendment",
            policy,
            policySummary: summary,
            policySpeakers: speakers,
            index: i + 1,
          })
        })
      }
      // Dissolution
      if (changes.dissolution) {
        eventList.push({
          ...changes.dissolution,
          type: "Dissolution",
          policy,
          policySummary: summary,
          policySpeakers: speakers,
        })
      }
    })
    // Sort by date ascending
    eventList.sort((a, b) => (a.date > b.date ? 1 : -1))
    return eventList
  }
  const eventList = buildEventList(timeline)
  return (
    <div className="w-full h-full overflow-y-auto relative p-6 bg-white">
      {/* Sticky Back button */}
      <div className="sticky top-0 z-20 bg-white py-3">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
        >
          ← Back to Search
        </button>
      </div>
      {/* Central vertical line (thicker and more vibrant) */}
      <div className="absolute left-1/2 top-16 w-1 h-[calc(100%-4rem)] bg-indigo-400 transform -translate-x-1/2"></div>
      {/* Timeline events */}
      <div className="flex flex-col items-center relative space-y-24 mt-8 pb-24">
        {eventList.map((event, index) => {
          const isLeft = index % 2 === 0
          return (
            <div key={event.type + event.policy + event.date + index} className="flex w-full items-start relative">
              {/* Card */}
              <div
                className={`w-[27rem] max-w-[95vw] p-6 rounded shadow bg-white border border-gray-200 absolute transition-all ${
                  isLeft ? "right-1/2 mr-20" : "left-1/2 ml-20"
                }`}
              >
                {/* Policy header */}
                <div className="font-semibold text-indigo-700 mb-1 text-lg">
                  {event.policy}
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  {event.policySummary}
                </div>
                {/* Event type badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs font-bold rounded px-2 py-0.5 ${
                      event.type === "Creation"
                        ? "bg-green-100 text-green-700"
                        : event.type === "Amendment"
                        ? "bg-yellow-100 text-yellow-800"
                        : event.type === "Dissolution"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {event.type} {(event.type === "Amendment" && event.index) ? `#${event.index}` : ""}
                  </span>
                  <span className="text-sm text-gray-500 font-light">{formatDate(event.date)}</span>
                </div>
                {/* Speakers */}
                {event.speakers && event.speakers.length > 0 && (
                  <div className="mb-2">
                    <span className="font-medium text-xs text-gray-600">Speakers: </span>
                    <span className="text-xs text-gray-500">{event.speakers.join(", ")}</span>
                  </div>
                )}
                {/* Summary */}
                <div className="text-sm text-gray-800 mb-2">{event.summary}</div>
                {/* Source URL */}
                {event.url && (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-1 text-xs text-indigo-600 font-medium hover:underline"
                  >
                    View Document
                  </a>
                )}
              </div>
              {/* Dot */}
              <div className="w-6 h-6 rounded-full bg-indigo-500 z-10 mx-auto"></div>
              {/* Horizontal connector from dot to card */}
              <div
                className={`absolute top-4 w-10 h-0.5 bg-indigo-400 z-0 ${
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
