import React, { useState, useCallback } from "react";

// Interactive Knowledge Graph showing top 10 documents
// Top 3 are highlighted as "most relevant", remaining 7 shown as related context
export default function POFManKnowledgeGraph({
  documents = [],
  highlightId = null,
  onNodeClick = null,
  relevantCount = 3  // Number of documents considered "most relevant"
}) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // Ensure we show exactly 10 nodes (or fewer if not enough documents)
  const maxNodes = 10;
  const displayDocs = documents.slice(0, maxNodes);

  // Graph dimensions
  const width = 380;
  const height = 320;
  const centerX = width / 2;
  const centerY = height / 2;

  // Node sizing
  const relevantRadius = 26;
  const contextRadius = 20;

  // Calculate node positions - relevant nodes in inner circle, context in outer
  const nodes = displayDocs.map((doc, i) => {
    const isRelevant = i < relevantCount;
    const nodeRadius = isRelevant ? relevantRadius : contextRadius;

    let x, y;
    if (isRelevant) {
      // Inner circle for top 3 relevant documents
      const innerRadius = 65;
      const angle = ((i / relevantCount) * 2 * Math.PI) - Math.PI / 2;
      x = centerX + Math.cos(angle) * innerRadius;
      y = centerY + Math.sin(angle) * innerRadius;
    } else {
      // Outer circle for context documents
      const outerRadius = 120;
      const contextCount = Math.min(displayDocs.length - relevantCount, maxNodes - relevantCount);
      const contextIndex = i - relevantCount;
      const angle = ((contextIndex / contextCount) * 2 * Math.PI) - Math.PI / 2;
      x = centerX + Math.cos(angle) * outerRadius;
      y = centerY + Math.sin(angle) * outerRadius;
    }

    return {
      ...doc,
      x,
      y,
      radius: nodeRadius,
      isRelevant,
      index: i,
    };
  });

  // Find the highlighted node index
  const highlightIdx = highlightId
    ? nodes.findIndex((n) => n.id === highlightId)
    : 0;

  // Generate edges - connect relevant nodes to each other and to nearby context nodes
  const edges = [];

  // Connect relevant nodes in a triangle
  for (let i = 0; i < Math.min(relevantCount, nodes.length); i++) {
    for (let j = i + 1; j < Math.min(relevantCount, nodes.length); j++) {
      edges.push({
        from: nodes[i],
        to: nodes[j],
        type: 'relevant',
        highlight: i === highlightIdx || j === highlightIdx,
      });
    }
  }

  // Connect context nodes to their nearest relevant node
  for (let i = relevantCount; i < nodes.length; i++) {
    const contextNode = nodes[i];
    // Find nearest relevant node
    let nearestIdx = 0;
    let minDist = Infinity;
    for (let j = 0; j < Math.min(relevantCount, nodes.length); j++) {
      const dx = contextNode.x - nodes[j].x;
      const dy = contextNode.y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = j;
      }
    }
    edges.push({
      from: nodes[nearestIdx],
      to: contextNode,
      type: 'context',
      highlight: nearestIdx === highlightIdx || i === highlightIdx,
    });
  }

  // Handle node click
  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node.id === selectedNode ? null : node.id);
    if (onNodeClick) {
      // Extract base document ID (remove -index suffix if present)
      const docId = node.id.replace(/-\d+$/, '');
      onNodeClick(docId, node);
    }
  }, [selectedNode, onNodeClick]);

  // Get node colors based on state
  const getNodeColors = (node, i) => {
    const isHovered = hoveredNode === node.id;
    const isSelected = selectedNode === node.id;
    const isHighlighted = i === highlightIdx;

    if (node.isRelevant) {
      if (isSelected) {
        return { fill: '#4f46e5', stroke: '#312e81', textFill: '#fff' };
      }
      if (isHighlighted) {
        return { fill: '#6366f1', stroke: '#4f46e5', textFill: '#fff' };
      }
      if (isHovered) {
        return { fill: '#818cf8', stroke: '#6366f1', textFill: '#fff' };
      }
      return { fill: '#c7d2fe', stroke: '#6366f1', textFill: '#3730a3' };
    } else {
      // Context nodes - more muted colors
      if (isSelected) {
        return { fill: '#64748b', stroke: '#334155', textFill: '#fff' };
      }
      if (isHovered) {
        return { fill: '#94a3b8', stroke: '#64748b', textFill: '#fff' };
      }
      return { fill: '#e2e8f0', stroke: '#94a3b8', textFill: '#475569' };
    }
  };

  return (
    <div className="rounded-lg border bg-white dark:bg-zinc-900 p-4 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-sm">Knowledge Graph</div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Relevant
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
            Related
          </span>
        </div>
      </div>

      <svg
        width={width}
        height={height}
        className="cursor-pointer"
        style={{ overflow: 'visible' }}
      >
        {/* Background circle for visual effect */}
        <circle
          cx={centerX}
          cy={centerY}
          r={130}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="dark:stroke-zinc-700"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={75}
          fill="none"
          stroke="#c7d2fe"
          strokeWidth="1.5"
          className="dark:stroke-indigo-900"
        />

        {/* Edges */}
        {edges.map((edge, i) => (
          <line
            key={`edge-${i}`}
            x1={edge.from.x}
            y1={edge.from.y}
            x2={edge.to.x}
            y2={edge.to.y}
            stroke={edge.type === 'relevant' ? '#a5b4fc' : '#cbd5e1'}
            strokeWidth={edge.highlight ? 3 : edge.type === 'relevant' ? 2 : 1.5}
            opacity={edge.highlight ? 0.9 : edge.type === 'relevant' ? 0.7 : 0.4}
            className="dark:stroke-zinc-600"
          />
        ))}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const colors = getNodeColors(node, i);
          const isHovered = hoveredNode === node.id;
          const isSelected = selectedNode === node.id;

          return (
            <g
              key={node.id}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => handleNodeClick(node)}
            >
              {/* Glow effect on hover/select */}
              {(isHovered || isSelected) && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius + 6}
                  fill="none"
                  stroke={node.isRelevant ? '#6366f1' : '#64748b'}
                  strokeWidth="2"
                  opacity="0.4"
                />
              )}

              {/* Main node circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={isSelected ? 3 : 2}
                className="transition-all duration-200"
              />

              {/* Node number */}
              <text
                x={node.x}
                y={node.y + 5}
                textAnchor="middle"
                fontSize={node.isRelevant ? 13 : 11}
                fill={colors.textFill}
                fontWeight={node.isRelevant ? 700 : 600}
                style={{ pointerEvents: 'none' }}
              >
                {i + 1}
              </text>

              {/* Relevance indicator */}
              {node.isRelevant && (
                <circle
                  cx={node.x + node.radius - 4}
                  cy={node.y - node.radius + 4}
                  r={6}
                  fill="#22c55e"
                  stroke="#fff"
                  strokeWidth="2"
                />
              )}
            </g>
          );
        })}

        {/* Tooltip */}
        {hoveredNode && (() => {
          const node = nodes.find(n => n.id === hoveredNode);
          if (!node) return null;

          const tooltipWidth = 180;
          const tooltipHeight = 60;
          let tooltipX = node.x - tooltipWidth / 2;
          let tooltipY = node.y - node.radius - tooltipHeight - 10;

          // Keep tooltip in bounds
          if (tooltipX < 5) tooltipX = 5;
          if (tooltipX + tooltipWidth > width - 5) tooltipX = width - tooltipWidth - 5;
          if (tooltipY < 5) tooltipY = node.y + node.radius + 10;

          return (
            <g>
              <rect
                x={tooltipX}
                y={tooltipY}
                width={tooltipWidth}
                height={tooltipHeight}
                rx="6"
                fill="white"
                stroke="#e2e8f0"
                strokeWidth="1"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                className="dark:fill-zinc-800 dark:stroke-zinc-700"
              />
              <text
                x={tooltipX + 8}
                y={tooltipY + 18}
                fontSize="11"
                fontWeight="600"
                fill="#1f2937"
                className="dark:fill-zinc-100"
              >
                {node.title?.length > 22 ? node.title.slice(0, 20) + '…' : node.title}
              </text>
              <text
                x={tooltipX + 8}
                y={tooltipY + 34}
                fontSize="10"
                fill="#6b7280"
                className="dark:fill-zinc-400"
              >
                {node.speaker || 'Unknown speaker'}
              </text>
              <text
                x={tooltipX + 8}
                y={tooltipY + 50}
                fontSize="9"
                fill={node.isRelevant ? '#6366f1' : '#9ca3af'}
              >
                {node.isRelevant ? '★ Most Relevant' : '○ Related Context'}
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Document list below graph */}
      <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
        <div className="text-xs text-zinc-500 mb-2">Click a node to view document</div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {nodes.map((node, i) => (
            <button
              key={node.id}
              onClick={() => handleNodeClick(node)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-150
                ${selectedNode === node.id
                  ? 'ring-2 ring-offset-1 ring-indigo-500'
                  : ''
                }
                ${node.isRelevant
                  ? hoveredNode === node.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-200'
                  : hoveredNode === node.id
                    ? 'bg-zinc-500 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300'
                }`}
              title={node.title}
            >
              <span className="font-bold mr-1">{i + 1}.</span>
              {node.title?.length > 16 ? node.title.slice(0, 14) + '…' : node.title}
            </button>
          ))}
        </div>
      </div>

      {/* Selected document info */}
      {selectedNode && (() => {
        const node = nodes.find(n => n.id === selectedNode);
        if (!node) return null;

        return (
          <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{node.title}</div>
                <div className="text-xs text-zinc-500 mt-1">
                  {node.speaker && <span>{node.speaker}</span>}
                  {node.date && <span className="ml-2">• {node.date}</span>}
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                node.isRelevant
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
              }`}>
                {node.isRelevant ? 'Relevant' : 'Context'}
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
