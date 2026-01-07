"use client";

import { motion } from "framer-motion";

export default function PageTransition({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{
                duration: 0.8,
                ease: [0, 0.71, 0.2, 1.01],
                scale: {
                    type: "spring",
                    damping: 15,
                    stiffness: 100,
                    restDelta: 0.001
                }
            }}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    );
}
