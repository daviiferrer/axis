import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, ActivityIndicator, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bot, Plus, Trash2, X, Check, Brain, User, Sparkles } from 'lucide-react-native';
import { supabase } from '../lib/supabaseClient';
import { colors } from '../theme';

// --- OPTIONS FOR DROPDOWNS ---
const ROLES = [
    { label: 'Consultor Comercial', value: 'consultor_comercial' },
    { label: 'Especialista Técnico', value: 'especialista_tecnico' },
    { label: 'SDR de Pré-venda', value: 'sdr_prevenda' },
    { label: 'Suporte Nível 1', value: 'suporte_n1' }
];

const EXPERIENCE = [
    { label: 'Recém-chegado', value: 'recem_chegado' },
    { label: '2 Anos de Casa', value: '2_anos' },
    { label: 'Veterano', value: 'veterano' }
];

const TONES = [
    { label: 'Cordial e Educado', value: 'cordial' },
    { label: 'Direto e Prático', value: 'direto' },
    { label: 'Amigável/Casual', value: 'casual' }
];

const MODELS = [
    { label: 'Gemini 2.5 Flash Lite', value: 'gemini-2.5-flash-lite' },
    { label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
    { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
    { label: 'Gemini 3 Flash (Preview)', value: 'gemini-3-flash-preview' }
];

const HANDOFF_STRATEGIES = [
    { label: 'Confirmar com Diretor', value: 'consultar_diretor' },
    { label: 'Consultar Sistema', value: 'consultar_sistema' },
    { label: 'Pedir Suporte', value: 'consultar_suporte' }
];

const EMOJI_LEVELS = [
    { label: 'Nenhum', value: 'nenhum' },
    { label: 'Discreto', value: 'discreto' },
    { label: 'Frequente', value: 'frequente' }
];

const TYPING_STYLES = [
    { label: 'Gramática Perfeita', value: 'formal' },
    { label: 'Natural (WhatsApp)', value: 'natural' },
    { label: 'Minimalista (tudo minúsculo)', value: 'minimalista' }
];

export default function AgentsScreen() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        model: 'gemini-2.5-flash',
        role: 'consultor_comercial',
        experience: '2_anos',
        tone: 'cordial',
        handoffStrategy: 'consultar_diretor',
        emojiLevel: 'discreto',
        typingStyle: 'natural'
    });

    // --- FETCH AGENTS ---
    const fetchAgents = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('agents')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAgents(data || []);
        } catch (error) {
            console.error('Error fetching agents:', error);
            Alert.alert('Erro', 'Não foi possível carregar os agentes.');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchAgents();
        }, [])
    );

    // --- FORM HANDLERS ---
    const openNewAgent = () => {
        setEditingId(null);
        setFormData({
            name: '',
            model: 'gemini-2.5-flash',
            role: 'consultor_comercial',
            experience: '2_anos',
            tone: 'cordial',
            handoffStrategy: 'consultar_diretor',
            emojiLevel: 'discreto',
            typingStyle: 'natural'
        });
        setModalVisible(true);
    };

    const openEditAgent = (agent) => {
        setEditingId(agent.id);
        // Parse system prompt to try and extract values (simplified)
        // Or better, just let them overwrite. 
        // For now, we mainly load raw data if we stored it structured, 
        // but here we just reset to defaults + name because strict parsing is complex.
        // If we want detailed editing, we need to parse the prompt text back.
        // For MVP mobile: We just allow creating new or overwriting basic settings.

        setFormData({
            name: agent.name,
            model: agent.model || 'gemini-2.5-flash',
            role: 'consultor_comercial', // Default since we don't parse back yet (MVP)
            experience: '2_anos',
            tone: 'cordial',
            handoffStrategy: 'consultar_diretor',
            emojiLevel: 'discreto',
            typingStyle: 'natural'
        });
        setModalVisible(true);
    };

    const buildSystemPrompt = () => {
        const { role, experience, tone, handoffStrategy, emojiLevel, typingStyle } = formData;

        const roleLabels = {
            consultor_comercial: 'Consultor Comercial',
            especialista_tecnico: 'Especialista Técnico',
            sdr_prevenda: 'SDR de Pré-venda',
            suporte_n1: 'Suporte Nível 1'
        };
        const expLabels = {
            recem_chegado: 'recém-chegado na empresa',
            '2_anos': 'com 2 anos de experiência',
            veterano: 'veterano com ampla experiência'
        };
        const handoffLabels = {
            consultar_diretor: 'Vou confirmar com meu diretor',
            consultar_sistema: 'Vou consultar no sistema interno',
            consultar_suporte: 'Vou pedir para o suporte técnico verificar'
        };
        const toneLabels = {
            cordial: 'Seja cordial e educado. Use "por gentileza", "senhor/senhora".',
            direto: 'Seja direto e prático. Frases curtas, foco em resolver rápido.',
            casual: 'Seja amigável e casual. Use linguagem de parceiro, gírias leves.'
        };
        const emojiLabels = {
            nenhum: 'Não use emojis.',
            discreto: 'Use emojis com moderação (1-2 por mensagem).',
            frequente: 'Use emojis com frequência para ser mais expressivo.'
        };
        const typingLabels = {
            formal: 'Use gramática perfeita e formal.',
            natural: 'Escreva de forma natural como no WhatsApp (vc, tbm, tá).',
            minimalista: 'Use tudo em minúsculas, estilo jovem/casual.'
        };

        return `SUA IDENTIDADE:
- Você é um(a) ${roleLabels[role] || 'Consultor'}, ${expLabels[experience] || ''}.
- Se precisar escalar: "${handoffLabels[handoffStrategy] || 'Vou verificar internamente'}".

REGRAS DE COMUNICAÇÃO (PERSONALIDADE):
- Tom: ${toneLabels[tone] || ''}
- Emojis: ${emojiLabels[emojiLevel] || ''}
- Estilo: ${typingLabels[typingStyle] || ''}`;
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Erro', 'O nome é obrigatório.');
            return;
        }

        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const payload = {
                user_id: user.id,
                name: formData.name,
                model: formData.model,
                temperature: 0.7,
                system_prompt: buildSystemPrompt()
            };

            let error;
            if (editingId) {
                const { error: upError } = await supabase
                    .from('agents')
                    .update(payload)
                    .eq('id', editingId);
                error = upError;
            } else {
                const { error: inError } = await supabase
                    .from('agents')
                    .insert([payload]);
                error = inError;
            }

            if (error) throw error;

            setModalVisible(false);
            fetchAgents();
        } catch (error) {
            console.error('Error saving agent:', error);
            Alert.alert('Erro', 'Falha ao salvar agente.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Excluir Agente',
            'Tem certeza? Isso não pode ser desfeito.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase.from('agents').delete().eq('id', id);
                            if (error) throw error;
                            fetchAgents();
                        } catch (e) {
                            Alert.alert('Erro', 'Falha ao excluir.');
                        }
                    }
                }
            ]
        );
    };

    // --- RENDER ITEM ---
    const renderAgent = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => openEditAgent(item)}>
            <View style={styles.cardIcon}>
                <Bot size={24} color={colors.primary} />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.agentName}>{item.name}</Text>
                <Text style={styles.agentModel}>{item.model}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                <Trash2 size={20} color={colors.danger} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    // --- SELECTION OPTION ---
    const SelectionGroup = ({ label, options, selectedValue, onSelect, icon: Icon }) => (
        <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
                {Icon && <Icon size={14} color={colors.textMuted} style={{ marginRight: 6 }} />}
                <Text style={styles.label}>{label}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {options.map(opt => (
                    <TouchableOpacity
                        key={opt.value}
                        style={[
                            styles.chip,
                            selectedValue === opt.value && styles.chipActive
                        ]}
                        onPress={() => onSelect(opt.value)}
                    >
                        <Text style={[
                            styles.chipText,
                            selectedValue === opt.value && styles.chipTextActive
                        ]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Meus Agentes</Text>
                <TouchableOpacity style={styles.addButton} onPress={openNewAgent}>
                    <Plus size={24} color={colors.white} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={agents}
                    keyExtractor={item => item.id}
                    renderItem={renderAgent}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Bot size={48} color={colors.textMuted} />
                            <Text style={styles.emptyText}>Nenhum agente criado ainda.</Text>
                        </View>
                    }
                />
            )}

            {/* MODAL WRAPPED IN KEYBOARD AVOIDING VIEW */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingId ? 'Editar Agente' : 'Novo Agente'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formScroll}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Nome do Agente</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: Consultor WhatsApp"
                                    placeholderTextColor={colors.textMuted}
                                    value={formData.name}
                                    onChangeText={t => setFormData({ ...formData, name: t })}
                                />
                            </View>

                            <SelectionGroup
                                label="Modelo de IA"
                                icon={Brain}
                                options={MODELS}
                                selectedValue={formData.model}
                                onSelect={v => setFormData({ ...formData, model: v })}
                            />

                            <SelectionGroup
                                label="Cargo / Identidade"
                                icon={User}
                                options={ROLES}
                                selectedValue={formData.role}
                                onSelect={v => setFormData({ ...formData, role: v })}
                            />

                            <SelectionGroup
                                label="Experiência"
                                icon={Brain}
                                options={EXPERIENCE}
                                selectedValue={formData.experience}
                                onSelect={v => setFormData({ ...formData, experience: v })}
                            />

                            <SelectionGroup
                                label="Estratégia de Handoff"
                                icon={User}
                                options={HANDOFF_STRATEGIES}
                                selectedValue={formData.handoffStrategy}
                                onSelect={v => setFormData({ ...formData, handoffStrategy: v })}
                            />

                            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }} />

                            <SelectionGroup
                                label="Tom de Voz"
                                icon={Sparkles}
                                options={TONES}
                                selectedValue={formData.tone}
                                onSelect={v => setFormData({ ...formData, tone: v })}
                            />

                            <SelectionGroup
                                label="Uso de Emojis"
                                icon={Sparkles}
                                options={EMOJI_LEVELS}
                                selectedValue={formData.emojiLevel}
                                onSelect={v => setFormData({ ...formData, emojiLevel: v })}
                            />

                            <SelectionGroup
                                label="Estilo de Digitação"
                                icon={Sparkles}
                                options={TYPING_STYLES}
                                selectedValue={formData.typingStyle}
                                onSelect={v => setFormData({ ...formData, typingStyle: v })}
                            />
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color={colors.white} />
                            ) : (
                                <Text style={styles.saveButtonText}>Salvar Agente</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.white,
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 20,
        paddingBottom: 100, // Space for Fab/Tabs
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    agentName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
        marginBottom: 4,
    },
    agentModel: {
        fontSize: 12,
        color: colors.textMuted,
    },
    deleteBtn: {
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
        gap: 12,
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: 16,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.white,
    },
    formScroll: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 24,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        color: colors.textMuted,
        fontSize: 14,
        textTransform: 'uppercase',
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.surface,
        borderRadius: 8,
        padding: 12,
        color: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        fontSize: 16,
    },
    chipsScroll: {
        flexDirection: 'row',
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: 8,
    },
    chipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipText: {
        color: colors.textMuted,
        fontSize: 14,
        fontWeight: '500',
    },
    chipTextActive: {
        color: colors.white,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 20, // Add bottom padding for safety
    },
    saveButtonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
});
