import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Power, LogOut, Database, QrCode, Trash2, Smartphone, Monitor } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

const InstanceCard = ({ instance, onPress, onAction, loadingAction }) => {
    const isWorking = instance.status === 'WORKING';
    const isScanning = instance.status === 'SCAN_QR_CODE';
    const isStopped = instance.status === 'STOPPED';

    const getStatusColor = () => {
        if (isWorking) return colors.success;
        if (isScanning) return colors.warning;
        if (isStopped) return colors.error;
        return colors.textMuted;
    };

    const getStatusText = () => {
        switch (instance.status) {
            case 'WORKING': return 'Conectado';
            case 'SCAN_QR_CODE': return 'Escanear QR';
            case 'STOPPED': return 'Parado';
            case 'STARTING': return 'Iniciando...';
            case 'FAILED': return 'Falha';
            default: return instance.status || 'Desconhecido';
        }
    };

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress(instance)}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Smartphone size={24} color={colors.primary} />
                </View>
                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>{instance.name}</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                        <Text style={[styles.statusText, { color: getStatusColor() }]}>
                            {getStatusText()}
                        </Text>
                    </View>
                </View>

                {/* Main Action based on status */}
                {loadingAction === instance.name ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <View style={styles.actions}>
                        {isWorking && (
                            <TouchableOpacity style={styles.actionBtn} onPress={() => onAction('stop', instance)}>
                                <Power size={20} color={colors.error} />
                            </TouchableOpacity>
                        )}
                        {isStopped && (
                            <TouchableOpacity style={[styles.actionBtn, styles.startBtn]} onPress={() => onAction('start', instance)}>
                                <Power size={20} color={colors.success} />
                            </TouchableOpacity>
                        )}
                        {isScanning && (
                            <TouchableOpacity style={styles.actionBtn} onPress={() => onAction('qr', instance)}>
                                <QrCode size={20} color={colors.primary} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>

            {/* Platform/Me Info if available */}
            {instance.me && (
                <View style={styles.footer}>
                    <Text style={styles.number}>
                        {instance.me.id?.split(':')[0]?.replace(/\D/g, '') || instance.me.pushName || 'WhatsApp Web'}
                    </Text>
                    <Monitor size={14} color={colors.textMuted} />
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: typography.weights.bold,
        color: colors.text,
        marginBottom: 4,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: typography.weights.medium,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    startBtn: {
        borderColor: colors.success + '40',
        backgroundColor: colors.success + '10',
    },
    footer: {
        marginTop: spacing.md,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    number: {
        fontSize: 12,
        color: colors.textMuted,
        fontFamily: 'monospace',
    }
});

export default InstanceCard;
