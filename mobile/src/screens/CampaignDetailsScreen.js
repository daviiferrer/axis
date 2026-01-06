import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MoreVertical, Users, MessageSquare, Target, Play, Pause, Settings, Plus, UserPlus, Wifi, Bot } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

import apiService from '../services/api';
import socketService from '../services/socket';
import { supabase } from '../lib/supabaseClient';

const CampaignDetailsScreen = ({ route, navigation }) => {
    const { id } = route.params;
    const [campaign, setCampaign] = useState(null);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('leads'); // 'leads' or 'logs'
    const [logs, setLogs] = useState([]);

    const loadLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('campaign_logs')
                .select('*')
                .eq('campaign_id', id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error loading logs:', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'logs') {
            loadLogs();

            // 📡 Subscribe to DB Logs (Persistent)
            const logSub = supabase
                .channel(`campaign_logs:${id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'campaign_logs',
                    filter: `campaign_id=eq.${id}`
                }, (payload) => {
                    setLogs(prev => [payload.new, ...prev]);
                })
                .subscribe();

            // ⚡ Subscribe to Socket Logs (Real-time Console)
            // We listen to the general 'campaign.log' event and filter by ID
            // Ideally we'd join a room, but global emit + filter is fine for MVP
            const socketHandler = (payload) => {
                if (String(payload.campaignId) === String(id)) {
                    // Create a pseudo-log object for display
                    const newLog = {
                        id: `rt_${Date.now()}_${Math.random()}`,
                        type: payload.type || 'info',
                        message: payload.message,
                        created_at: payload.timestamp || new Date().toISOString()
                    };
                    setLogs(prev => [newLog, ...prev]);
                }
            };

            // Use socketService wrapper methods
            if (socketService) {
                socketService.on('campaign.log', socketHandler);
            }

            return () => {
                logSub.unsubscribe();
                if (socketService) {
                    socketService.off('campaign.log', socketHandler);
                }
            };
        }
    }, [activeTab, id]);

    useEffect(() => {
        loadCampaignDetails();
        // ... (rest of original useEffect)

        // Subscribe to real-time changes
        const subscription = supabase
            .channel(`campaign_leads:${id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'campaign_leads',
                filter: `campaign_id=eq.${id}`
            }, (payload) => {
                handleRealtimeUpdate(payload);
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [id]);

    const handleRealtimeUpdate = (payload) => {
        if (payload.eventType === 'INSERT') {
            setLeads(prev => [payload.new, ...prev]);
            setCampaign(prev => ({
                ...prev,
                total_leads: (prev.total_leads || 0) + 1
            }));
        } else if (payload.eventType === 'UPDATE') {
            setLeads(prev => prev.map(lead =>
                lead.id === payload.new.id ? payload.new : lead
            ));
            // Update metrics if status changed (simplified)
            if (payload.new.status !== payload.old.status) {
                // In a full implementation we would re-fetch counts or complex logic
                // For now, let's just keep the list fresh
            }
        } else if (payload.eventType === 'DELETE') {
            setLeads(prev => prev.filter(lead => lead.id !== payload.old.id));
            setCampaign(prev => ({
                ...prev,
                total_leads: Math.max(0, (prev.total_leads || 0) - 1)
            }));
        }
    };

    const loadCampaignDetails = async () => {
        try {
            setLoading(true);
            const [campaignData, leadsData, statsData] = await Promise.all([
                apiService.getCampaign(id),
                apiService.getCampaignLeads ? apiService.getCampaignLeads(id) : Promise.resolve([]),
                apiService.getCampaignStats ? apiService.getCampaignStats(id) : Promise.resolve({})
            ]);
            // Merge real stats into campaign data
            setCampaign({
                ...campaignData,
                total_leads: statsData.total_leads ?? campaignData?.total_leads ?? 0,
                total_responded: statsData.total_responded ?? campaignData?.total_responded ?? 0,
                total_cost: statsData.total_cost ?? 0
            });
            setLeads(leadsData || []);
        } catch (error) {
            console.error('Error loading campaign details:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async () => {
        try {
            const newStatus = campaign.status === 'active' ? 'paused' : 'active';
            await apiService.updateCampaign(id, { status: newStatus });
            setCampaign(prev => ({ ...prev, status: newStatus }));
            const statusText = newStatus === 'active' ? 'iniciada' : 'pausada';
            Alert.alert('Sucesso', 'Campanha ' + statusText + '.');
        } catch (error) {
            console.error('Error toggling status:', error);
            Alert.alert('Erro', 'Falha ao alterar status.');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    if (!campaign) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft color={colors.textPrimary} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Campanha não encontrada</Text>
                </View>
            </SafeAreaView>
        );
    }

    const responseRate = campaign.total_leads ? Math.round((campaign.total_responded / campaign.total_leads) * 100) : 0;

    // Helper for log icon/color
    const getLogStyle = (type) => {
        switch (type) {
            case 'error': return { color: colors.error, icon: 'AlertCircle' };
            case 'success': return { color: colors.success, icon: 'CheckCircle' };
            case 'warning': return { color: colors.warning, icon: 'AlertTriangle' };
            default: return { color: colors.primary, icon: 'Info' }; // info
        }
    };

    // ... existing load and toggleStatus ...

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header (Keep Existing) */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Detalhes</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <TouchableOpacity
                        style={styles.headerAction}
                        onPress={() => navigation.navigate('CampaignEdit', { id })}
                    >
                        <Settings size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.content}>
                {/* Status Card (Keep Existing) */}
                <View style={styles.statusCard}>
                    {/* ... (Same Status Card content) ... */}
                    <View style={styles.statusInfo}>
                        <Text style={styles.campaignName}>{campaign.name}</Text>
                        <View style={[styles.statusBadge, {
                            backgroundColor: campaign.status === 'active' ? colors.success + '20' : colors.warning + '20'
                        }]}>
                            <Text style={[styles.statusText, {
                                color: campaign.status === 'active' ? colors.success : colors.warning
                            }]}>
                                {campaign.status === 'active' ? 'EM ANDAMENTO' : 'PAUSADA'}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.controlButton, {
                            backgroundColor: campaign.status === 'active' ? colors.surfaceLight : colors.primary
                        }]}
                        onPress={toggleStatus}
                    >
                        {campaign.status === 'active' ? (
                            <Pause size={24} color={colors.textPrimary} fill={colors.textPrimary} />
                        ) : (
                            <Play size={24} color={colors.white} fill={colors.white} />
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.description}>{campaign.description || 'Sem descrição'}</Text>

                {campaign.session_name && (
                    <View style={styles.sessionBadge}>
                        <Wifi size={14} color={colors.primary} />
                        <Text style={styles.sessionText}>{campaign.session_name}</Text>
                    </View>
                )}

                {/* Metrics Grid (Redesigned 2x2) */}
                <View style={styles.metricsGrid}>
                    <View style={styles.metricCard}>
                        <Users size={20} color={colors.primary} style={styles.metricIcon} />
                        <Text style={styles.metricValue}>{campaign.total_leads || 0}</Text>
                        <Text style={styles.metricLabel}>Leads</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <MessageSquare size={20} color={colors.success} style={styles.metricIcon} />
                        <Text style={[styles.metricValue, { color: colors.success }]}>
                            {campaign.total_responded || 0}
                        </Text>
                        <Text style={styles.metricLabel}>Respostas</Text>
                    </View>
                </View>
                <View style={styles.metricsGrid}>
                    <View style={styles.metricCard}>
                        <Target size={20} color={colors.warning} style={styles.metricIcon} />
                        <Text style={[styles.metricValue, { color: colors.warning }]}>{responseRate}%</Text>
                        <Text style={styles.metricLabel}>Taxa de Resposta</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Bot size={20} color={'#a78bfa'} style={styles.metricIcon} />
                        <Text style={[styles.metricValue, { color: '#a78bfa' }]}>
                            R$ {(campaign.total_cost || 0).toFixed(2)}
                        </Text>
                        <Text style={styles.metricLabel}>Investimento IA</Text>
                    </View>
                </View>

                {/* TABS HEADER */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'leads' && styles.activeTab]}
                        onPress={() => setActiveTab('leads')}
                    >
                        <Text style={[styles.tabText, activeTab === 'leads' && styles.activeTabText]}>Leads</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'logs' && styles.activeTab]}
                        onPress={() => setActiveTab('logs')}
                    >
                        <Text style={[styles.tabText, activeTab === 'logs' && styles.activeTabText]}>Logs do Sistema</Text>
                    </TouchableOpacity>
                </View>


                {/* CONTENT: LEADS vs LOGS */}
                {activeTab === 'leads' ? (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Leads Recentes</Text>
                            <TouchableOpacity
                                style={styles.addLeadButton}
                                onPress={() => navigation.navigate('LeadImport', { campaignId: id })}
                            >
                                <UserPlus size={16} color={colors.primary} />
                                <Text style={styles.addLeadText}>Importar</Text>
                            </TouchableOpacity>
                        </View>

                        {leads.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>Nenhum lead nesta campanha</Text>
                            </View>
                        ) : (
                            leads.map((lead, index) => (
                                <View key={index} style={styles.leadItem}>
                                    <View style={styles.leadAvatar}>
                                        <Text style={styles.leadInitials}>{lead.name?.[0] || '?'}</Text>
                                    </View>
                                    <View style={styles.leadInfo}>
                                        <Text style={styles.leadName}>{lead.name || lead.phone}</Text>
                                        <Text style={[styles.leadStatus, { color: getStatusColor(lead.status) }]}>
                                            {lead.status || 'Novo'}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                ) : (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Atividades Recentes</Text>
                        </View>
                        {logs.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>Sem registros de atividade.</Text>
                            </View>
                        ) : (
                            logs.map((log) => (
                                <View key={log.id} style={styles.logItem}>
                                    <View style={[styles.logIndicator, { backgroundColor: getLogStyle(log.type).color }]} />
                                    <View style={styles.logContent}>
                                        <Text style={styles.logMessage}>{log.message}</Text>
                                        <Text style={styles.logTime}>{new Date(log.created_at).toLocaleTimeString()}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        marginRight: spacing.md,
        padding: spacing.xs,
    },
    headerTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        flex: 1,
        textAlign: 'center',
    },
    headerAction: {
        width: 40,
        height: 40,
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    statusCard: {
        backgroundColor: colors.surfaceLight,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    statusInfo: {
        flex: 1,
    },
    campaignName: {
        ...typography.h2,
        marginBottom: spacing.xs,
        color: colors.textPrimary, // Changed from white to textPrimary for better contrast on surfaceLight
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    controlButton: {
        width: 50,
        height: 50,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    description: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.md,
        paddingHorizontal: spacing.lg, // Added padding to align with other content
    },
    sessionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.primary + '15', // 15% opacity
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    sessionText: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: '600',
    },
    metricsGrid: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    metricCard: {
        flex: 1,
        backgroundColor: colors.surfaceLight,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    metricIcon: {
        marginBottom: spacing.xs,
        opacity: 0.8,
    },
    metricValue: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
        fontFamily: 'monospace',
    },
    metricLabel: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2,
    },
    section: {
        marginBottom: spacing.xxl,
    },
    sectionTitle: {
        ...typography.h3,
        marginBottom: spacing.md,
    },
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        ...typography.body,
        color: colors.textMuted,
    },
    leadItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
    },
    leadAvatar: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.full,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    leadInitials: {
        color: colors.white,
        fontWeight: '700',
    },
    leadInfo: {
        flex: 1,
    },
    leadName: {
        ...typography.body,
        fontWeight: '600',
    },
    leadStatus: {
        ...typography.caption,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surfaceLight,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: borderRadius.sm,
    },
    activeTab: {
        backgroundColor: colors.background,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    tabText: {
        ...typography.body,
        fontSize: 13,
        fontWeight: '600',
        color: colors.textMuted,
    },
    activeTabText: {
        color: colors.textPrimary,
        fontWeight: '700',
    },
    logItem: {
        flexDirection: 'row',
        padding: spacing.md,
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm, // increased spacing
        borderLeftWidth: 3,
        borderLeftColor: colors.border,
        overflow: 'hidden'
    },
    logIndicator: {
        width: 4,
        height: '100%',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
    },
    logContent: {
        flex: 1,
        marginLeft: spacing.xs,
    },
    logMessage: {
        ...typography.caption,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    logTime: {
        fontSize: 10,
        color: colors.textMuted,
    }
});

const getStatusColor = (status) => {
    switch (status) {
        case 'pending': return colors.warning;
        case 'contacted': return colors.primary;
        case 'responded': return colors.success;
        case 'completed': return colors.textSecondary;
        default: return colors.textMuted;
    }
};

export default CampaignDetailsScreen;


