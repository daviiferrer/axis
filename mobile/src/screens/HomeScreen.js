import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, StatusBar, Modal,
    TouchableWithoutFeedback, ActivityIndicator, ScrollView, RefreshControl, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { socketService } from '../services/socket';
import {
    User, LogOut, Megaphone, MessageSquare, BarChart3, Settings,
    Target, Trophy, AlertTriangle, Zap, Bot, Play, Pause, Activity,
    MoreHorizontal, ArrowRight, Phone, Wifi, WifiOff
} from 'lucide-react-native';

const HomeScreen = ({ navigation }) => {
    const { user, signOut } = useAuth();
    const [menuVisible, setMenuVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data State
    const [leads, setLeads] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [activityFeed, setActivityFeed] = useState([]);

    // Stats State
    const [funnel, setFunnel] = useState({
        negotiating: 0, // Em conversa
        opportunities: 0, // Oportunidades
        success: 0 // Sucesso
    });

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const userSessions = await apiService.getSessions(user?.id);
            setSessions(userSessions || []);

            // Parallel fetching for all sessions
            const allLeadsPromises = userSessions.map(session =>
                apiService.getLeadsBySession(session.name)
            );
            const results = await Promise.all(allLeadsPromises);
            const allLeads = results.flat();

            // Deduplicate global leads by ID just in case
            const uniqueLeadsMap = new Map();
            allLeads.forEach(l => uniqueLeadsMap.set(l.id, l));
            const uniqueLeads = Array.from(uniqueLeadsMap.values());

            setLeads(uniqueLeads);

            // Fetch Campaigns
            const campData = await apiService.getCampaigns();
            setCampaigns(campData);

            // Fetch Analytics (ROI)
            try {
                const analyticsData = await apiService.getAnalytics();
                setAnalytics(analyticsData);
            } catch (err) {
                console.warn('Analytics fetch failed:', err);
            }

            // Calculate Funnel
            const inConversation = uniqueLeads.filter(l =>
                ['pending', 'contacted', 'responded', 'prospectando', 'triage'].includes(l.negotiation_status)
            ).length;

            const opportunities = uniqueLeads.filter(l =>
                ['qualified', 'negotiating'].includes(l.negotiation_status)
            ).length;

            const success = uniqueLeads.filter(l =>
                ['converted'].includes(l.negotiation_status)
            ).length;

            setFunnel({
                negotiating: inConversation,
                opportunities: opportunities,
                success: success
            });

        } catch (error) {
            console.error('Dashboard load error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadDashboardData();
        }, [])
    );

    // --- REALTIME SOCKET ---
    useEffect(() => {
        socketService.connect();

        const handleMessage = (payload) => {
            // "🤖 IA enviou abordagem..."
            if (payload.message?.fromMe) {
                addToFeed({
                    type: 'bot',
                    text: `IA respondeu ${payload.notifyName || 'Lead'}`,
                    time: new Date()
                });
            } else {
                // Determine if status changed - mocked for feed visual
                // In real app, we'd compare old status vs new, but here we simulate activity
                // "📩 Lead respondeu..."
            }
        };

        // Listen for status changes (mocked via generic message for now or mapped if event allows)
        // Ideally we'd have a 'lead.update' event. relying on leads refresh or future implementation.

        socketService.on('message', handleMessage);
        return () => {
            socketService.off('message', handleMessage);
        };
    }, []);

    const addToFeed = (item) => {
        setActivityFeed(prev => [item, ...prev].slice(0, 10)); // Keep last 10
    };

    // --- ACTIONS ---
    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) { console.error(error); }
    };

    const toggleCampaign = async (camp) => {
        try {
            const newStatus = camp.status === 'active' ? 'paused' : 'active';
            await apiService.updateCampaign(camp.id, { status: newStatus });
            setCampaigns(prev => prev.map(c => c.id === camp.id ? { ...c, status: newStatus } : c));
            addToFeed({
                type: 'system',
                text: `Campanha "${camp.name}" ${newStatus === 'active' ? 'iniciada' : 'pausada'}.`,
                time: new Date()
            });
        } catch (e) {
            console.error(e);
        }
    };

    const navigateToLead = (lead) => {
        navigation.navigate('ChatDetail', {
            chatId: lead.id,
            chatJid: lead.chat_id,
            sessionId: lead.session_name,
            name: lead.name || lead.phone,
            profilePicture: lead.profile_picture
        });
    };


    // --- RENDERS ---

    const renderFunnelCard = (title, count, icon) => (
        <View style={styles.funnelCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <Text style={styles.funnelCount}>{count}</Text>
                {icon}
            </View>
            <Text style={styles.funnelLabel}>{title}</Text>
        </View>
    );

    const renderActionItem = ({ item }) => {
        const isIntervention = item.negotiation_status === 'manual_intervention';
        return (
            <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigateToLead(item)}
                activeOpacity={0.8}
            >
                <View style={styles.actionIcon}>
                    {isIntervention ? (
                        <AlertTriangle size={20} color="#F87171" />
                    ) : (
                        <Zap size={20} color="#fbbf24" />
                    )}
                </View>
                <View style={{ flex: 1 }}>
                    <View style={styles.actionHeader}>
                        <Text style={styles.actionTitle}>{item.name || item.phone}</Text>
                        <Text style={styles.actionTime}>
                            {new Date(item.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                    <Text style={styles.actionDesc} numberOfLines={1}>
                        {isIntervention ? 'Solicitou ajuda manual' : 'Novo lead qualificado!'}
                    </Text>
                </View>
                <ArrowRight size={16} color={colors.textMuted} />
            </TouchableOpacity>
        );
    };

    const renderCampaignCard = ({ item }) => {
        // Mock progress
        const isActive = item.status === 'active';
        return (
            <View style={styles.campaignCard}>
                <View style={styles.campHeader}>
                    <Text style={styles.campName} numberOfLines={1}>{item.name}</Text>
                    {isActive ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#34D399' }} /> : <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#52525b' }} />}
                </View>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: isActive ? '60%' : '0%', backgroundColor: isActive ? '#fff' : 'transparent' }]} />
                </View>
                <Text style={styles.campStatus}>{isActive ? 'Rodando' : 'Pausada'}</Text>
            </View>
        );
    };

    const priorityLeads = leads
        .filter(l => ['manual_intervention', 'qualified'].includes(l.negotiation_status))
        .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
        .slice(0, 5);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />

            {/* Header: Status da Operação */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Painel de Controle</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: sessions.some(s => s.status === 'WORKING') ? '#34D399' : '#F87171' }]} />
                        <Text style={styles.statusText}>
                            {sessions.filter(s => s.status === 'WORKING').length} Online
                        </Text>
                        <Text style={[styles.statusText, { color: colors.textMuted, marginLeft: 8 }]}>
                            |   {sessions.filter(s => s.status !== 'WORKING').length} Offline
                        </Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.profileBtn}>
                    {user?.user_metadata?.avatar_url ? (
                        <Image source={{ uri: user.user_metadata.avatar_url }} style={styles.profileImg} />
                    ) : (
                        <View style={styles.profilePlaceholder}><User size={20} color="#fff" /></View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDashboardData} tintColor={colors.primary} />}
            >
                {/* 1. ROI CARD (Minimalist) */}
                <View style={{ marginHorizontal: 20, marginTop: 20, marginBottom: 24 }}>
                    <View style={styles.roiMainCard}>
                        <View style={styles.roiHeader}>
                            <Zap size={20} color="#fff" style={{ marginRight: 10 }} />
                            <Text style={styles.roiTitle}>Retorno sobre IA</Text>
                        </View>

                        <View style={styles.roiContent}>
                            <View>
                                <Text style={styles.roiBigLabel}>Investimento Hoje</Text>
                                <Text style={styles.roiBigValue}>R$ {analytics?.financial?.totalCost?.toFixed(2) || '0.00'}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.roiBigLabel}>Custo/Lead</Text>
                                <Text style={styles.roiBigValue}>R$ {analytics?.overview?.costPerLead || '0.00'}</Text>
                            </View>
                        </View>

                        <View style={styles.roiFooter}>
                            <View style={styles.roiStat}>
                                <Text style={styles.roiStatValue}>{funnel.success}</Text>
                                <Text style={styles.roiStatLabel}>Vendas</Text>
                            </View>
                            <View style={styles.roiDivider} />
                            <View style={styles.roiStat}>
                                <Text style={styles.roiStatValue}>{((funnel.opportunities / (leads.length || 1)) * 100).toFixed(0)}%</Text>
                                <Text style={styles.roiStatLabel}>Conversão</Text>
                            </View>
                            <View style={styles.roiDivider} />
                            <View style={styles.roiStat}>
                                <Text style={styles.roiStatValue}>{analytics?.financial?.totalTokens?.toLocaleString() || '0'}</Text>
                                <Text style={styles.roiStatLabel}>Tokens</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 1. FUNNEL CARDS (Responsive Row) */}
                <View style={styles.funnelRow}>
                    {renderFunnelCard('Em Conversa', funnel.negotiating, <MessageSquare size={20} color={colors.textMuted} />)}
                    {renderFunnelCard('Oportunidades', funnel.opportunities, <Target size={20} color={colors.textMuted} />)}
                    {renderFunnelCard('Sucesso', funnel.success, <Trophy size={20} color={colors.textMuted} />)}
                </View>

                {/* 3. ACTION REQUIRED (Minimal) */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Ação Requerida</Text>
                    </View>
                    {priorityLeads.length > 0 ? (
                        priorityLeads.map(item => (
                            <View key={item.id} style={{ marginBottom: 12 }}>
                                {renderActionItem({ item })}
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Tudo limpo! Nenhuma pendência.</Text>
                        </View>
                    )}
                </View>

                {/* 4. CAMPAIGNS */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Campanhas Ativas</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}>
                        {campaigns.length > 0 ? campaigns.map(camp => (
                            <View key={camp.id}>{renderCampaignCard({ item: camp })}</View>
                        )) : (
                            <Text style={styles.emptyText}>Nenhuma campanha criada.</Text>
                        )}
                    </ScrollView>
                </View>

                {/* 5. ROBOT ACTIVITY */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Atividade do Robô 🤖</Text>
                    </View>
                    <View style={styles.feedContainer}>
                        {activityFeed.length > 0 ? (
                            activityFeed.map((item, i) => (
                                <View key={i} style={styles.feedItem}>
                                    <View style={styles.feedDot} />
                                    <View>
                                        <Text style={styles.feedText}>{item.text}</Text>
                                        <Text style={styles.feedTime}>{item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={[styles.emptyText, { textAlign: 'left', paddingLeft: 10 }]}>Aguardando atividade...</Text>
                        )}
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Float Menu */}
            <Modal transparent visible={menuVisible} onRequestClose={() => setMenuVisible(false)} animationType="fade">
                <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
                    <View style={styles.overlay}>
                        <View style={styles.menu}>
                            <Text style={styles.menuTitle}>Menu Rápido</Text>
                            {[
                                { title: 'Campanhas', icon: Megaphone, screen: 'Campaigns' },
                                { title: 'Chats (Sessões)', icon: MessageSquare, screen: 'Chats' }, // Redirect to Sessions list
                                { title: 'Agentes', icon: Bot, screen: 'Agents' },
                                { title: 'Configurações', icon: Settings, screen: 'Settings' }
                            ].map((m, i) => (
                                <TouchableOpacity key={i} style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate(m.screen); }}>
                                    <m.icon size={20} color={colors.text} />
                                    <Text style={styles.menuText}>{m.title}</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity style={[styles.menuItem, { borderTopWidth: 1, borderColor: '#eee' }]} onPress={handleLogout}>
                                <LogOut size={20} color="#EF4444" />
                                <Text style={[styles.menuText, { color: '#EF4444' }]}>Sair</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
        backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border
    },
    greeting: { fontSize: 20, fontWeight: '700', color: colors.text },
    date: { fontSize: 13, color: colors.textMuted, textTransform: 'capitalize' },
    profileBtn: { padding: 4 },
    profileImg: { width: 36, height: 36, borderRadius: 18 },
    profilePlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },

    // Funnel (Responsive)
    funnelRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, paddingVertical: 10, justifyContent: 'space-between' },
    funnelCard: {
        flex: 1, padding: 12, borderRadius: 12, // Reduced padding to fit 3
        backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
        height: 100, justifyContent: 'space-between'
    },
    funnelCount: { fontSize: 20, fontWeight: '700', color: colors.text }, // Slightly smaller font
    funnelLabel: { fontSize: 11, fontWeight: '500', color: colors.textSecondary },

    // Sections
    section: { marginBottom: 24 },
    sectionHeader: { paddingHorizontal: 20, marginBottom: 12 },
    sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },

    // Action Card (Minimal)
    actionCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surface, marginHorizontal: 20, padding: 16, borderRadius: 12,
        borderWidth: 1, borderColor: colors.border, gap: 12
    },
    actionIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }, // Removed bg
    actionHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' },
    actionTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
    actionTime: { fontSize: 11, color: colors.textMuted },
    actionDesc: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

    // Campaign Card (Minimal)
    campaignCard: {
        width: 160, padding: 16, backgroundColor: colors.surface, borderRadius: 12,
        borderWidth: 1, borderColor: colors.border,
    },
    campHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    campName: { fontSize: 13, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 },
    progressBar: { height: 4, backgroundColor: colors.background, borderRadius: 2, marginBottom: 8, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 2 },
    campStatus: { fontSize: 11, color: colors.textMuted },

    // Feed
    feedContainer: { paddingHorizontal: 20, paddingLeft: 28 }, // Indent for timeline
    feedItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, borderLeftWidth: 1, borderLeftColor: colors.border, paddingLeft: 16, position: 'relative' },
    feedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border, position: 'absolute', left: -3.5, top: 6 },
    feedText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    feedTime: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

    emptyState: { padding: 20, alignItems: 'center' },
    emptyText: { color: colors.textMuted, fontSize: 13, fontStyle: 'italic' },

    // Menu
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    menu: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    menuTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: colors.text },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
    menuText: { fontSize: 16, fontWeight: '500', color: colors.text },

    // ROI Main Card (Minimal Dark)
    roiMainCard: { padding: 20, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    roiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    roiTitle: { fontSize: 14, color: colors.text, fontWeight: '600', letterSpacing: 0.5 },
    roiContent: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    roiBigLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
    roiBigValue: { fontSize: 24, color: colors.text, fontWeight: '700' },
    roiFooter: { flexDirection: 'row', borderTopWidth: 1, borderColor: colors.border, paddingTop: 16, justifyContent: 'space-between', alignItems: 'center' },
    roiStat: { alignItems: 'center', flex: 1 },
    roiStatValue: { fontSize: 14, color: colors.text, fontWeight: '600' },
    roiStatLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
    roiDivider: { width: 1, height: 20, backgroundColor: colors.border },

    // Header Status
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },

    costRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    costRowName: { fontSize: 13, color: colors.text, flex: 1 },
    costRowValue: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
});

export default HomeScreen;
