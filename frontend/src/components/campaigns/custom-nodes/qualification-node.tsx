'use client'

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Flag, CheckCircle2, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const QualificationNode = memo(({ data, isConnectable, selected }: any) => {
    const slots = data.criticalSlots || ['budget', 'authority', 'need', 'timeline'];

    // Determine status (mock visual for now, or based on real runtime data if available later)
    const isComplete = false;

    return (
        <div className={`
            w-[240px] rounded-2xl border transition-all duration-300 backdrop-blur-md overflow-hidden relative
            ${selected
                ? 'bg-white/95 border-green-400 ring-4 ring-green-500/10 shadow-xl'
                : 'bg-white/90 border-gray-200 hover:border-green-300 hover:shadow-lg'
            }
        `}>
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white transition-all hover:!bg-green-600 !-left-1.5"
            />

            {/* Header */}
            <div className="p-3 border-b border-gray-100 flex items-center gap-3 bg-green-50/30">
                <div className={`p-1.5 rounded-lg ${selected ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'}`}>
                    <Flag size={14} strokeWidth={2} />
                </div>
                <div className="flex-1">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">SDR QUALIFY</h3>
                    <p className="text-[10px] text-gray-400 font-medium">{slots.length} Critical Slots</p>
                </div>
            </div>

            {/* Slots Visualizer */}
            <div className="p-3 space-y-2">
                <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider mb-2">Required Data Points</p>
                <div className="grid grid-cols-2 gap-2">
                    {slots.map((slot: string) => (
                        <div key={slot} className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded border border-gray-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400/50" />
                            <span className="text-[10px] font-medium text-gray-600 capitalize">{slot}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Paths */}
            <div className="bg-gray-50/50 border-t border-gray-100 p-0 flex flex-col">
                {/* Success Path */}
                <div className="relative p-2.5 flex justify-between items-center hover:bg-green-50/50 transition-colors">
                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                        <CheckCircle2 size={10} /> Qualified
                    </span>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="qualified"
                        isConnectable={isConnectable}
                        className="!w-2.5 !h-2.5 !bg-green-500 !border-2 !border-white !-right-1.5"
                    />
                </div>

                {/* Fallback Path (Wait) */}
                <div className="relative p-2.5 flex justify-between items-center hover:bg-gray-100/50 transition-colors border-t border-gray-100/50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                        <Circle size={10} /> In-Progress
                    </span>
                    {/* Usually qualification node loops on itself or has a timeout, 
                         but for visual flow we might just show the "qualified" exit. 
                         Let's keep just specific Exits or default. 
                         Actually QualificationNode usually just exits "success" when done.
                         So one handle is fine, but visually distinguishing "Qualified" is good.
                     */}
                </div>
            </div>

            <div className="absolute top-0 right-0 p-2 opacity-50">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/10 to-transparent blur-xl rounded-full translate-x-8 -translate-y-8" />
            </div>
        </div>
    );
});
