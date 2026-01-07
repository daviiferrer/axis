"use client"

import * as React from "react"
import { Reorder, useDragControls, useMotionValue } from "framer-motion"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

interface Item {
    id: string
    label: string
    color: string
}

const initialItems: Item[] = [
    { id: "1", label: "Animation", color: "bg-orange-500" },
    { id: "2", label: "Performance", color: "bg-blue-500" },
    { id: "3", label: "Accessibility", color: "bg-green-500" },
    { id: "4", label: "Interaction", color: "bg-pink-500" },
]

export function ReorderListDemo() {
    const [items, setItems] = React.useState(initialItems)

    return (
        <div className="w-full max-w-sm mx-auto p-4 bg-background border rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Drag to Reorder</h3>
            <Reorder.Group axis="y" onReorder={setItems} values={items} className="space-y-2">
                {items.map((item) => (
                    <ReorderItem key={item.id} item={item} />
                ))}
            </Reorder.Group>
        </div>
    )
}

function ReorderItem({ item }: { item: Item }) {
    const y = useMotionValue(0)
    const dragControls = useDragControls()

    return (
        <Reorder.Item
            value={item}
            id={item.id}
            style={{ y }}
            dragListener={false}
            dragControls={dragControls}
            className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm select-none relative"
        >
            <div
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                onPointerDown={(e) => dragControls.start(e)}
            >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold", item.color)}>
                {item.label[0]}
            </div>
            <span className="font-medium">{item.label}</span>
        </Reorder.Item>
    )
}
