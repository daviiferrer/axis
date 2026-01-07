import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex bg-[#080A10] text-white overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Left Side - Login Form (40%) */}
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
                    <h2 className="text-2xl font-bold mb-2">Bem-vindo de volta</h2>
                    <p className="text-gray-400 mb-8">Entre com suas credenciais para acessar seu painel.</p>

                    <form className="space-y-5">
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
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-gray-300">Senha</Label>
                                <Link href="#" className="text-sm text-blue-500 hover:text-blue-400">Esqueceu?</Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                className="bg-[#080A10] border-gray-700/50 text-white placeholder:text-gray-600 focus-visible:ring-blue-500/30 h-11"
                            />
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 mt-2">
                            Entrar
                        </Button>
                    </form>

                    <div className="text-center text-sm text-gray-400 mt-6">
                        Não tem uma conta?{" "}
                        <Link href="/auth/register" className="text-blue-500 hover:text-blue-400 font-medium">
                            Criar agora
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
                        Qualifique leads e feche vendas <span className="text-blue-500">24/7</span>
                    </h1>
                    <p className="text-lg text-gray-400">
                        Seu melhor SDR trabalhando no WhatsApp enquanto você foca no que importa.
                    </p>
                </div>
            </div>
        </div>
    );
}
