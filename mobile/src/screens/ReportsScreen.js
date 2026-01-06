import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    BarChart3,
    MessageSquare,
    Users,
    TrendingUp,
    Send,
    Clock
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

const ReportsScreen = () => {
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        // TODO: Fetch real metrics
        setTimeout(() => setRefreshing(false), 1000);
    };

    // Placeholder metrics
    const metrics = [
        {
            icon: Users,
            label: 'Total de Leads',
            value: '128',
            change: '+12%',
            color: '#3B82F6'
        },
        {
            icon: Send,
            label: 'Mensagens Enviadas',
            value: '1,247',
            change: '+23%',
            color: '#10B981'
        },
        {
            icon: MessageSquare,
            label: 'Respostas',
            value: '342',
            change: '+8%',
            color: '#8B5CF6'
        },
        {
            icon: TrendingUp,
            label: 'Taxa de Resposta',
            value: '27.4%',
            change: '+2.1%',
            color: '#F59E0B'
        },
    ];

    const recentActivity = [
        { time: '5min', text: 'Nova resposta de João Silva' },
        { time: '12min', text: 'Lead qualificado: Maria Santos' },
        { time: '1h', text: 'Campanha "Q1" atingiu 50 envios' },
        { time: '2h', text: 'Nova conversão registrada' },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Relatórios</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.periodButton}>
                        <Clock size={14} color={colors.textMuted} />
                        <Text style={styles.periodText}>Hoje</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Metrics Grid */}
                <View style={styles.metricsGrid}>
                    {metrics.map((metric, index) => (
                        <View key={index} style={styles.metricCard}>
                            <View style={[styles.iconContainer, { backgroundColor: metric.color + '20' }]}>
                                <metric.icon size={20} color={metric.color} />
                            </View>
                            <Text style={styles.metricValue}>{metric.value}</Text>
                            <Text style={styles.metricLabel}>{metric.label}</Text>
                            <Text style={[styles.metricChange, { color: '#10B981' }]}>
                                {metric.change}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Atividade Recente</Text>
                    <View style={styles.activityList}>
                        {recentActivity.map((item, index) => (
                            <View key={index} style={styles.activityItem}>
                                <View style={styles.activityDot} />
                                <View style={styles.activityContent}>
                                    <Text style={styles.activityText}>{item.text}</Text>
                                    <Text style={styles.activityTime}>{item.time}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Performance Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumo de Performance</Text>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Leads Ativos</Text>
                            <Text style={styles.summaryValue}>89</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Em Negociação</Text>
                            <Text style={styles.summaryValue}>23</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Conversões (mês)</Text>
                            <Text style={[styles.summaryValue, { color: '#10B981' }]}>12</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
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
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold,
        color: colors.white,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    periodButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    periodText: {
        fontSize: 13,
        color: colors.textMuted,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    metricCard: {
        width: '47%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    metricValue: {
        fontSize: 24,
        fontWeight: typography.weights.bold,
        color: colors.white,
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 12,
        color: colors.textMuted,
        marginBottom: 4,
    },
    metricChange: {
        fontSize: 12,
        fontWeight: typography.weights.medium,
    },
    section: {
        marginTop: spacing.xl,
    },
    sectionTitle: {
        fontSize: typography.sizes.md,
        fontWeight: typography.weights.semibold,
        color: colors.white,
        marginBottom: spacing.md,
    },
    activityList: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    activityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
        marginRight: spacing.md,
    },
    activityContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    activityText: {
        fontSize: 14,
        color: colors.text,
        flex: 1,
    },
    activityTime: {
        fontSize: 12,
        color: colors.textMuted,
        marginLeft: spacing.sm,
    },
    summaryCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
    },
    summaryLabel: {
        fontSize: 14,
        color: colors.textMuted,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: typography.weights.semibold,
        color: colors.white,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
    },
});

export default ReportsScreen;
