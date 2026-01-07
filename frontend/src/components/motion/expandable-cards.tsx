"use client"

import { useState, useId } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Card {
    id: string
    title: string
    subtitle: string
    description: string
    color: string
}

const items: Card[] = [
    {
        id: "1",
        title: "Next.js 16",
        subtitle: "The React Framework",
        description: "Next.js offers the best developer experience with all the features you need for production: hybrid static & server rendering, TypeScript support, smart bundling, route pre-fetching, and more.",
        color: "from-blue-500 to-cyan-500",
    },
    {
        id: "2",
        title: "Tailwind CSS",
        subtitle: "Utility-first CSS",
        description: "Rapidly build modern websites without ever leaving your HTML. A utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90 that can be composed to build any design, directly in your markup.",
        color: "from-teal-500 to-emerald-500",
    },
    {
        id: "3",
        title: "Motion",
        subtitle: "Animation Library",
        description: "Production-ready motion library for React. Utilize the power of declarative animations, effortless layout transitions, and shared element animations to create stunning interactive experiences.",
        color: "from-purple-500 to-pink-500",
    },
    {
        id: "4",
        title: "shadcn/ui",
        subtitle: "Re-usable components",
        description: "Beautifully designed components that you can copy and paste into your apps. Accessible. Customizable. Open Source.",
        color: "from-orange-500 to-red-500",
    },
]

export function ExpandableCards() {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const id = useId()
    const selectedItem = items.find((i) => i.id === selectedId)

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl mx-auto p-4">
                {items.map((item) => (
                    <motion.div
                        layoutId={`card-${item.id}-${id}`}
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className="cursor-pointer group relative flex flex-col justify-between overflow-hidden rounded-xl bg-card border hover:border-primary/50 hover:shadow-lg transition-shadow"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="p-6">
                            <motion.div
                                layoutId={`image-${item.id}-${id}`}
                                className={cn("h-12 w-12 rounded-lg bg-gradient-to-br mb-4", item.color)}
                            />
                            <motion.h3
                                layoutId={`title-${item.id}-${id}`}
                                className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors"
                            >
                                {item.title}
                            </motion.h3>
                            <motion.p
                                layoutId={`subtitle-${item.id}-${id}`}
                                className="text-sm text-muted-foreground"
                            >
                                {item.subtitle}
                            </motion.p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal Overlay */}
            <AnimatePresence>
                {selectedId && (
                    <div
                        className="fixed inset-0 z-50 grid place-items-center p-4"
                        onClick={() => setSelectedId(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />
                        <motion.div
                            layoutId={`card-${selectedId}-${id}`}
                            className="relative flex h-fit w-full max-w-lg flex-col overflow-hidden rounded-xl bg-card border shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    <motion.div
                                        layoutId={`image-${selectedId}-${id}`}
                                        className={cn("h-16 w-16 rounded-xl bg-gradient-to-br mb-6", selectedItem?.color)}
                                    />
                                    <button
                                        onClick={() => setSelectedId(null)}
                                        className="rounded-full p-1 hover:bg-muted transition-colors"
                                    >
                                        <X className="h-5 w-5 text-muted-foreground" />
                                    </button>
                                </div>

                                <motion.h3
                                    layoutId={`title-${selectedId}-${id}`}
                                    className="text-2xl font-bold text-foreground mb-1"
                                >
                                    {selectedItem?.title}
                                </motion.h3>
                                <motion.p
                                    layoutId={`subtitle-${selectedId}-${id}`}
                                    className="text-base text-muted-foreground mb-4"
                                >
                                    {selectedItem?.subtitle}
                                </motion.p>
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="text-sm leading-relaxed text-muted-foreground"
                                >
                                    {selectedItem?.description}
                                </motion.p>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="mt-6 flex justify-end"
                                >
                                    <button
                                        onClick={() => setSelectedId(null)}
                                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                                    >
                                        Close
                                    </button>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}
