import { useState, useEffect } from 'react';
import Header from '../../../components/dashboard/Header';
import { User, ChatCircleDots, Brain, Thermometer, Target, ClipboardText, CalendarPlus, HandPalm } from 'phosphor-react';
import styles from './Chat.module.css';

// Mock data for initial visualization
const mockChats = [
    { id: 1, name: 'João Silva', time: '10:30', snippet: 'Gostaria de saber mais sobre o plano...', active: true, online: true },
    { id: 2, name: 'Maria Oliveira', time: '09:15', snippet: 'Obrigado pelo atendimento!', active: false, online: false },
    { id: 3, name: 'Carlos Santos', time: 'Ontem', snippet: 'Vi o anúncio no Instagram.', active: false, online: true },
];

export default function ChatPage() {
    const [selectedChat, setSelectedChat] = useState(mockChats[0]);
    const [isTyping, setIsTyping] = useState(false);

    // Simulate functionality: Typing effect for demo
    useEffect(() => {
        setIsTyping(false);
        if (!selectedChat) return;

        const interval = setInterval(() => {
            // Randomly toggle typing to show ui state
            if (selectedChat.online) {
                setIsTyping(prev => !prev);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [selectedChat]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <Header title="Chat Central" />

            <div className={styles.chatContainer}>
                {/* Left Sidebar: Chat List */}
                <div className={styles.chatSidebar}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                        <input
                            type="text"
                            placeholder="Buscar conversa..."
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: '#f8fafc',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div className={styles.chatList}>
                        {mockChats.map(chat => (
                            <div
                                key={chat.id}
                                className={`${styles.chatItem} ${selectedChat?.id === chat.id ? styles.chatItemActive : ''}`}
                                onClick={() => setSelectedChat(chat)}
                            >
                                <div className={styles.chatItemHeader}>
                                    <span className={styles.chatItemName}>{chat.name}</span>
                                    <span className={styles.chatItemTime}>{chat.time}</span>
                                </div>
                                <div className={styles.chatItemSnippet}>{chat.snippet}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Area: Conversation */}
                <div className={styles.chatMain}>
                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: '1rem', height: '70px', flexShrink: 0 }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    <User size={20} color="#64748b" />
                                    {/* Online Indicator Badge */}
                                    {selectedChat.online && (
                                        <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%', border: '2px solid #fff' }} />
                                    )}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{selectedChat.name}</h3>
                                    <span style={{ fontSize: '0.85rem', color: isTyping ? '#10b981' : '#64748b', transition: 'color 0.3s ease' }}>
                                        {isTyping ? 'digitando...' : (selectedChat.online ? 'Online' : 'Visto por último hoje às ' + selectedChat.time)}
                                    </span>
                                </div>
                            </div>

                            {/* Chat Messages Area */}
                            <div style={{ flex: 1, padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#94a3b8' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <p>Histórico da conversa com {selectedChat.name}</p>
                                    <p style={{ fontSize: '0.8rem' }}>Implementação das mensagens virá a seguir.</p>
                                </div>
                            </div>

                            {/* Input Area */}
                            <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Digite uma mensagem..."
                                        style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', outline: 'none' }}
                                    />
                                    <button style={{ padding: '0 1.5rem', borderRadius: '12px', backgroundColor: '#0f172a', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                                        Enviar
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.emptyState}>
                            <ChatCircleDots size={48} weight="light" />
                            <p>Selecione uma conversa para iniciar o atendimento</p>
                        </div>
                    )}
                </div>

                {/* Right Sidebar: Context & Actions */}
                {selectedChat && (
                    <div className={styles.chatRightSidebar}>
                        {/* Profile Section */}
                        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                                <User size={40} color="#94a3b8" />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.5rem 0' }}>{selectedChat.name}</h2>
                            <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>+55 11 99999-9999</p>

                            <div style={{ marginTop: '1.5rem', width: '100%' }}>
                                <button className={`${styles.actionButton} ${styles.primaryButton}`}>
                                    <HandPalm size={18} />
                                    Assumir Conversa
                                </button>
                            </div>
                        </div>

                        {/* AI Intelligence */}
                        <div className={styles.rightPanelSection}>
                            <h4 className={styles.sectionTitle}><Brain size={16} /> Inteligência Artificial</h4>

                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Intenção</span>
                                <span className={styles.tag}>Interessado 🔥</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Sentimento</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: '#10b981' }}>
                                    <Thermometer size={16} />
                                    85/100
                                </div>
                            </div>
                            <div style={{ marginTop: '1rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', color: '#475569' }}>
                                <strong>Resumo IA:</strong> Lead perguntou preço do plano anual. IA respondeu enviando tabela comparativa e gatilho de escassez.
                            </div>
                        </div>

                        {/* Lead Origin */}
                        <div className={styles.rightPanelSection}>
                            <h4 className={styles.sectionTitle}><Target size={16} /> Origem do Lead</h4>

                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Campanha</span>
                                <span className={styles.infoValue}>Black Friday 2025</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Anúncio</span>
                                <span className={styles.infoValue}>Criativo #04 (Vídeo)</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Plataforma</span>
                                <span className={styles.infoValue}>Instagram Stories</span>
                            </div>
                        </div>

                        {/* CRM Actions */}
                        <div className={styles.rightPanelSection}>
                            <h4 className={styles.sectionTitle}><ClipboardText size={16} /> Gestão (CRM)</h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Status</label>
                                    <select style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#0f172a' }}>
                                        <option>Em Negociação</option>
                                        <option>Novo Lead</option>
                                        <option>Aguardando Pagamento</option>
                                        <option>Fechado</option>
                                        <option>Perdido</option>
                                    </select>
                                </div>

                                <button className={styles.actionButton}>
                                    <CalendarPlus size={18} />
                                    Agendar Reunião
                                </button>

                                <textarea
                                    placeholder="Adicionar nota interna..."
                                    rows={3}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', resize: 'none', fontSize: '0.9rem' }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
