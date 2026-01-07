import Image from "next/image";
import Link from "next/link";
import { HeroText } from "@/components/landing/hero-text";
import { WhatsappDemo } from "@/components/landing/whatsapp-demo";

export default function Home() {
    return (
        <main className="w-full bg-[#080A10] text-white selection:bg-blue-500/30">
            {/* Hero Section */}
            <section className="relative h-screen w-full overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 z-0 opacity-10"
                    style={{
                        backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                        maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
                    }}>
                </div>

                {/* Logo + Login */}
                <div className="absolute top-6 md:top-8 left-0 right-0 z-50 w-full max-w-[1400px] mx-auto px-4 md:px-12 pointer-events-none flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="pointer-events-auto">
                        <Image
                            src="/logo.svg"
                            alt="AXIS Logo"
                            width={180}
                            height={60}
                            className="h-20 md:h-20 w-auto opacity-90 hover:opacity-100 transition-opacity invert ml-2 drop-shadow-[0_0_25px_rgba(255,255,255,0.15)]"
                        />
                    </Link>

                    {/* Login Button */}
                    <Link href="/auth/login" className="pointer-events-auto px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium">
                        Entrar
                    </Link>
                </div>

                {/* Main Layout Container - Absolute Overlay for Centering */}
                <div className="relative md:absolute md:inset-0 z-30 w-full max-w-[1400px] mx-auto px-4 md:px-12 pointer-events-none h-full flex flex-col justify-center md:block">
                    {/* Text Content - Animated */}
                    <div className="pointer-events-auto">
                        <HeroText />
                    </div>

                    {/* Whatsapp Demo - Animated */}
                    <WhatsappDemo />
                </div>

                {/* Aurora Background Effect */}
                <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vh] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none z-0 mix-blend-screen animate-pulse" />
            </section>

            {/* Next Section - Clients / Features (Seamless Transition) */}
            <section className="min-h-screen bg-gradient-to-b from-[#080A10] via-[#0B0E14] to-[#0B0E14] relative z-40 py-24 px-4 md:px-12 flex flex-col items-center">
                <div className="max-w-4xl mx-auto w-full text-center">
                    {/* Visual Connector - Subtle Down Arrow or Line */}
                    <div className="w-[1px] h-24 bg-gradient-to-b from-transparent to-blue-500/50 mx-auto mb-12 opacity-30"></div>

                    <h2 className="text-3xl md:text-5xl font-bold mb-12 text-gray-200">
                        Empresas que escalam com Áxis
                    </h2>

                    {/* Placeholder Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="h-20 bg-white/5 rounded-lg border border-white/5 flex items-center justify-center text-sm text-gray-500 font-mono">
                                LOGO {i}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
