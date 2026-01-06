import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { Megaphone, Wifi, Plus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../theme';
import apiService from '../services/api';

const CampaignsScreen = ({ navigation }) => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCampaigns = async () => {
        try {
            const data = await apiService.getCampaigns();
            setCampaigns(data || []);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCampaigns();
    };

    const renderCampaignItem = ({ item }) => {
        const isActive = item.status === 'active';
        const rate = item.total_leads > 0
            ? Math.round((item.total_responded / item.total_leads) * 100)
            : 0;

        return (
            <TouchableOpacity
                style={styles.campaignCard}
                onPress={() => navigation.navigate('CampaignDetails', { id: item.id })}
                activeOpacity={0.7}
            >
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.statusContainer}>
                        <View style={[styles.statusDot, isActive && styles.statusDotActive]} />
                        <Text style={[styles.statusText, isActive && styles.statusTextActive]}>
                            {isActive ? 'Ativa' : 'Pausada'}
                        </Text>
                    </View>
                    {item.session_name && (
                        <View style={styles.sessionBadge}>
                            <Wifi size={12} color={colors.primary} />
                            <Text style={styles.sessionText}>{item.session_name}</Text>
                        </View>
                    )}
                </View>

                {/* Title */}
                <Text style={styles.campaignName}>{item.name}</Text>

                {/* Metrics */}
                <View style={styles.metricsRow}>
                    <View style={styles.metric}>
                        <Text style={styles.metricValue}>{item.total_leads || 0}</Text>
                        <Text style={styles.metricLabel}>Leads</Text>
                    </View>
                    <View style={styles.metric}>
                        <Text style={styles.metricValue}>{item.total_responded || 0}</Text>
                        <Text style={styles.metricLabel}>Respostas</Text>
                    </View>
                    <View style={styles.metric}>
                        <Text style={[styles.metricValue, styles.metricValueSuccess]}>{rate}%</Text>
                        <Text style={styles.metricLabel}>Conv.</Text>
                    </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${rate}%` }]} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
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
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Campanhas</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('CampaignCreate')}
                >
                    <Text style={styles.addButtonText}>+ Nova</Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
                data={campaigns}
                renderItem={renderCampaignItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Megaphone size={48} color={colors.textMuted} strokeWidth={1} />
                        <Text style={styles.emptyText}>Nenhuma campanha ainda</Text>
                        <Text style={styles.emptySubtext}>Crie sua primeira campanha para começar</Text>
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
    addButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    addButtonText: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 14,
    },
    listContent: {
        padding: spacing.lg,
        gap: spacing.md,
    },
    campaignCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.textMuted,
    },
    statusDotActive: {
        backgroundColor: colors.success,
    },
    statusText: {
        ...typography.label,
    },
    statusTextActive: {
        color: colors.success,
    },
    sessionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.primary + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
    },
    sessionText: {
        fontSize: 11,
        color: colors.primary,
        fontWeight: '500',
    },
    campaignName: {
        ...typography.h2,
        marginBottom: spacing.lg,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    metric: {
        alignItems: 'center',
    },
    metricValue: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.textPrimary,
        fontFamily: 'monospace',
    },
    metricValueSuccess: {
        color: colors.success,
    },
    metricLabel: {
        ...typography.caption,
        marginTop: spacing.xs,
    },
    progressContainer: {
        marginTop: spacing.sm,
    },
    progressBar: {
        height: 6,
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.full,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.success,
        borderRadius: borderRadius.full,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
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
});

export default CampaignsScreen;
