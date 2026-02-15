"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useEffect, useState } from "react";

export function AnimatedLogo() {
    const { scrollY } = useScroll();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Listen to scroll changes and set binary state
    // Threshold: 50px
    useMotionValueEvent(scrollY, "change", (latest) => {
        if (latest > 50 && !isCollapsed) {
            setIsCollapsed(true);
        } else if (latest <= 50 && isCollapsed) {
            setIsCollapsed(false);
        }
    });

    // VARIANTS: Control the "Wipe" effect via Mask Width

    // Mask for X (Starts at x=20, width~45)
    const maskXVariants = {
        open: {
            width: 50,
            x: 20,
            transition: { type: "spring" as const, stiffness: 100, damping: 20, mass: 1 }
        },
        collapsed: {
            width: 0,
            x: 20,
            transition: { type: "spring" as const, stiffness: 100, damping: 20, mass: 1 }
        }
    };

    // Mask for S (Starts at x=80, width~35)
    const maskSVariants = {
        open: {
            width: 40,
            x: 75,
            transition: { type: "spring" as const, stiffness: 100, damping: 20, mass: 1 }
        },
        collapsed: {
            width: 0,
            x: 75,
            transition: { type: "spring" as const, stiffness: 100, damping: 20, mass: 1 }
        }
    };

    // I moves left to dock with A
    const moveIVariants = {
        open: {
            x: 0,
            transition: { type: "spring" as const, stiffness: 100, damping: 20, mass: 1 }
        },
        collapsed: {
            x: -30,
            transition: { type: "spring" as const, stiffness: 100, damping: 20, mass: 1 }
        }
    };

    // Opacity fade for extra smoothness (optional, keeps it clean)
    const fadeVariants = {
        open: { opacity: 1, transition: { duration: 0.2 } },
        collapsed: { opacity: 0, transition: { duration: 0.2, delay: 0.1 } }
    };

    if (!isMounted) return null;

    return (
        <svg
            id="Camada_2"
            data-name="Camada 2"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 112.57 32.94"
            className="h-6 w-auto"
        >
            <defs>
                <style>
                    {`.cls-1{fill:#006ae0;}.cls-2{fill:#033655;}`}
                </style>
                {/* Mask for X */}
                <clipPath id="clip-x">
                    <motion.rect
                        height="40"
                        y="0"
                        initial="open"
                        animate={isCollapsed ? "collapsed" : "open"}
                        variants={maskXVariants}
                    />
                </clipPath>
                {/* Mask for S */}
                <clipPath id="clip-s">
                    <motion.rect
                        height="40"
                        y="0"
                        initial="open"
                        animate={isCollapsed ? "collapsed" : "open"}
                        variants={maskSVariants}
                    />
                </clipPath>
            </defs>
            <g id="Camada_1-2" data-name="Camada 1">
                <g id="letters-group">

                    {/* Letter S - Wipe Out */}
                    <motion.g
                        id="letter-s"
                        clipPath="url(#clip-s)"
                        animate={isCollapsed ? "collapsed" : "open"}
                        variants={fadeVariants}
                    >
                        <path className="cls-2" d="M112.46,25.03c.58,3.51-2.17,7.71-5.9,7.73l-26.61.18v-4.84s26.1-.05,26.1-.05c1.07,0,1.79-1.43,1.69-2.19-.13-.97-.79-2.04-1.88-2.05l-19.58-.16c-3.62-.03-6.15-3.25-6.38-6.52-.23-3.18,1.96-7.29,5.66-7.33l27-.25v4.85s-26.47.06-26.47.06c-.97.36-1.45,1.68-1.39,2.45.07.89.86,1.98,2.03,1.99l19.61.15c3.13.02,5.58,2.74,6.11,5.97Z" />
                    </motion.g>

                    {/* Letter X - Wipe Out */}
                    <motion.g
                        id="letter-x"
                        clipPath="url(#clip-x)"
                        animate={isCollapsed ? "collapsed" : "open"}
                        variants={fadeVariants}
                    >
                        <path className="cls-2" d="M60.81,32.83c-2.29-2.29-4.69-4.2-7.06-6.4l-1.83-1.71c-1.03.41-1.58,1.35-2.4,1.96-.47.35-4.24,3.77-4.8,4.33-.64.64-1.47,1.03-2.01,1.88l-7.25-.05,12.71-11.42-13.16-11.77,7.17-.02,9.59,8.58,9.67-8.62,7.11.07-10.79,9.64c-.84.75-1.58,1.44-2.29,2.22l12.57,11.28c-2.41.14-4.77.14-7.23.02Z" />
                    </motion.g>

                    {/* Letter I - Moves Left */}
                    <motion.g
                        id="letter-i"
                        animate={isCollapsed ? "collapsed" : "open"}
                        variants={moveIVariants}
                    >
                        <polygon className="cls-2" points="76.59 32.84 71.78 32.88 71.78 9.62 76.59 9.62 76.59 32.84" />
                    </motion.g>

                    {/* Letter A - Static */}
                    <g id="letter-a">
                        <path className="cls-2" d="M18.58,14.39c-.75.01-1.28-.02-2,.05l-3.83,6.44c-1,1.69-1.93,3.32-2.95,4.99l-4.29,7.01H0S12.43,11.98,12.43,11.98c1.18-1.99,2.91-2.49,5.15-2.44,1.93.04,3.79.21,4.94,2.13l12.77,21.2-5.57.04-7.2-11.93-3.94-6.59Z" />
                        <path className="cls-1" d="M19.28,6.28c-.39.66-.98.98-1.61.98s-1.22-.32-1.61-.98l-2.13-3.61c-.29-.48-.29-1.18-.13-1.68.12-.37.51-.92,1.14-.94,1.83-.06,3.62-.06,5.45,0,.63.02,1.02.57,1.14.96.15.48.16,1.18-.13,1.67l-2.13,3.61Z" />
                    </g>
                </g>
            </g>
        </svg>
    );
}
