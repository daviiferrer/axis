"use client";

export function DynamicBackground() {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-white">
            {/* --- NOISE TEXTURE --- */}
            <div
                className="absolute inset-0 z-40 opacity-[0.4] mix-blend-overlay pointer-events-none"
                style={{
                    filter: "contrast(100%) brightness(100%)",
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
                    backgroundRepeat: 'repeat',
                }}
            />

            {/* --- STATIC AMBIENT GLOW (Light Mode: Blue/Cyan) --- */}
            {/* Top Left - Fresh/Tech Hint - Reduced Blur for Perf */}
            <div className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-blue-100/80 rounded-full blur-[80px] opacity-60 will-change-transform" />

            {/* Bottom Right - Trust/Stability Hint - Reduced Blur for Perf */}
            <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-cyan-50/80 rounded-full blur-[90px] opacity-50 will-change-transform" />
        </div>
    );
}
