import React, { useState, useEffect, useCallback } from 'react';
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
import { MessageSquare, Search, Bot, User, ChevronDown, Wifi } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../theme';
import apiService from '../services/api';
import socketService from '../services/socket';
import { useAuth } from '../context/AuthContext';

const ChatsScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('prospectando');
    const lastProcessedMsgId = React.useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    // Subscribe to realtime chat updates when session is selected
    useEffect(() => {
        if (!selectedSession) return;

        const unsubscribe = apiService.subscribeToChats(selectedSession.name, (eventType, chat) => {
            console.log(`[Realtime] Chat ${eventType}:`, chat?.id);

            if (eventType === 'INSERT') {
                setChats(prev => {
                    // Deduplicate by JID (handle shared session duplicates)
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

        // Socket.io Listener for INSTANT updates (list order & last message)
        socketService.connect();

        const handleSocketMessage = (payload) => {
            if (payload.sessionName !== selectedSession.name) return;

            // Deduplicate socket events
            if (lastProcessedMsgId.current === payload.message.id) {
                console.log('[Socket] Duplicate message ignored:', payload.message.id);
                return;
            }
            lastProcessedMsgId.current = payload.message.id;

            // Robust check for "fromMe"
            const isFromMe = payload.message?.fromMe || payload.message?.key?.fromMe || false;

            setChats(prev => {
                const list = [...prev];
                // Find chat by JID OR ID (Looser comparison)
                const payloadJid = apiService.normalizeJid(payload.chatJid || payload.chatId);
                const index = list.findIndex(c => {
                    const chatJid = apiService.normalizeJid(c.chat_id);
                    return chatJid === payloadJid || chatJid.includes(payloadJid) || payloadJid.includes(chatJid) || c.id === payload.chatId;
                });

                if (index !== -1) {
                    const updatedChat = {
                        ...list[index],
                        last_message: payload.message.body,
                        last_message_at: payload.message.timestamp || new Date().toISOString(),
                        unread_count: isFromMe ? 0 : (list[index].unread_count || 0) + 1
                    };
                    // Move to top
                    list.splice(index, 1);
                    return [updatedChat, ...list];
                } else {
                    // New chat - Add to top
                    const newChat = {
                        id: payload.chatId, // Use payload ID (might be JID if Waha)
                        chat_id: payload.chatJid || payload.chatId,
                        name: payload.notifyName || payload.chatJid?.split('@')[0] || 'Novo Contato',
                        last_message: payload.message.body,
                        last_message_at: payload.message.timestamp || new Date().toISOString(),
                        unread_count: isFromMe ? 0 : 1,
                        session_name: selectedSession.name,
                        profile_picture: null,
                        negotiation_status: 'prospectando',
                        owner: 'human'
                    };
                    return [newChat, ...list];
                }
            });
        };

        socketService.on('message', handleSocketMessage);

        return () => {
            console.log('[Realtime] Unsubscribing from chats/socket');
            unsubscribe();
            socketService.off('message', handleSocketMessage);
        };
    }, [selectedSession]);

    // When user manually changes session, load its leads
    const handleSessionChange = async (session) => {
        setSelectedSession(session);
        setLoading(true);
        try {
            const leads = await apiService.getLeadsBySession(session.name);
            console.log(`Loaded ${leads.length} leads for session ${session.name}`);
            setChats(leads);
        } catch (error) {
            console.error('Error loading session leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);

            // Debug: Log current user ID (should match: 89dc31c5-78e9-441a-b372-ab8ad13c3da0)
            console.log('🔑 Current user ID:', user?.id);
            console.log('📧 Current user email:', user?.email);
            try {
                const sessionsData = await apiService.getSessions();
                const activeSessions = sessionsData?.filter(s => s.status === 'WORKING') || [];
                console.log('Active sessions:', activeSessions.map(s => s.name));
                setSessions(activeSessions);

                // Auto-select first session and load its leads
                if (activeSessions.length > 0) {
                    const firstSession = activeSessions[0];
                    setSelectedSession(firstSession);

                    // Load leads using the web-style method
                    const leads = await apiService.getLeadsBySession(firstSession.name);
                    setChats(leads);
                }
            } catch (sessionError) {
                console.log('Sessions API error, loading all chats:', sessionError.message);
                // Fallback: load all chats
                const chatsData = await apiService.getChats();
                setChats(chatsData || []);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        if (selectedSession) {
            const leads = await apiService.getLeadsBySession(selectedSession.name);
            setChats(leads);
        } else {
            await loadData();
        }
        setRefreshing(false);
    }, [selectedSession]);

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

    // Filter chats - simplified since negotiation_status doesn't exist in current schema
    // For now, just filter by search query. Tabs will work when status is added.
    const filteredChats = chats.filter(chat => {
        const matchesSearch = !searchQuery ||
            (chat.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (chat.phone?.includes(searchQuery));

        // For now, show all chats regardless of tab
        // TODO: Add negotiation_status column to chats table for pipeline filtering
        if (filterStatus === 'prospectando') {
            return matchesSearch; // Show all for now
        } else if (filterStatus === 'qualificado') {
            return false; // No qualified status yet
        } else if (filterStatus === 'finalizado') {
            return matchesSearch && chat.archived === true;
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

    if (loading && chats.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header with Session Picker */}
            <View style={styles.header}>
                <Text style={styles.title}>Chats</Text>
                {sessions.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sessionPicker}>
                        {sessions.map((session) => (
                            <TouchableOpacity
                                key={session.name}
                                style={[
                                    styles.sessionChip,
                                    selectedSession?.name === session.name && styles.sessionChipActive
                                ]}
                                onPress={() => handleSessionChange(session)}
                            >
                                <Wifi size={12} color={selectedSession?.name === session.name ? '#fff' : colors.textMuted} />
                                <Text style={[
                                    styles.sessionChipText,
                                    selectedSession?.name === session.name && styles.sessionChipTextActive
                                ]}>
                                    {session.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Search size={16} color={colors.textMuted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar conversas..."
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

            {/* Chat List */}
            <FlatList
                data={filteredChats}
                renderItem={renderChatItem}
                keyExtractor={(item) => item.id?.toString() || item.phone}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MessageSquare size={48} color={colors.textMuted} strokeWidth={1} />
                        <Text style={styles.emptyText}>Nenhuma conversa</Text>
                        <Text style={styles.emptySubtext}>
                            {sessions.length === 0
                                ? 'Conecte uma instância do WhatsApp'
                                : 'As conversas aparecerão aqui'}
                        </Text>
                    </View>
                }
            />
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
    },
    title: {
        ...typography.h1,
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
        maxWidth: '50%', // Ensure it doesn't crowd out the badges
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
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.lg,
    },
    emptyText: {
        ...typography.h3,
        marginBottom: spacing.xs,
    },
    emptySubtext: {
        ...typography.bodySmall,
    },

    // Search Bar
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

    // Filter Tabs
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

    // Status Badge
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

    // Message Row
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

    // Session Picker
    sessionPicker: {
        flexGrow: 0,
        marginLeft: spacing.md,
    },
    sessionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 16,
        backgroundColor: colors.surfaceLight,
        marginRight: spacing.xs,
        gap: 4,
    },
    sessionChipActive: {
        backgroundColor: '#10b981',
    },
    sessionChipText: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: '500',
    },
    sessionChipTextActive: {
        color: '#fff',
    },
});

export default ChatsScreen;
