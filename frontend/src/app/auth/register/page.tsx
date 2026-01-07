import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex bg-[#080A10] text-white overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Left Side - Register Form (40%) */}
            <div className="w-full lg:w-[40%] h-screen flex flex-col justify-center items-center px-8 md:px-16 bg-[#0B0E14] relative">
                {/* Mobile Logo */}
                <div className="lg:hidden mb-8">
                    <Link href="/">
                        <Image
                            src="/logo.svg"
                            alt="AXIS Logo"
                            width={160}
                            height={50}
                            className="h-12 w-auto opacity-90 invert"
                        />
                    </Link>
                </div>

                {/* Form Container */}
                <div className="w-full max-w-sm">
                    <h2 className="text-2xl font-bold mb-2">Criar sua conta</h2>
                    <p className="text-gray-400 mb-8">Comece a qualificar leads automaticamente em minutos.</p>

                    <form className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-gray-300">Nome completo</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Seu nome"
                                className="bg-[#080A10] border-gray-700/50 text-white placeholder:text-gray-600 focus-visible:ring-blue-500/30 h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                className="bg-[#080A10] border-gray-700/50 text-white placeholder:text-gray-600 focus-visible:ring-blue-500/30 h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-300">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Mínimo 8 caracteres"
                                className="bg-[#080A10] border-gray-700/50 text-white placeholder:text-gray-600 focus-visible:ring-blue-500/30 h-11"
                            />
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 mt-2">
                            Criar conta grátis
                        </Button>
                    </form>

                    <p className="text-xs text-gray-500 mt-4 text-center">
                        Ao criar sua conta, você concorda com nossos{" "}
                        <Link href="/legal/terms" className="text-blue-500 hover:underline">Termos de Uso</Link>{" "}e{" "}
                        <Link href="/legal/privacy" className="text-blue-500 hover:underline">Política de Privacidade</Link>.
                    </p>

                    <div className="text-center text-sm text-gray-400 mt-6">
                        Já tem uma conta?{" "}
                        <Link href="/auth/login" className="text-blue-500 hover:text-blue-400 font-medium">
                            Entrar
                        </Link>
                    </div>
                </div>

                {/* Back to Home - Bottom */}
                <Link href="/" className="absolute bottom-8 text-sm text-gray-500 hover:text-white transition-colors">
                    ← Voltar para Home
                </Link>
            </div>

            {/* Right Side - Branding / Illustration (60%) */}
            <div className="hidden lg:flex w-[60%] h-screen relative items-center justify-center overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366F1]/20 blur-[120px] rounded-full pointer-events-none z-0" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[60%] bg-[#10B981]/15 blur-[120px] rounded-full pointer-events-none z-0" />

                {/* Dot Grid Texture */}
                <div className="absolute inset-0 z-0 opacity-[0.05]"
                    style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                </div>

                {/* Branding Content */}
                <div className="relative z-10 px-16 max-w-2xl">
                    <Link href="/">
                        <Image
                            src="/logo.svg"
                            alt="AXIS Logo"
                            width={200}
                            height={70}
                            className="h-16 w-auto opacity-90 invert mb-8"
                        />
                    </Link>
                    <h1 className="text-4xl font-bold leading-tight mb-4">
                        Comece a vender mais <span className="text-blue-500">hoje mesmo</span>
                    </h1>
                    <p className="text-lg text-gray-400">
                        Configure em 10 minutos. Sem necessidade de conhecimento técnico.
                    </p>
                </div>
            </div>
        </div>
    );
}
