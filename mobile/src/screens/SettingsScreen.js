import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Switch,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Key,
    Globe,
    Bot,
    Bell,
    Save,
    Eye,
    EyeOff,
    RefreshCw
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const SettingsScreen = () => {
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showKeys, setShowKeys] = useState({});

    const [settings, setSettings] = useState({
        gemini_key: '',
        waha_url: '',
        ai_triage_enabled: false,
        waha_webhook_url: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .select('*')
                .eq('user_id', user?.id)
                .single();

            if (data) {
                setSettings({
                    gemini_key: data.gemini_key || '',
                    waha_url: data.waha_url || '',
                    ai_triage_enabled: data.ai_triage_enabled || false,
                    waha_webhook_url: data.waha_webhook_url || ''
                });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('system_settings')
                .upsert({
                    user_id: user?.id,
                    ...settings,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) throw error;
            Alert.alert('Sucesso', 'Configurações salvas!');
        } catch (error) {
            console.error('Error saving settings:', error);
            Alert.alert('Erro', 'Falha ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const toggleShowKey = (field) => {
        setShowKeys(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleLogout = () => {
        Alert.alert(
            'Sair da conta',
            'Deseja realmente sair?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: signOut }
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Configurações</Text>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveSettings}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Save size={16} color="#fff" />
                            <Text style={styles.saveButtonText}>Salvar</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* API Keys Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Chaves de API</Text>

                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <View style={styles.inputLabel}>
                                <Key size={16} color={colors.textMuted} />
                                <Text style={styles.labelText}>Gemini API Key</Text>
                            </View>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={settings.gemini_key}
                                    onChangeText={(v) => handleChange('gemini_key', v)}
                                    placeholder="AIza..."
                                    placeholderTextColor={colors.textDark}
                                    secureTextEntry={!showKeys.gemini_key}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => toggleShowKey('gemini_key')}
                                >
                                    {showKeys.gemini_key ? (
                                        <EyeOff size={18} color={colors.textMuted} />
                                    ) : (
                                        <Eye size={18} color={colors.textMuted} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.inputGroup}>
                            <View style={styles.inputLabel}>
                                <Globe size={16} color={colors.textMuted} />
                                <Text style={styles.labelText}>WAHA URL</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={settings.waha_url}
                                onChangeText={(v) => handleChange('waha_url', v)}
                                placeholder="http://localhost:3000"
                                placeholderTextColor={colors.textDark}
                                keyboardType="url"
                            />
                        </View>
                    </View>
                </View>

                {/* AI Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Inteligência Artificial</Text>

                    <View style={styles.card}>
                        <View style={styles.toggleRow}>
                            <View style={styles.toggleInfo}>
                                <Bot size={20} color={colors.primary} />
                                <View style={styles.toggleText}>
                                    <Text style={styles.toggleTitle}>Triagem Automática</Text>
                                    <Text style={styles.toggleDescription}>
                                        IA classifica leads automaticamente
                                    </Text>
                                </View>
                            </View>
                            <Switch
                                value={settings.ai_triage_enabled}
                                onValueChange={(v) => handleChange('ai_triage_enabled', v)}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor={colors.white}
                            />
                        </View>
                    </View>
                </View>

                {/* Webhook Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Webhooks</Text>

                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <View style={styles.inputLabel}>
                                <Bell size={16} color={colors.textMuted} />
                                <Text style={styles.labelText}>Webhook URL</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={settings.waha_webhook_url}
                                onChangeText={(v) => handleChange('waha_webhook_url', v)}
                                placeholder="https://..."
                                placeholderTextColor={colors.textDark}
                                keyboardType="url"
                            />
                        </View>
                    </View>
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Conta</Text>

                    <View style={styles.card}>
                        <View style={styles.accountInfo}>
                            <Text style={styles.accountEmail}>{user?.email}</Text>
                            <Text style={styles.accountId}>ID: {user?.id?.slice(0, 8)}...</Text>
                        </View>

                        <View style={styles.divider} />

                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={handleLogout}
                        >
                            <Text style={styles.logoutText}>Sair da conta</Text>
                        </TouchableOpacity>
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
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
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
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary,
    },
    saveButtonText: {
        fontSize: 13,
        fontWeight: typography.weights.semibold,
        color: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    section: {
        marginTop: spacing.xl,
    },
    sectionTitle: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.semibold,
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.md,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    inputGroup: {
        padding: spacing.md,
    },
    inputLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: spacing.sm,
    },
    labelText: {
        fontSize: 13,
        fontWeight: typography.weights.medium,
        color: colors.textMuted,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: colors.text,
    },
    eyeButton: {
        position: 'absolute',
        right: 12,
        padding: 4,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
    },
    toggleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        flex: 1,
    },
    toggleText: {
        flex: 1,
    },
    toggleTitle: {
        fontSize: 14,
        fontWeight: typography.weights.medium,
        color: colors.white,
        marginBottom: 2,
    },
    toggleDescription: {
        fontSize: 12,
        color: colors.textMuted,
    },
    accountInfo: {
        padding: spacing.md,
    },
    accountEmail: {
        fontSize: 14,
        fontWeight: typography.weights.medium,
        color: colors.white,
        marginBottom: 4,
    },
    accountId: {
        fontSize: 12,
        color: colors.textMuted,
    },
    logoutButton: {
        padding: spacing.md,
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 14,
        fontWeight: typography.weights.medium,
        color: '#EF4444',
    },
});

export default SettingsScreen;
