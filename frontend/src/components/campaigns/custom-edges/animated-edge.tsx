'use client'

import React from 'react';
import {
    BaseEdge,
    EdgeProps,
    getSmoothStepPath,
    EdgeLabelRenderer
} from '@xyflow/react';
import { useNodeStatus } from '../node-validation-context';

// ============================================================================
// ANIMATED EDGE: Premium edge with flow direction animation
// Inspired by: Make.com, n8n animated connections
// ============================================================================

export function AnimatedEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    label,
    selected,
    source,
}: EdgeProps) {
    const sourceStatus = useNodeStatus(source);
    const isError = sourceStatus.state === 'ERROR';
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 16,
    });

    return (
        <>
            {/* Background stroke for depth */}
            <path
                id={`${id}-bg`}
                className="react-flow__edge-path"
                d={edgePath}
                strokeWidth={6}
                stroke="#e2e8f0"
                fill="none"
                strokeLinecap="round"
            />

            {/* Main edge path */}
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    strokeWidth: 3,
                    stroke: isError ? '#ef4444' : selected ? '#6366f1' : '#94a3b8',
                    strokeDasharray: isError ? '4 4' : 'none',
                    ...style,
                }}
            />

            {/* Animated flow indicator */}
            {!isError && (
                <path
                    d={edgePath}
                    fill="none"
                    strokeWidth={3}
                    stroke="url(#flow-gradient)"
                    strokeLinecap="round"
                    strokeDasharray="8 12"
                    className="animate-flow"
                />
            )}

            {/* Edge label if provided */}
            {label && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'all',
                        }}
                        className="px-2 py-1 bg-white rounded-full text-[10px] font-bold text-gray-500 shadow-sm border border-gray-100 uppercase tracking-wide"
                    >
                        {label}
                    </div>
                </EdgeLabelRenderer>
            )}

            {/* SVG Gradient Definition */}
            <defs>
                <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
                    <stop offset="50%" stopColor="#6366f1" stopOpacity="1" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
            </defs>
        </>
    );
}

// Add this to your global CSS:
// @keyframes flow { 0% { stroke-dashoffset: 24; } 100% { stroke-dashoffset: 0; } }
// .animate-flow { animation: flow 1s linear infinite; }
