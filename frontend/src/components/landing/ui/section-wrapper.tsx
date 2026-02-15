import { cn } from "@/lib/utils";

interface SectionWrapperProps {
    children: React.ReactNode;
    className?: string;
    id?: string;
    background?: "white" | "gray" | "dark";
}

export function SectionWrapper({
    children,
    className,
    id,
    background = "white"
}: SectionWrapperProps) {
    const bgColors = {
        white: "bg-white border-b border-gray-100",
        gray: "bg-gray-50 border-b border-gray-200",
        dark: "bg-neutral-950 border-b border-neutral-900 text-white"
    };

    return (
        <section
            id={id}
            className={cn(
                "w-full py-20 md:py-32 relative overflow-hidden",
                bgColors[background],
                className
            )}
        >
            <div className="w-full max-w-7xl mx-auto px-6 md:px-12 relative z-10">
                {children}
            </div>
        </section>
    );
}
