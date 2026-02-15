import Link from "next/link";
import Image from "next/image";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#080A10] text-white selection:bg-blue-500/30">
            {/* Header */}
            <header className="border-b border-gray-800/50 py-6">
                <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
                    <Link href="/">
                        <Image
                            src="/assets/brand/logo.svg"
                            alt="AXIS Logo"
                            width={120}
                            height={40}
                            className="h-8 w-auto opacity-90"
                        />
                    </Link>
                    <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                        ← Voltar
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
                <p className="text-gray-400 mb-12">Última atualização: Janeiro de 2026</p>

                <div className="prose prose-invert prose-lg max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">1. Introdução</h2>
                        <p className="text-gray-300 leading-relaxed">
                            A Áxis está comprometida com a proteção da privacidade dos seus usuários e dos leads
                            que interagem através da nossa plataforma. Esta política descreve como coletamos,
                            utilizamos e protegemos suas informações.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">2. Dados que Coletamos</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Para fornecer nossos serviços de automação de vendas via WhatsApp, coletamos:
                        </p>

                        <h3 className="text-xl font-medium mt-6 mb-3 text-white">2.1 Dados do Usuário (Você)</h3>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li>Nome, email e informações de conta</li>
                            <li>Dados de pagamento (processados por terceiros seguros)</li>
                            <li>Base de conhecimento e scripts que você configura</li>
                            <li>Configurações de tom de voz e critérios de qualificação</li>
                            <li>Integrações com CRMs (HubSpot, Salesforce, Pipedrive, RD Station)</li>
                        </ul>

                        <h3 className="text-xl font-medium mt-6 mb-3 text-white">2.2 Dados dos Leads</h3>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li>Número de telefone e nome do WhatsApp</li>
                            <li>Histórico completo de conversas (texto e transcrições de áudio)</li>
                            <li>Dados de qualificação coletados durante a conversa</li>
                            <li>Análise de sentimento e emoção das interações</li>
                            <li>Origem do lead (Meta Ads, site, indicação, etc.)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">3. Como Usamos os Dados</h2>
                        <p className="text-gray-300 leading-relaxed mb-4">Utilizamos os dados coletados para:</p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                            <li>Processar e responder mensagens automaticamente via IA</li>
                            <li>Transcrever e analisar mensagens de áudio</li>
                            <li>Detectar sentimento e frustração para handoff inteligente</li>
                            <li>Qualificar leads conforme seus critérios definidos</li>
                            <li>Sincronizar informações com seu CRM</li>
                            <li>Agendar reuniões via Google Calendar ou Calendly</li>
                            <li>Enviar follow-ups automáticos para leads inativos</li>
                            <li>Gerar relatórios e analytics no dashboard</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">4. Inteligência Artificial e Processamento</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Nossa IA processa conversas em tempo real para fornecer respostas contextuais.
                            Os modelos de IA são treinados de forma segura e os dados de conversas individuais
                            não são utilizados para treinar modelos externos. A análise de sentimento opera
                            localmente para detectar frustração, urgência ou interesse do lead.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">5. Integração com Meta Ads</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Quando você conecta sua conta do Meta Ads, recebemos dados de leads gerados por
                            suas campanhas de Facebook e Instagram. Esses dados são usados exclusivamente para
                            iniciar conversas no WhatsApp conforme seu fluxo de automação.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">6. Armazenamento e Segurança</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Todos os dados são armazenados em servidores seguros com criptografia em repouso e em trânsito.
                            Implementamos medidas de segurança incluindo:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mt-4">
                            <li>Criptografia AES-256 para dados sensíveis</li>
                            <li>Conexões HTTPS/TLS obrigatórias</li>
                            <li>Autenticação de dois fatores disponível</li>
                            <li>Logs de auditoria para acesso a dados</li>
                            <li>Backups regulares e recuperação de desastres</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">7. Compartilhamento de Dados</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Não vendemos seus dados. Compartilhamos informações apenas com:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mt-4">
                            <li>CRMs que você integrou (HubSpot, Salesforce, Pipedrive)</li>
                            <li>Calendários que você conectou (Google Calendar, Calendly)</li>
                            <li>Provedores de infraestrutura (processamento de dados)</li>
                            <li>Quando exigido por lei ou ordem judicial</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">8. Retenção de Dados</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Mantemos os dados de conversas e leads enquanto sua conta estiver ativa.
                            Após o cancelamento, os dados são retidos por 30 dias para possibilitar recuperação,
                            e então permanentemente excluídos. Você pode solicitar exclusão antecipada a qualquer momento.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">9. Seus Direitos (LGPD)</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
                        </p>
                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mt-4">
                            <li>Acessar todos os dados que temos sobre você</li>
                            <li>Corrigir dados incorretos ou incompletos</li>
                            <li>Solicitar exclusão dos seus dados</li>
                            <li>Exportar seus dados em formato portável</li>
                            <li>Revogar consentimento para processamento</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">10. Cookies e Rastreamento</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Utilizamos cookies essenciais para funcionamento da plataforma e cookies analíticos
                            para melhorar a experiência. Você pode gerenciar preferências de cookies nas configurações do navegador.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">11. Contato</h2>
                        <p className="text-gray-300 leading-relaxed">
                            Para questões sobre privacidade ou exercer seus direitos, contate nosso DPO:{" "}
                            <a href="mailto:privacidade@axis.ai" className="text-blue-500 hover:text-blue-400">privacidade@axis.ai</a>
                        </p>
                    </section>
                </div>

                {/* Related Links */}
                <div className="mt-16 pt-8 border-t border-gray-800/50">
                    <p className="text-gray-400">
                        Veja também:{" "}
                        <Link href="/legal/terms" className="text-blue-500 hover:text-blue-400">Termos de Uso</Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
