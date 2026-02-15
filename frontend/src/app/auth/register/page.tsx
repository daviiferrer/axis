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

export default function RegisterPage() {
    const { signUpWithEmail, signInWithGoogle } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const { error } = await signUpWithEmail(email, password, name);

        if (error) {
            toast.error("Erro ao criar conta", {
                description: error.message || "Tente novamente mais tarde."
            });
            setIsLoading(false);
        } else {
            toast.success("Conta criada com sucesso!", {
                description: "Verifique seu email para confirmar o cadastro."
            });
            // Depending on Supabase config, maybe redirect to login or dashboard
            // For now, let's redirect to login for them to confirmed
            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);
        }
    };

    return (
        <div className="min-h-screen flex bg-white text-gray-900 overflow-hidden selection:bg-blue-100">
            {/* Left Side - Register Form (40%) */}
            <div className="w-full lg:w-[40%] h-screen flex flex-col justify-center items-center px-8 md:px-16 bg-white relative">

                {/* Back to Home - Top Right */}
                <Link href="/" className="absolute top-6 right-6 md:top-8 md:right-8 text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium">
                    Voltar para Home
                </Link>

                {/* Form Container */}
                <div className="w-full max-w-sm flex flex-col items-start">

                    {/* Logo - Matching Hero Size/Style */}
                    <div className="mb-[15px]">
                        <Link href="/">
                            <Image
                                src="/assets/brand/logo.svg"
                                alt="AXIS Logo"
                                width={160}
                                height={50}
                                className="h-10 md:h-12 w-auto opacity-90 hover:opacity-100 transition-opacity"
                            />
                        </Link>
                    </div>

                    <div className="w-full">
                        <h2 className="text-2xl font-bold mb-2 text-gray-900">Criar sua conta</h2>
                        <p className="text-gray-500 mb-8">Comece a qualificar leads automaticamente em minutos.</p>

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-gray-700">Nome completo</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Seu nome"
                                    className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500 h-11"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-700">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500 h-11"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-gray-700">Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Mínimo 8 caracteres"
                                    className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-blue-500 h-11"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 mt-2 shadow-lg shadow-blue-600/20 disabled:opacity-70"
                            >
                                {isLoading ? "Criando conta..." : "Criar conta grátis"}
                            </Button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-gray-500">Ou continue com</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-11 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                onClick={async () => {
                                    const { error } = await signInWithGoogle();
                                    if (error) toast.error("Erro ao cadastrar com Google");
                                }}
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.29-.19-.55z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Google
                            </Button>
                        </form>

                        <p className="text-xs text-gray-500 mt-4 text-center">
                            Ao criar sua conta, você concorda com nossos{" "}
                            <Link href="/legal/terms" className="text-blue-600 hover:underline">Termos de Uso</Link>{" "}e{" "}
                            <Link href="/legal/privacy" className="text-blue-600 hover:underline">Política de Privacidade</Link>.
                        </p>

                        <div className="text-center text-sm text-gray-500 mt-6">
                            Já tem uma conta?{" "}
                            <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 font-medium">
                                Entrar
                            </Link>
                        </div>
                    </div>
                </div>

            </div>

            {/* Right Side - Branding / Illustration (60%) */}
            <div className="hidden lg:flex w-[60%] h-screen relative items-center justify-center overflow-hidden bg-gray-50">
                {/* Ambient Glows (Matching DynamicBackground) */}
                <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-blue-100/60 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[80%] h-[80%] bg-cyan-50/60 blur-[100px] rounded-full pointer-events-none" />

                {/* Dot Grid Texture */}
                <div className="absolute inset-0 z-0 opacity-[0.4]"
                    style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                </div>

                {/* Branding Content */}
                <div className="relative z-10 px-16 max-w-2xl text-center md:text-left">
                    <h1 className="text-4xl font-bold leading-tight mb-4 text-gray-900">
                        Comece a vender mais <span className="text-blue-600">hoje mesmo</span>
                    </h1>
                    <p className="text-lg text-gray-600">
                        Configure em 10 minutos. Sem necessidade de conhecimento técnico.
                    </p>
                </div>
            </div>
        </div >
    );
}
