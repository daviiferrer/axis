import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
    TextInput,
    ScrollView,
    RefreshControl
} from 'react-native';
import { MessageSquare, Search, Bot, User, ArrowLeft, Wifi } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../theme';
import apiService from '../services/api';
import socketService from '../services/socket';
import { useAuth } from '../context/AuthContext';

const SessionChatsScreen = ({ navigation, route }) => {
    const { sessionName, sessionStatus } = route.params;
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('prospectando');
    const lastProcessedMsgId = useRef(null);

    // Subscribe to realtime chat updates for THIS session
    useEffect(() => {
        if (!sessionName) return;

        console.log(`[SessionChats] Subscribing to ${sessionName}`);

        const unsubscribe = apiService.subscribeToChats(sessionName, (eventType, chat) => {
            console.log(`[Realtime] Chat ${eventType}:`, chat?.id);

            if (eventType === 'INSERT') {
                setChats(prev => {
                    const newJid = apiService.normalizeJid(chat.chat_id);
                    const exists = prev.some(c => apiService.normalizeJid(c.chat_id) === newJid);
                    if (exists) return prev;
                    return [chat, ...prev];
                });
            } else if (eventType === 'UPDATE') {
                setChats(prev => prev.map(c => c.id === chat.id ? { ...c, ...chat } : c));
            } else if (eventType === 'DELETE') {
                setChats(prev => prev.filter(c => c.id !== chat.id));
            }
        });

        socketService.connect();

        const handleSocketMessage = (payload) => {
            if (payload.sessionName !== sessionName) return;

            if (lastProcessedMsgId.current === payload.message.id) return;
            lastProcessedMsgId.current = payload.message.id;

            const isFromMe = payload.message?.fromMe || payload.message?.key?.fromMe || false;

            setChats(prev => {
                const list = [...prev];
                const payloadJid = apiService.normalizeJid(payload.chatJid || payload.chatId);
                const payloadLeadId = payload.chat?.lead_id;

                const index = list.findIndex(c => {
                    const chatJid = apiService.normalizeJid(c.chat_id);
                    // Match by lead_id (Primary ID in our list) OR chat_id (JID)
                    return (payloadLeadId && c.id === payloadLeadId) ||
                        (chatJid === payloadJid || chatJid.includes(payloadJid) || payloadJid.includes(chatJid));
                });

                if (index !== -1) {
                    const updatedChat = {
                        ...list[index],
                        last_message: payload.message.body,
                        last_message_at: payload.message.timestamp || new Date().toISOString(),
                        unread_count: isFromMe ? 0 : (list[index].unread_count || 0) + 1,
                        // NEW: Update metadata from enriched payload
                        campaign_name: payload.chat?.campaign_name || list[index].campaign_name,
                        negotiation_status: payload.chat?.negotiation_status || list[index].negotiation_status,
                        cost: payload.chat?.total_cost ?? list[index].cost,
                        agent_name: payload.message?.agent_name || list[index].agent_name
                    };
                    list.splice(index, 1);
                    return [updatedChat, ...list];
                } else {
                    const newChat = {
                        id: payload.chatId,
                        chat_id: payload.chatJid || payload.chatId,
                        name: payload.notifyName || payload.chatJid?.split('@')[0] || 'Novo Contato',
                        last_message: payload.message.body,
                        last_message_at: payload.message.timestamp || new Date().toISOString(),
                        unread_count: isFromMe ? 0 : 1,
                        session_name: sessionName,
                        profile_picture: null,
                        negotiation_status: payload.chat?.negotiation_status || 'prospectando',
                        owner: 'human',
                        campaign_name: payload.chat?.campaign_name || null,
                        cost: payload.chat?.total_cost || 0,
                        agent_name: payload.message?.agent_name || null
                    };
                    return [newChat, ...list];
                }
            });
        };

        socketService.on('message', handleSocketMessage);

        return () => {
            console.log(`[SessionChats] Unsubscribing from ${sessionName}`);
            unsubscribe();
            socketService.off('message', handleSocketMessage);
        };
    }, [sessionName]);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const leads = await apiService.getLeadsBySession(sessionName);
            setChats(leads || []);
        } catch (error) {
            console.error('Error loading session leads:', error);
        } finally {
            setLoading(false);
        }
    }, [sessionName]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 86400000) {
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const getStatusConfig = (status) => {
        const configs = {
            'pending': { label: 'Pendente', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
            'triage': { label: 'Triagem', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
            'contacted': { label: 'Contatado', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
            'responded': { label: 'Respondeu', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
            'prospectando': { label: 'Novo', color: '#71717a', bg: 'rgba(113, 113, 122, 0.15)' },
            'qualified': { label: 'Qualificado', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
            'negotiating': { label: 'Negociando', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
            'converted': { label: 'Venda', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' },
            'lost': { label: 'Perdido', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
        };
        return configs[status] || { label: status || 'Novo', color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.15)' };
    };

    const filteredChats = chats.filter(chat => {
        const matchesSearch = !searchQuery ||
            (chat.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (chat.phone?.includes(searchQuery));

        const status = (chat.negotiation_status || 'prospectando').toLowerCase();

        // Finalizado: Perdido, Venda or explicitly archived
        const isFinalized = status === 'lost' || status === 'converted' || chat.archived === true;

        // Qualificado: Status qualified
        const isQualified = status === 'qualified';

        // Prospectando: Anything that is not finalized or qualified
        const isProspecting = !isFinalized && !isQualified;

        if (filterStatus === 'prospectando') {
            return matchesSearch && isProspecting;
        } else if (filterStatus === 'qualificado') {
            return matchesSearch && isQualified;
        } else if (filterStatus === 'finalizado') {
            return matchesSearch && isFinalized;
        }

        return matchesSearch;
    });

    const renderChatItem = ({ item }) => {
        const statusConfig = getStatusConfig(item.negotiation_status);
        const isAI = item.owner === 'ai';

        return (
            <TouchableOpacity
                style={styles.chatItem}
                onPress={() => navigation.navigate('ChatDetail', {
                    chatId: item.id,
                    chatJid: item.chat_id,
                    sessionId: item.session_name,
                    name: item.name || item.phone,
                    profilePicture: item.profile_picture
                })}
                activeOpacity={0.7}
            >
                {/* Avatar */}
                <View style={styles.avatar}>
                    {item.profile_picture ? (
                        <Image source={{ uri: item.profile_picture }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarText}>{getInitials(item.name || item.phone)}</Text>
                    )}
                </View>

                {/* Content */}
                <View style={styles.chatContent}>
                    {/* Row 1: Name, Campaign, Status, Cost */}
                    <View style={styles.chatHeader}>
                        <View style={styles.nameRow}>
                            <Text style={styles.chatName} numberOfLines={1}>
                                {item.name || item.phone || 'Desconhecido'}
                            </Text>

                            {item.campaign_name && (
                                <Text style={styles.campaignIndicator} numberOfLines={1}>
                                    • {item.campaign_name}
                                </Text>
                            )}

                            <View style={[styles.statusBadgeContainer, { backgroundColor: statusConfig.bg }]}>
                                <Text style={[styles.statusBadge, { color: statusConfig.color }]}>
                                    {statusConfig.label}
                                </Text>
                            </View>
                        </View>

                        {/* Cost (Right side of Row 1) */}
                        <View style={styles.costBadge}>
                            <Bot size={12} color="#9ca3af" style={{ marginRight: 4 }} />
                            <Text style={styles.costText}>R$ {(item.cost || 0).toFixed(2)}</Text>
                        </View>
                    </View>

                    {/* Row 2: Last Message ... Agent/Model */}
                    <View style={styles.messageRow}>
                        <View style={styles.messagePreview}>
                            {isAI ? (
                                <Bot size={12} color="#8b5cf6" style={{ marginRight: 4 }} />
                            ) : (
                                <User size={12} color="#3b82f6" style={{ marginRight: 4 }} />
                            )}
                            <Text style={styles.chatLastMessage} numberOfLines={1}>
                                {item.last_message || 'Sem mensagens'}
                            </Text>
                        </View>

                        {/* Agent/Model Name (Right side of Row 2) */}
                        <View style={styles.agentInfo}>
                            <Text style={styles.agentName}>
                                {isAI ? 'Modelo IA' : (item.agent_name || 'Agente')}
                            </Text>
                            <Text style={styles.chatTime}>{formatTime(item.last_message_at)}</Text>
                        </View>
                    </View>
                </View>

                {/* Unread Badge Overlay */}
                {item.unread_count > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{item.unread_count}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const FilterTab = ({ id, label, active }) => (
        <TouchableOpacity
            style={[styles.filterTab, active && styles.filterTabActive]}
            onPress={() => setFilterStatus(id)}
        >
            <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.title}>{sessionName}</Text>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Search size={16} color={colors.textMuted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar nesta sessão..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterTabs}>
                <FilterTab id="prospectando" label="Prospectando" active={filterStatus === 'prospectando'} />
                <FilterTab id="qualificado" label="Qualificado" active={filterStatus === 'qualificado'} />
                <FilterTab id="finalizado" label="Finalizado" active={filterStatus === 'finalizado'} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredChats}
                    renderItem={renderChatItem}
                    keyExtractor={(item) => item.id?.toString() || item.phone}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MessageSquare size={48} color={colors.textMuted} strokeWidth={1} />
                            <Text style={styles.emptyText}>Nenhuma conversa</Text>
                            <Text style={styles.emptySubtext}>Nenhum lead nesta sessão ainda.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
        gap: spacing.md,
    },
    backButton: {
        padding: 4,
    },
    title: {
        ...typography.h2,
    },
    subtitle: {
        fontSize: 12,
        color: colors.textMuted,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    listContent: {
        flexGrow: 1,
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    avatarImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    chatContent: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    chatName: {
        ...typography.h3,
        maxWidth: '50%',
        marginRight: spacing.xs,
    },
    chatTime: {
        ...typography.caption,
    },
    chatLastMessage: {
        ...typography.bodySmall,
        color: colors.textMuted,
    },
    unreadBadge: {
        backgroundColor: '#3b82f6',
        borderRadius: borderRadius.full,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        marginLeft: spacing.sm,
    },
    unreadText: {
        color: colors.white,
        fontSize: 11,
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl * 2,
    },
    emptyText: {
        ...typography.h3,
        marginBottom: spacing.xs,
        marginTop: spacing.md,
    },
    emptySubtext: {
        ...typography.bodySmall,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        color: colors.text,
        fontSize: 14,
        paddingVertical: spacing.xs,
    },
    filterTabs: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    filterTab: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    filterTabActive: {
        borderBottomColor: '#8b5cf6',
    },
    filterTabText: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.textMuted,
    },
    filterTabTextActive: {
        color: '#8b5cf6',
        fontWeight: '600',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 6,
    },
    campaignIndicator: {
        fontSize: 11,
        color: colors.textMuted,
        fontWeight: '500',
    },
    statusBadgeContainer: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusBadge: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    costBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: spacing.sm,
    },
    costText: {
        color: '#9ca3af',
        fontSize: 11,
        fontWeight: '700',
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    messagePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    agentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    agentName: {
        fontSize: 11,
        fontWeight: '600',
        color: '#71717a',
        backgroundColor: colors.surfaceLight,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
});

export default SessionChatsScreen;
