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
    Platform,
    Switch,
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Save, Clock, Zap, Brain, MessageSquare } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import apiService from '../services/api';
import { supabase } from '../lib/supabaseClient';

const SectionHeader = ({ icon: Icon, title }) => (
    <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
            <Icon size={18} color={colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
    </View>
);

const CampaignEditScreen = ({ route, navigation }) => {
    const { id } = route.params;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [agents, setAgents] = useState([]);
    const [agentsModalVisible, setAgentsModalVisible] = useState(false);

    // Settings State
    const [settings, setSettings] = useState({
        daily_limit: '50',
        start_time: '09:00',
        end_time: '18:00',
        trigger_type: 'interval', // interval | online
        min_interval: '300', // seconds
        max_interval: '600', // seconds

        // Context
        agent_name: 'Ana',
        product_name: '',
        offer_type: 'hard', // soft | hard
        system_prompt: '',
    });

    useEffect(() => {
        loadCampaign();
        fetchAgents();
    }, [id]);

    const fetchAgents = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('agents')
                .select('*')
                .eq('user_id', user.id)
                .order('name');
            if (error) throw error;
            setAgents(data || []);
        } catch (error) {
            console.error('Error fetching agents:', error);
        }
    };

    const loadCampaign = async () => {
        try {
            setLoading(true);
            const campaign = await apiService.getCampaign(id);
            if (campaign?.settings) {
                // Merge with defaults
                setSettings(prev => ({
                    ...prev,
                    ...campaign.settings,
                    // Ensure strings for inputs
                    daily_limit: String(campaign.settings.daily_limit || 50),
                    min_interval: String(campaign.settings.min_interval || 300),
                    max_interval: String(campaign.settings.max_interval || 600),
                }));
            }
        } catch (error) {
            console.error('Error loading campaign:', error);
            Alert.alert('Erro', 'Falha ao carregar configurações.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const updatedSettings = {
                ...settings,
                // Parse numbers
                daily_limit: parseInt(settings.daily_limit) || 50,
                min_interval: parseInt(settings.min_interval) || 300,
                max_interval: parseInt(settings.max_interval) || 600,
            };

            await apiService.updateCampaignSettings(id, updatedSettings);
            Alert.alert('Sucesso', 'Configurações salvas!');
            navigation.goBack();
        } catch (error) {
            console.error('Error saving settings:', error);
            Alert.alert('Erro', 'Falha ao salvar configurações.');
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

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
                <Text style={styles.headerTitle}>Configurações</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    style={styles.saveHeaderButton}
                >
                    {saving ? <ActivityIndicator size="small" color={colors.primary} /> : <Save size={20} color={colors.primary} />}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView contentContainerStyle={styles.content}>

                    {/* Schedule Section */}
                    <View style={styles.section}>
                        <SectionHeader icon={Clock} title="Agendamento e Limites" />

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.md }]}>
                                <Text style={styles.label}>Início (00:00)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={settings.start_time}
                                    onChangeText={(v) => updateSetting('start_time', v)}
                                    placeholder="09:00"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Fim (00:00)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={settings.end_time}
                                    onChangeText={(v) => updateSetting('end_time', v)}
                                    placeholder="18:00"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Limite Diário de Leads</Text>
                            <TextInput
                                style={styles.input}
                                value={settings.daily_limit}
                                onChangeText={(v) => updateSetting('daily_limit', v)}
                                keyboardType="numeric"
                                placeholder="50"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                    </View>

                    {/* Trigger Section */}
                    <View style={styles.section}>
                        <SectionHeader icon={Zap} title="Gatilho de Disparo" />

                        <View style={styles.switchRow}>
                            <View>
                                <Text style={styles.switchTitle}>Modo Sniper (Online)</Text>
                                <Text style={styles.switchDesc}>Disparar apenas quando o lead estiver online</Text>
                            </View>
                            <Switch
                                value={settings.trigger_type === 'online'}
                                onValueChange={(v) => updateSetting('trigger_type', v ? 'online' : 'interval')}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor={colors.white}
                            />
                        </View>

                        {settings.trigger_type === 'interval' && (
                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.md }]}>
                                    <Text style={styles.label}>Mínimo (seg)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={settings.min_interval}
                                        onChangeText={(v) => updateSetting('min_interval', v)}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Máximo (seg)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={settings.max_interval}
                                        onChangeText={(v) => updateSetting('max_interval', v)}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        )}
                    </View>

                    {/* AI Config Section */}
                    <View style={styles.section}>
                        <SectionHeader icon={Brain} title="Configuração da IA" />

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nome do Produto/Serviço</Text>
                            <TextInput
                                style={styles.input}
                                value={settings.product_name}
                                onChangeText={(v) => updateSetting('product_name', v)}
                                placeholder="Ex: Consultoria Financeira"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Agente (Persona)</Text>
                            <TouchableOpacity
                                style={styles.selectButton}
                                onPress={() => setAgentsModalVisible(true)}
                            >
                                <Text style={styles.selectButtonText}>
                                    {settings.agent_name || 'Selecionar Agente'}
                                </Text>
                                <ChevronLeft size={20} color={colors.textMuted} style={{ transform: [{ rotate: '-90deg' }] }} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Prompt do Sistema (Instruções)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={settings.system_prompt}
                                onChangeText={(v) => updateSetting('system_prompt', v)}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                                placeholder="Descreva como a IA deve se comportar..."
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Agent Selection Modal */}
            <Modal
                visible={agentsModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setAgentsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecionar Agente</Text>
                            <TouchableOpacity onPress={() => setAgentsModalVisible(false)}>
                                <Text style={{ color: colors.textMuted }}>Fechar</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {agents.map(agent => (
                                <TouchableOpacity
                                    key={agent.id}
                                    style={styles.agentOption}
                                    onPress={() => {
                                        updateSetting('agent_name', agent.name);
                                        updateSetting('system_prompt', agent.system_prompt || '');
                                        setAgentsModalVisible(false);
                                    }}
                                >
                                    <View style={styles.agentIcon}>
                                        <Brain size={20} color={colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.agentOptionName}>{agent.name}</Text>
                                        <Text style={styles.agentOptionRole}>{agent.model}</Text>
                                    </View>
                                    {settings.agent_name === agent.name && (
                                        <View style={{ marginLeft: 'auto' }}>
                                            {/* Checkmark placeholder or icon */}
                                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                            {agents.length === 0 && (
                                <Text style={styles.emptyText}>Nenhum agente encontrado.</Text>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
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
    saveHeaderButton: {
        padding: spacing.xs,
        borderRadius: borderRadius.full,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: 80,
    },
    section: {
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionIcon: {
        padding: spacing.xs,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderRadius: borderRadius.sm,
        marginRight: spacing.sm,
    },
    sectionTitle: {
        ...typography.h3,
        fontSize: 15,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inputGroup: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.label,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        color: colors.textPrimary,
        fontSize: 14,
        borderWidth: 1,
        borderColor: colors.border,
    },
    textArea: {
        minHeight: 120,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingVertical: spacing.xs,
    },
    switchTitle: {
        ...typography.body,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    switchDesc: {
        ...typography.caption,
        marginTop: 2,
    },
    selectButton: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectButtonText: {
        color: colors.textPrimary,
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
        padding: spacing.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    modalTitle: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    agentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    agentIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    agentOptionName: {
        color: colors.textPrimary,
        fontWeight: '600',
        fontSize: 16,
    },
    agentOptionRole: {
        color: colors.textMuted,
        fontSize: 12,
    },
    emptyText: {
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.xl,
    }
});

export default CampaignEditScreen;
