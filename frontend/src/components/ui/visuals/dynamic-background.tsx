"use client";

export function DynamicBackground() {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden">


            {/* Ambient Glows com will-change para isolar as camadas de blur fixas */}
            <div className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-blue-100/60 rounded-full blur-[100px] opacity-60 will-change-transform" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-cyan-50/60 rounded-full blur-[100px] opacity-50 will-change-transform" />
        </div>
    );
}
