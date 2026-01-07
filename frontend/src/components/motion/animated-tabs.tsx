"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type Tab = {
    id: string
    label: string
}

interface AnimatedTabsProps {
    tabs: Tab[]
    defaultTab?: string
    className?: string
}

export function AnimatedTabs({ tabs, defaultTab, className }: AnimatedTabsProps) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0].id)

    return (
        <div className={cn("flex space-x-1 p-1 bg-muted/50 rounded-full", className)}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                        "relative rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2",
                        activeTab === tab.id
                            ? "text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                    style={{
                        WebkitTapHighlightColor: "transparent",
                    }}
                >
                    {activeTab === tab.id && (
                        <motion.span
                            layoutId="bubble"
                            className="absolute inset-0 z-10 bg-primary"
                            style={{ borderRadius: 9999 }}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <span className="relative z-20">{tab.label}</span>
                </button>
            ))}
        </div>
    )
}
