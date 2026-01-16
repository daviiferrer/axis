"use client"

import { useState } from "react"
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/forms/button"

export function LazyMotionDemo() {
    const [show, setShow] = useState(false)

    return (
        <LazyMotion features={domAnimation}>
            <div className="flex flex-col items-center gap-6 p-6 border rounded-xl bg-card">
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">Lazy Motion &amp; Bundle Size</h3>
                    <p className="text-sm text-muted-foreground max-w-[300px]">
                        Animations are code-split and loaded only when needed using the <code className="bg-muted px-1 rounded">m</code> component.
                    </p>
                </div>

                <div className="h-32 w-32 relative flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {show ? (
                            <m.div
                                key="circle"
                                initial={{ opacity: 0, scale: 0.5, borderRadius: "20%" }}
                                animate={{ opacity: 1, scale: 1, borderRadius: "50%" }}
                                exit={{ opacity: 0, scale: 0.5, borderRadius: "20%" }}
                                transition={{ duration: 0.4 }}
                                className="absolute inset-0 bg-primary"
                            />
                        ) : (
                            <m.div
                                key="square"
                                initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                                transition={{ duration: 0.4 }}
                                className="absolute inset-0 bg-secondary"
                            />
                        )}
                    </AnimatePresence>
                </div>

                <Button onClick={() => setShow(!show)} variant="outline">
                    Toggle Shape
                </Button>
            </div>
        </LazyMotion>
    )
}
