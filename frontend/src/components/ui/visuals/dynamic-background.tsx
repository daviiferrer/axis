"use client";

import { motion, useScroll, useTransform } from "motion/react";

export function DynamicBackground() {
    // Listen to global page scroll
    const { scrollYProgress } = useScroll();

    // Mapping Scroll Position (0 to 1) to Colors
    // 0.0 - 0.2: Hero (White/Blue)
    // 0.2 - 0.5: Agitation (Dark Navy/Red)
    // 0.5 - 0.8: Solution (Blue/White)
    // 0.8 - 1.0: CTA (White)
    const backgroundColor = useTransform(
        scrollYProgress,
        [0, 0.2, 0.5, 0.8],
        ["#ffffff", "#020617", "#ffffff", "#f8fafc"] // White -> Dark Slate (950) -> White -> Slate 50
    );

    // Orb Colors Control
    const orb1Color = useTransform(scrollYProgress, [0, 0.2], ["rgba(219, 234, 254, 0.6)", "rgba(100, 20, 20, 0.4)"]); // Blue -> Dark Red
    const orb2Color = useTransform(scrollYProgress, [0, 0.2], ["rgba(236, 254, 255, 0.6)", "rgba(0, 0, 0, 0.8)"]); // Cyan -> Black

    return (
        <motion.div
            className="fixed inset-0 z-[-1] overflow-hidden transition-colors duration-700 ease-out"
            style={{ backgroundColor }}
        >
            {/* Ambient Glows */}
            <motion.div
                className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] rounded-full blur-[100px] opacity-60 will-change-transform"
                style={{ backgroundColor: orb1Color, x: useTransform(scrollYProgress, [0, 1], [0, -100]) }}
            />
            <motion.div
                className="absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vw] rounded-full blur-[100px] opacity-50 will-change-transform"
                style={{ backgroundColor: orb2Color, x: useTransform(scrollYProgress, [0, 1], [0, 100]) }}
            />
        </motion.div>
    );
}
