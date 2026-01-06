import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Check, Smartphone } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import apiService from '../services/api';

const CampaignCreateScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await apiService.supabase.auth.getUser();
            if (!user) return;

            // Fetch running sessions from WAHA
            const runningSessions = await apiService.getSessions(user.id);

            // Allow selecting any session, but highlight connected ones
            setSessions(runningSessions || []);

            // Default select first one if available
            if (runningSessions?.length > 0) {
                setSelectedSession(runningSessions[0].name);
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
            Alert.alert('Erro', 'Falha ao carregar conexões.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Atenção', 'Por favor, dê um nome para a campanha.');
            return;
        }
        if (!selectedSession) {
            Alert.alert('Atenção', 'Selecione uma conexão de WhatsApp.');
            return;
        }

        try {
            setSubmitting(true);
            const newCampaign = await apiService.createCampaign({
                name,
                description,
                session_name: selectedSession,
                type: 'outbound'
            });

            // Navigate to the details of the new campaign
            navigation.replace('CampaignDetails', { id: newCampaign.id });
        } catch (error) {
            console.error('Error creating campaign:', error);
            Alert.alert('Erro', 'Falha ao criar campanha.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <ChevronLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nova Campanha</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>

                    {/* Name Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nome da Campanha</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Prospecção Imobiliária"
                            placeholderTextColor={colors.textMuted}
                            value={name}
                            onChangeText={setName}
                            autoFocus
                        />
                    </View>

                    {/* Description Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Descrição (Opcional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Notas internas sobre esta campanha..."
                            placeholderTextColor={colors.textMuted}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Instance Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Conexão (WhatsApp)</Text>
                        {loading ? (
                            <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start', marginVertical: 10 }} />
                        ) : sessions.length === 0 ? (
                            <Text style={styles.emptyText}>Nenhuma conexão ativa encontrada.</Text>
                        ) : (
                            <View style={styles.sessionsGrid}>
                                {sessions.map((session) => (
                                    <TouchableOpacity
                                        key={session.name}
                                        style={[
                                            styles.sessionCard,
                                            selectedSession === session.name && styles.sessionCardActive
                                        ]}
                                        onPress={() => setSelectedSession(session.name)}
                                    >
                                        <View style={styles.sessionIcon}>
                                            <Smartphone
                                                size={20}
                                                color={selectedSession === session.name ? colors.white : colors.textMuted}
                                            />
                                        </View>
                                        <Text
                                            style={[
                                                styles.sessionName,
                                                selectedSession === session.name && styles.sessionNameActive
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {session.name}
                                        </Text>
                                        {selectedSession === session.name && (
                                            <View style={styles.checkIcon}>
                                                <Check size={14} color={colors.white} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                </ScrollView>

                {/* Footer Action */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.createButton, submitting && { opacity: 0.7 }]}
                        onPress={handleCreate}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.createButtonText}>Criar Campanha</Text>
                        )}
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
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
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: spacing.xs,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surfaceLight,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        ...typography.h2,
        color: colors.textPrimary,
    },
    content: {
        padding: spacing.lg,
    },
    inputGroup: {
        marginBottom: spacing.xl,
    },
    label: {
        ...typography.label,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },
    input: {
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        color: colors.textPrimary,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    textArea: {
        minHeight: 100,
    },
    emptyText: {
        color: colors.textMuted,
        fontStyle: 'italic',
        padding: spacing.sm,
    },
    sessionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    sessionCard: {
        width: '48%',
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    sessionCardActive: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
    },
    sessionIcon: {
        marginRight: spacing.sm,
    },
    sessionName: {
        color: colors.textSecondary,
        fontWeight: '500',
        flex: 1,
    },
    sessionNameActive: {
        color: colors.white,
    },
    checkIcon: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
    footer: {
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
    },
    createButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    createButtonText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 16,
    }
});

export default CampaignCreateScreen;
