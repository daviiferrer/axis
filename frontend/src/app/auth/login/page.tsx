'use client'

import { Button } from "@/components/ui/forms/button";
import { Input } from "@/components/ui/forms/input";
import { Label } from "@/components/ui/forms/label";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AiKanbanAnimation } from "@/components/auth/AiKanbanAnimation";

export default function LoginPage() {
    const { signInWithEmail, signInWithGoogle, user, loading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push('/app');
        }
    }, [user, loading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const { error } = await signInWithEmail(email, password);

        if (error) {
            toast.error("Erro ao entrar", {
                description: error.message || "Verifique suas credenciais e tente novamente."
            });
            setIsLoading(false);
        } else {
            toast.success("Login realizado com sucesso!");
            // Redirect handled by AuthContext
        }
    };

    return (
        <div className="min-h-screen flex bg-white text-gray-900 overflow-hidden selection:bg-blue-100">
            {/* Left Side - Login Form */}
            <div className="w-full lg:w-1/2 xl:w-[40%] h-screen flex flex-col justify-center items-center px-6 sm:px-12 md:px-16 bg-white relative overflow-y-auto">

                {/* Form Container */}
                <div className="w-full max-w-[360px] flex flex-col items-center sm:items-start py-8">

                    {/* Logo - Adjusted for correct proportion */}
                    <Link href="/" className="mb-8 drop-shadow-sm hover:opacity-90 transition-opacity">
                        <Image
                            src="/assets/brand/logo.svg"
                            alt="AXIS Logo"
                            width={120}
                            height={32}
                            className="h-8 w-auto"
                            priority
                        />
                    </Link>

                    <div className="w-full text-center sm:text-left">
                        <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-slate-900 tracking-tight">Bem-vindo(a)</h2>
                        <p className="text-sm sm:text-base text-slate-500 mb-8 font-medium">Faça login para acessar o seu painel.</p>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="space-y-1.5 text-left">
                                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-12 rounded-full px-5 transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5 text-left">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Senha</Label>
                                    <Link href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">Esqueceu a senha?</Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-12 rounded-full px-5 transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 mt-4 rounded-full font-semibold shadow-md shadow-blue-600/20 disabled:opacity-70 transition-all"
                            >
                                {isLoading ? "Entrando..." : "Entrar na plataforma"}
                            </Button>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-200" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase font-semibold">
                                    <span className="bg-white px-3 text-slate-400">Ou continue com</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-12 border-slate-200 text-slate-700 font-semibold rounded-full hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                                onClick={async () => {
                                    const { error } = await signInWithGoogle();
                                    if (error) toast.error("Erro ao entrar com Google");
                                }}
                            >
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.29-.19-.55z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Conta Google
                            </Button>
                        </form>

                        <div className="text-center text-sm text-slate-600 mt-8 font-medium">
                            Não tem uma conta?{" "}
                            <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
                                Criar agora
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Return Home - Mobile only at bottom */}
                <div className="mt-auto pb-6 sm:absolute sm:top-8 sm:right-8 sm:mt-0 lg:hidden">
                    <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">
                        Voltar para o site
                    </Link>
                </div>
            </div>

            {/* Right Side - Branding / Kanban Animation */}
            <div className="hidden lg:flex w-1/2 xl:w-[60%] h-screen relative items-center justify-center overflow-hidden bg-[#F8FAFC] border-l border-slate-100">
                {/* Modern subtle ambient gradients */}
                <div className="absolute top-[-20%] left-[-10%] w-full h-[80%] bg-blue-100/30 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-10%] w-full h-[80%] bg-purple-100/20 blur-[120px] rounded-full pointer-events-none" />

                {/* Light dot pattern for depth */}
                <div className="absolute inset-0 z-0 opacity-[0.3]"
                    style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
                </div>

                <div className="relative z-10 w-full flex flex-col items-center max-w-4xl px-8">
                    <div className="mb-10 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Pipeline de Vendas com IA
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm font-inter">
                            Deixe a IA vender por você
                        </h1>
                        <p className="mt-4 text-slate-600 text-lg max-w-xl mx-auto font-medium">
                            Enquanto você dorme, nossa IA qualifica, negocia e fecha vendas de forma 100% autônoma no WhatsApp.
                        </p>
                    </div>

                    {/* Animated Kanban Component */}
                    <div className="w-full">
                        <AiKanbanAnimation />
                    </div>
                </div>
            </div>
        </div >
    );
}
