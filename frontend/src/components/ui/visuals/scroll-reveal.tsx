"use client";

import { motion, useInView, useAnimation, Variant } from "motion/react";
import { useEffect, useRef } from "react";

interface ScrollRevealProps {
    children: React.ReactNode;
    width?: "fit-content" | "100%";
    mode?: "default" | "fade-up" | "slide-left" | "slide-right" | "pop";
    delay?: number;
    className?: string;
    viewportAmount?: number; // 0 to 1
}

export const ScrollReveal = ({
    children,
    width = "fit-content",
    mode = "default",
    delay = 0,
    className = "",
    viewportAmount = 0.3
}: ScrollRevealProps) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: viewportAmount });
    const mainControls = useAnimation();

    useEffect(() => {
        if (isInView) {
            mainControls.start("visible");
        }
    }, [isInView, mainControls]);

    const variants: Record<string, { hidden: Variant; visible: Variant }> = {
        default: {
            hidden: { opacity: 0, y: 75 },
            visible: { opacity: 1, y: 0 },
        },
        "fade-up": {
            hidden: { opacity: 0, y: 50 },
            visible: { opacity: 1, y: 0 },
        },
        "slide-left": {
            hidden: { opacity: 0, x: -75 },
            visible: { opacity: 1, x: 0 },
        },
        "slide-right": {
            hidden: { opacity: 0, x: 75 },
            visible: { opacity: 1, x: 0 },
        },
        "pop": {
            hidden: { opacity: 0, scale: 0.8 },
            visible: { opacity: 1, scale: 1 },
        }
    };

    const selectedVariant = variants[mode] || variants.default;

    return (
        <div ref={ref} style={{ position: "relative", width, overflow: "hidden" }} className={className}>
            <motion.div
                variants={selectedVariant}
                initial="hidden"
                animate={mainControls}
                transition={{ duration: 0.6, delay: delay, ease: [0.22, 1, 0.36, 1] }} // Custom easing for "premium" feel (easeOutQuart ish)
            >
                {children}
            </motion.div>
        </div>
    );
};
