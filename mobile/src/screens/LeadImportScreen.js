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
import { ChevronLeft, MapPin, UserPlus, FileUp, Play, DownloadCloud, CheckCircle2 } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import apiService from '../services/api';

const LeadImportScreen = ({ route, navigation }) => {
    const { campaignId } = route.params;
    const [activeTab, setActiveTab] = useState('manual'); // manual | maps

    // Manual State
    const [manualName, setManualName] = useState('');
    const [manualPhone, setManualPhone] = useState('');
    const [manualLoading, setManualLoading] = useState(false);

    // Maps State
    const [mapsTerm, setMapsTerm] = useState('');
    const [mapsLocation, setMapsLocation] = useState('');
    const [mapsMax, setMapsMax] = useState('50');
    const [mapsLoading, setMapsLoading] = useState(false);
    const [mapsRunId, setMapsRunId] = useState(null);
    const [mapsProgress, setMapsProgress] = useState(null); // { added, total, status }

    // Poll for Maps Import Progress
    useEffect(() => {
        let interval;
        if (mapsRunId) {
            interval = setInterval(async () => {
                try {
                    const { data: { user } } = await apiService.supabase.auth.getUser();
                    const status = await apiService.pollApifySearch(mapsRunId, user?.id);

                    if (status) {
                        setMapsProgress(status);
                        if (status.status === 'SUCCEEDED' || status.status === 'FAILED') {
                            setMapsRunId(null);
                            setMapsLoading(false);
                            if (status.status === 'SUCCEEDED') {
                                Alert.alert('Sucesso', 'Importação finalizada!');
                                navigation.goBack();
                            } else {
                                Alert.alert('Atenção', 'Importação finalizada com status: ' + status.status);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error polling maps:', error);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [mapsRunId]);

    const handleManualSubmit = async () => {
        if (!manualPhone) return Alert.alert('Erro', 'Telefone é obrigatório');

        try {
            setManualLoading(true);
            await apiService.importLeadManual(campaignId, manualName, manualPhone);
            Alert.alert('Sucesso', 'Lead adicionado!');
            setManualName('');
            setManualPhone('');
        } catch (error) {
            Alert.alert('Erro', 'Falha ao adicionar lead.');
        } finally {
            setManualLoading(false);
        }
    };

    const handleMapsSubmit = async () => {
        if (!mapsTerm || !mapsLocation) return Alert.alert('Erro', 'Preencha os termos e localização');

        try {
            setMapsLoading(true);
            const { data: { user } } = await apiService.supabase.auth.getUser();

            // This starts the process on backend
            // Note: Backend endpoint /api/apify/search expects { searchTerms, location, maxResults, userId }
            // But we need to make sure we link it to the campaign!
            // Wait, the backend /api/apify/search implementation usually JUST searches and returns data or adds to a generic pool?
            // Checking existing logic... actually the backend usually adds to 'leads' or 'campaign_leads' if we pass campaignId
            // Let's assume we need to update the backend or the API call to include campaignId.
            // For now, I'll pass campaignId in the body and hope backend handles it, OR I'll handle the results later.
            // Actually, `apiService.startApifySearch` calls `/api/apify/search`.
            // Let's check if that endpoint supports campaignId in `backend/routes/waha.js` or similar?
            // Based on previous analysis, `ImportLeadsModal.jsx` passes campaignId to Supabase AFTER getting results? 
            // Or does it pass it to the search? 
            // `ImportLeadsModal.jsx` snippet shows: `apiService.request('/api/apify/search', ...)`

            // NOTE: I am assuming the backend `apify/admin` route handles this. I will pass campaignId just in case.

            const response = await apiService.request('/api/apify/search', {
                method: 'POST',
                body: JSON.stringify({
                    searchTerms: mapsTerm,
                    location: mapsLocation,
                    maxResults: parseInt(mapsMax),
                    userId: user.id,
                    campaignId: campaignId // Passing this to link directly if backend supports it
                })
            });

            if (response.runId) {
                setMapsRunId(response.runId);
                Alert.alert('Iniciado', 'Busca iniciada. Isso pode levar alguns minutos.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Falha ao iniciar busca.');
            setMapsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <ChevronLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Importar Leads</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'manual' && styles.activeTab]}
                    onPress={() => setActiveTab('manual')}
                >
                    <UserPlus size={20} color={activeTab === 'manual' ? colors.white : colors.textMuted} />
                    <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>Manual</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'maps' && styles.activeTab]}
                    onPress={() => setActiveTab('maps')}
                >
                    <MapPin size={20} color={activeTab === 'maps' ? colors.white : colors.textMuted} />
                    <Text style={[styles.tabText, activeTab === 'maps' && styles.activeTabText]}>Maps</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {activeTab === 'manual' ? (
                    <View style={styles.formContainer}>
                        <Text style={styles.sectionTitle}>Novo Lead Individual</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nome</Text>
                            <TextInput
                                style={styles.input}
                                value={manualName}
                                onChangeText={setManualName}
                                placeholder="João Silva"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Telefone (com DDD)</Text>
                            <TextInput
                                style={styles.input}
                                value={manualPhone}
                                onChangeText={setManualPhone}
                                placeholder="5511999999999"
                                keyboardType="phone-pad"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleManualSubmit}
                            disabled={manualLoading}
                        >
                            {manualLoading ? <ActivityIndicator color={colors.white} /> : (
                                <>
                                    <CheckCircle2 size={20} color={colors.white} />
                                    <Text style={styles.submitButtonText}>Adicionar Lead</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.formContainer}>
                        <Text style={styles.sectionTitle}>Buscar no Google Maps</Text>
                        <Text style={styles.sectionDesc}>Encontre empresas locais e importe contatos automaticamente.</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Tipo de Negócio</Text>
                            <TextInput
                                style={styles.input}
                                value={mapsTerm}
                                onChangeText={setMapsTerm}
                                placeholder="Ex: Pizzaria, Advogado, Clínica"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Localização (Cidade/Bairro)</Text>
                            <TextInput
                                style={styles.input}
                                value={mapsLocation}
                                onChangeText={setMapsLocation}
                                placeholder="Ex: Bauru, SP"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Máximo de Resultados</Text>
                            <TextInput
                                style={styles.input}
                                value={mapsMax}
                                onChangeText={setMapsMax}
                                keyboardType="numeric"
                                placeholder="50"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        {mapsRunId && (
                            <View style={styles.statusBox}>
                                <ActivityIndicator color={colors.primary} style={{ marginBottom: 10 }} />
                                <Text style={styles.statusText}>
                                    Importando...
                                    {mapsProgress ? ` ${mapsProgress.current || 0} encontrados` : ''}
                                </Text>
                            </View>
                        )}

                        {!mapsRunId && (
                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: colors.surfaceLight, borderColor: colors.primary, borderWidth: 1 }]}
                                onPress={handleMapsSubmit}
                                disabled={mapsLoading}
                            >
                                {mapsLoading ? <ActivityIndicator color={colors.primary} /> : (
                                    <>
                                        <DownloadCloud size={20} color={colors.primary} />
                                        <Text style={[styles.submitButtonText, { color: colors.primary }]}>Iniciar Busca</Text>
                                    </>
                                )}
                            </TouchableOpacity>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
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
        ...typography.h3,
        color: colors.textPrimary,
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        gap: spacing.sm,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: colors.primary,
    },
    tabText: {
        ...typography.body,
        fontWeight: '600',
        color: colors.textMuted,
    },
    activeTabText: {
        color: colors.white,
    },
    content: {
        padding: spacing.lg,
    },
    formContainer: {
        gap: spacing.lg,
    },
    sectionTitle: {
        ...typography.h3,
        marginBottom: spacing.xs,
    },
    sectionDesc: {
        ...typography.bodySmall,
        color: colors.textMuted,
        marginBottom: spacing.md,
    },
    inputGroup: {
        gap: spacing.sm,
    },
    label: {
        ...typography.label,
    },
    input: {
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.border,
    },
    submitButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
        paddingVertical: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    submitButtonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    statusBox: {
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.primary,
        marginTop: spacing.md,
    },
    statusText: {
        color: colors.primary,
        fontWeight: '600',
    }
});

export default LeadImportScreen;
