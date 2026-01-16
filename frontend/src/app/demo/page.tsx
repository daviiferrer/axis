
import { Button } from "@/components/ui/forms/button";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";

export default function DemoPage() {
    return (
        <main className="min-h-screen w-full bg-[#080A10] text-white flex flex-col items-center justify-center p-4">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#6366F1]/20 blur-[120px] rounded-full pointer-events-none z-0" />

            <div className="z-10 flex flex-col items-center text-center max-w-2xl">
                <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
                    <Calendar className="w-8 h-8 text-blue-500" />
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-4">Agendar Demonstração</h1>
                <p className="text-gray-400 text-lg mb-8">
                    Veja como o Áxis pode transformar seu atendimento no WhatsApp.
                </p>

                <div className="p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm w-full mb-8">
                    <p className="text-sm text-gray-500 uppercase tracking-widest font-medium mb-2">Agenda do Time</p>
                    <p className="text-gray-300">O calendário de demonstração será carregado aqui.</p>
                </div>

                <Link href="/">
                    <Button variant="ghost" className="text-gray-400 hover:text-white">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar para a Home
                    </Button>
                </Link>
            </div>
        </main>
    );
}
