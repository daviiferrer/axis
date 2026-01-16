"use client";

import { motion, LazyMotion, domAnimation } from "framer-motion";

export default function PageTransition({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        /* LazyMotion reduz o peso do JS inicial, liberando a Main Thread */
        <LazyMotion features={domAnimation}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1], // Curva suave mas performática
                    scale: {
                        type: "spring",
                        damping: 20,    // Menos oscilação = menos repaints
                        stiffness: 100,
                        restDelta: 0.01 // Aumentado para parar o cálculo mais cedo
                    },
                    filter: {
                        duration: 0.4, // Remove o blur um pouco mais rápido que a escala
                        ease: "easeOut"
                    }
                }}
                /* Força o navegador a criar uma camada na GPU antes da animação começar */
                className="w-full h-full will-change-[transform,opacity,filter]"
                style={{
                    backfaceVisibility: "hidden",
                    transform: "translateZ(0)"
                }}
            >
                {children}
            </motion.div>
        </LazyMotion>
    );
}
