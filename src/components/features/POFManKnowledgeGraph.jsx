import React from "react";

// Generates a fake knowledge graph with nodes for each document and a highlighted path
export default function POFManKnowledgeGraph({ documents = [], highlightId = null }) {
  // Generate random positions for nodes (for demo only)
  const width = 340;
  const height = 260;
  const nodeRadius = 22;
  const centerX = width / 2;
  const centerY = height / 2;
  const nodeCount = documents.length;
  const angleStep = (2 * Math.PI) / Math.max(1, nodeCount);
  // Place nodes in a circle
  const nodes = documents.map((doc, i) => {
    const angle = i * angleStep;
    return {
      ...doc,
      x: centerX + Math.cos(angle) * 90,
      y: centerY + Math.sin(angle) * 90,
    };
  });
  // Highlight the most referenced (first) document
  const highlightIdx = highlightId
    ? nodes.findIndex((n) => n.id === highlightId)
    : 0;
  // Draw edges (just connect in order for demo)
  const edges = nodes.map((n, i) => {
    if (i === 0) return null;
    return {
      from: nodes[i - 1],
      to: n,
      highlight: i - 1 === highlightIdx || i === highlightIdx,
    };
  }).filter(Boolean);
  return (
    <div className="rounded-lg border bg-white dark:bg-zinc-900 p-3 shadow-md">
      <div className="font-semibold text-sm mb-2 text-center">Knowledge Graph</div>
      <svg width={width} height={height}>
        {/* Edges */}
        {edges.map((edge, i) => (
          <line
            key={i}
            x1={edge.from.x}
            y1={edge.from.y}
            x2={edge.to.x}
            y2={edge.to.y}
            stroke={edge.highlight ? "#6366f1" : "#cbd5e1"}
            strokeWidth={edge.highlight ? 4 : 2}
            opacity={edge.highlight ? 0.9 : 0.5}
          />
        ))}
        {/* Nodes */}
        {nodes.map((node, i) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius}
              fill={i === highlightIdx ? "#6366f1" : "#e0e7ff"}
              stroke="#6366f1"
              strokeWidth={i === highlightIdx ? 4 : 2}
              opacity={i === highlightIdx ? 1 : 0.8}
            />
            <text
              x={node.x}
              y={node.y + 5}
              textAnchor="middle"
              fontSize={12}
              fill={i === highlightIdx ? "#fff" : "#3730a3"}
              fontWeight={i === highlightIdx ? 700 : 500}
            >
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {nodes.map((node, i) => (
          <span
            key={node.id}
            className={`px-2 py-1 rounded text-xs font-medium ${i === highlightIdx ? "bg-indigo-600 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"}`}
            title={node.title}
          >
            {node.title.length > 18 ? node.title.slice(0, 16) + "…" : node.title}
          </span>
        ))}
      </div>
    </div>
  );
}
