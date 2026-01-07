import Link from "next/link";
import Image from "next/image";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#080A10] text-white font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="border-b border-gray-800/50 py-6">
                <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
                    <Link href="/">
                        <Image
                            src="/logo.svg"
                            alt="AXIS Logo"
                            width={120}
                            height={40}
                            className="h-8 w-auto opacity-90 invert"
                        />
                    </Link>
                    <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                        ← Voltar
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-4xl font-bold mb-4">Termos de Uso</h1>
                <p className="text-gray-400 mb-12">Última atualização: Janeiro de 2026</p>

                <div className="prose prose-invert prose-lg max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">1. Aceitação dos Termos</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Ao acessar e utilizar a plataforma Áxis, você concorda em cumprir e estar vinculado a estes Termos de Uso.
                            Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">2. Descrição do Serviço</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            O Áxis é uma plataforma de automação de vendas via WhatsApp que utiliza Inteligência Artificial para:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li>Qualificar leads automaticamente 24 horas por dia, 7 dias por semana</li>
                            <li>Responder mensagens de texto e áudio no WhatsApp</li>
                            <li>Integrar com Meta Ads (Facebook/Instagram) para captação de leads</li>
                            <li>Analisar sentimento e emoção das conversas para handoff inteligente</li>
                            <li>Sincronizar dados com CRMs como HubSpot, Salesforce e Pipedrive</li>
                            <li>Agendar reuniões automaticamente via Google Calendar ou Calendly</li>
                            <li>Realizar follow-ups automáticos para leads inativos</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">3. Uso do WhatsApp</h2>
                        <p className="text-gray-300 leading-relaxed">
                            O Áxis opera através da API oficial do WhatsApp Business. Ao utilizar nosso serviço, você declara que:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mt-4">
                            <li>Possui autorização para enviar mensagens aos contatos cadastrados</li>
                            <li>Cumpre as políticas de uso do WhatsApp Business</li>
                            <li>Não utilizará o serviço para spam ou mensagens não solicitadas</li>
                            <li>Manterá práticas éticas de comunicação com leads e clientes</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">4. Inteligência Artificial</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Nossa IA processa conversas para fornecer respostas contextuais e relevantes. O sistema inclui:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mt-4">
                            <li>Análise de sentimento para detectar frustração ou urgência</li>
                            <li>Transcrição automática de mensagens de áudio</li>
                            <li>Qualificação automática baseada em critérios definidos por você</li>
                            <li>Transfer automático para humanos quando necessário</li>
                        </ul>
                        <p className="text-gray-300 leading-relaxed mt-4">
                            Você mantém controle total sobre o tom de voz, base de conhecimento e critérios de qualificação da IA.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">5. Planos e Pagamento</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Os planos são cobrados mensalmente. Não exigimos fidelidade contratual, e você pode cancelar
                            a qualquer momento sem multas. O trial gratuito de 7 dias não requer cartão de crédito.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">6. Propriedade Intelectual</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Todo o conteúdo, código-fonte, design e tecnologia do Áxis são de propriedade exclusiva da empresa.
                            Os dados gerados pelas suas conversas e leads permanecem de sua propriedade.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">7. Limitação de Responsabilidade</h2>
                        <p className="text-gray-300 leading-relaxed">
                            O Áxis não se responsabiliza por bloqueios de número pelo WhatsApp decorrentes de práticas inadequadas
                            de envio de mensagens. Utilizamos rotação de números e aquecimento IA para minimizar riscos,
                            mas o usuário deve seguir as boas práticas recomendadas.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">8. Modificações</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos sobre
                            mudanças significativas por email ou através da plataforma.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">9. Contato</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Para dúvidas sobre estes termos, entre em contato através do email:{" "}
                            <a href="mailto:legal@axis.ai" className="text-blue-500 hover:text-blue-400">legal@axis.ai</a>
                        </p>
                    </section>
                </div>

                {/* Related Links */}
                <div className="mt-16 pt-8 border-t border-gray-800/50">
                    <p className="text-gray-400">
                        Veja também:{" "}
                        <Link href="/legal/privacy" className="text-blue-500 hover:text-blue-400">Política de Privacidade</Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
