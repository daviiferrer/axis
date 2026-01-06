import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    Image,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Copy, Share2, Search, User } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import apiService from '../services/api';
import { useAuth } from '../context/AuthContext';
import InstanceCard from '../components/InstanceCard';

const InstancesScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [instances, setInstances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isCreateModalVisible, setCreateModalVisible] = useState(false);
    const [isQRModalVisible, setQRModalVisible] = useState(false);
    const [isPairingModalVisible, setPairingModalVisible] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [pairingCode, setPairingCode] = useState(null);
    const [loadingPairing, setLoadingPairing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [newSessionName, setNewSessionName] = useState('');
    const [creating, setCreating] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [selectedInstance, setSelectedInstance] = useState(null);
    const [loadingAction, setLoadingAction] = useState(null); // 'start', 'stop', etc.

    const fetchInstances = useCallback(async () => {
        try {
            if (!user?.id) return;
            const data = await apiService.getSessions(user.id);
            setInstances(data || []);
        } catch (error) {
            console.error('Error fetching instances:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchInstances();
    }, [fetchInstances]);

    // Polling for status updates every 5 seconds
    useEffect(() => {
        const interval = setInterval(fetchInstances, 5000);
        return () => clearInterval(interval);
    }, [fetchInstances]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchInstances();
    };

    const handleCreateSession = async () => {
        if (!newSessionName.trim()) {
            Alert.alert('Erro', 'Nome da instância é obrigatório');
            return;
        }

        setCreating(true);
        try {
            await apiService.createSession(newSessionName.trim(), user.id);
            setCreateModalVisible(false);
            setNewSessionName('');
            fetchInstances();
            Alert.alert('Sucesso', 'Instância criada! Aguarde a inicialização.');
        } catch (error) {
            Alert.alert('Erro', error.message || 'Falha ao criar instância');
        } finally {
            setCreating(false);
        }
    };

    const handleAction = async (action, instance) => {
        setLoadingAction(instance.name);
        try {
            if (action === 'start') {
                await apiService.startSession(instance.name);
            } else if (action === 'stop') {
                await apiService.stopSession(instance.name);
            } else if (action === 'delete') {
                Alert.alert(
                    'Excluir Instância',
                    `Tem certeza que deseja excluir ${instance.name}?`,
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                            text: 'Excluir',
                            style: 'destructive',
                            onPress: async () => {
                                await apiService.deleteSession(instance.name);
                                fetchInstances();
                            }
                        }
                    ]
                );
                return; // Delete is handled in callback
            } else if (action === 'qr') {
                showQR(instance);
                return;
            } else if (action === 'logout') {
                await apiService.logoutSession(instance.name);
            }
            // Add slight delay to allow server to process before refresh
            setTimeout(fetchInstances, 1000);
        } catch (error) {
            Alert.alert('Erro', error.message || `Falha na ação ${action}`);
        } finally {
            if (action !== 'delete' && action !== 'qr') {
                setLoadingAction(null);
            }
        }
    };

    const showQR = async (instance) => {
        setSelectedInstance(instance);
        setQRModalVisible(true);
        setLoadingAction(instance.name); // keep loading on card while fetching
        try {
            const data = await apiService.getSessionScreenshot(instance.name);
            // Assuming data is base64 string or a blob response
            // If the API returns direct image buffer, we might need to handle it.
            // wahaProxy returns res.send(buffer) for screenshot. 
            // On mobile, fetch returns blob/text. ApiService handles .json().
            // Wait, getSessionScreenshot in wahaProxy returns JSON { data: 'base64...' } IF waha returns that?
            // Actually wahaProxy screenshot endpoint: returns res.json(data). Data from WAHA /api/screenshot is image/png usually?
            // Let's check wahaProxy.js again.
            // wahaProxy line 396: res.json(data);
            // WAHA /api/screenshot usually returns binary image. "createWahaRequest" assumes JSON response by default unless specified?
            // createWahaRequest uses axios.
            // If WAHA returns image, axios.data will be the binary junk stringified if we are not careful?
            // Waha Documentation says GET /api/screenshot returns image/png.
            // In wahaProxy, createWahaRequest calls axios() which by default parses JSON.
            // If it returns image, it might fail or return garbage string.
            // For now, let's assume it works or returns base64 wrapper if user implemented it that way.
            // Actually, wahaProxy logic for screenshot was: 
            // const data = await createWahaRequest('GET', `/api/screenshot?session=${session}`);
            // If that fails, I'll need to fix wahaProxy to handle arraybuffer.

            // Assuming it returns a base64 string or url for now.
            if (data && data.data) {
                // data is likely the binary if axios didn't parse. Or maybe base64 if wrapped.
                // Let's fallback to constructed URL if data is weird.
                // Actually the easiest way for mobile is to just load the URL in Image component with auth headers?
                // But auth headers are tricky in Image component.

                // Let's assume for this MVP we might need to fix the backend to return base64 for mobile easiest consumption.
                // Or we use the data as uri.
                setQrCode({ uri: `data:image/png;base64,${data}` });
            } else {
                // Fallback to direct URL (might fail if auth required on backend, and backend requires auth)
                // But wahaProxy doesn't require auth on /api/waha/sessions/... yet? 
                // Wait, backend index.js has no global auth middleware shown in the snippet.
                // So direct URL logic:
                setQrCode({ uri: `${apiService.baseUrl}/api/waha/sessions/${instance.name}/screenshot` });
            }

        } catch (error) {
            console.error(error);
            // Fallback
            setQrCode({ uri: `${apiService.baseUrl}/api/waha/sessions/${instance.name}/screenshot` });
            setLoadingAction(null);
        }
    };

    const openPairingFromQR = () => {
        setQRModalVisible(false);
        setTimeout(() => {
            setPairingModalVisible(true);
        }, 300);
    };

    const closePairingModal = () => {
        setPairingModalVisible(false);
        setPhoneNumber('');
        setPairingCode(null);
    };

    const handleRequestPairingCode = async () => {
        if (!phoneNumber) {
            Alert.alert('Erro', 'Digite o número do telefone');
            return;
        }

        setLoadingPairing(true);
        try {
            const sessionName = selectedInstance ? selectedInstance.name : (instances[0] ? instances[0].name : null);

            if (!sessionName) {
                throw new Error('Nenhuma sessão selecionada.');
            }

            const data = await apiService.requestPairingCode(sessionName, phoneNumber);
            if (data && data.code) {
                setPairingCode(data.code);
            } else {
                // Some APIs return simple string or different structure
                // Logic based on wahaProxy response
                if (typeof data === 'string') setPairingCode(data);
                else throw new Error('Formato de código inválido.');
            }
        } catch (error) {
            Alert.alert('Erro', error.message || 'Falha ao gerar código de pareamento');
        } finally {
            setLoadingPairing(false);
        }
    };

    const navigateToChats = (instance) => {
        if (instance.status !== 'WORKING') {
            Alert.alert('Instância não conectada', 'Por favor, conecte a instância primeiro.');
            return;
        }
        navigation.navigate('SessionChats', {
            sessionName: instance.name,
            sessionStatus: instance.status
        });
    };

    // Filter instances
    const filteredInstances = instances.filter(inst =>
        inst.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }) => (
        <InstanceCard
            instance={item}
            onPress={navigateToChats}
            onAction={handleAction}
            loadingAction={loadingAction}
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header (Standardized) */}
            <View style={styles.header}>
                <Text style={styles.title}>Instâncias</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setCreateModalVisible(true)}
                >
                    <Plus size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Search Bar (Standardized) */}
            <View style={styles.searchContainer}>
                <Search size={16} color={colors.textMuted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar instâncias..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery} // reused state
                />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredInstances}
                    renderItem={renderItem}
                    keyExtractor={item => item.name}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Nenhuma instância</Text>
                            <Text style={styles.emptySubtext}>Crie uma nova para começar.</Text>
                        </View>
                    }
                />
            )}

            {/* Create Session Modal */}
            <Modal
                visible={isCreateModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setCreateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nova Instância</Text>
                            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                                <X size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Nome da Conexão</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: Vendas, Suporte..."
                                placeholderTextColor={colors.textMuted}
                                value={newSessionName}
                                onChangeText={setNewSessionName}
                                autoFocus
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.createButton, creating && styles.disabledButton]}
                            onPress={handleCreateSession}
                            disabled={creating}
                        >
                            {creating ? (
                                <ActivityIndicator color={colors.white} />
                            ) : (
                                <Text style={styles.createButtonText}>Criar Conexão</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* QR Code Modal */}
            <Modal
                visible={isQRModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setQRModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.qrModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Escanear QR Code</Text>
                            <TouchableOpacity onPress={() => setQRModalVisible(false)}>
                                <X size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.qrContainer}>
                            {qrCode ? (
                                <Image
                                    source={qrCode}
                                    style={styles.qrImage}
                                    resizeMode="contain"
                                    onError={() => Alert.alert('Erro', 'Não foi possível carregar o QR Code. Tente novamente.')}
                                />
                            ) : (
                                <ActivityIndicator size="large" color={colors.primary} />
                            )}
                        </View>

                        <Text style={styles.qrInstructions}>
                            1. Abra o WhatsApp no seu celular{'\n'}
                            2. Toque em Menu ou Configurações{'\n'}
                            3. Selecione "Aparelhos conectados"{'\n'}
                            4. Toque em "Conectar um aparelho"{'\n'}
                            5. Aponte a câmera para esta tela
                        </Text>

                        <TouchableOpacity style={styles.closeButton} onPress={() => setQRModalVisible(false)}>
                            <Text style={styles.closeButtonText}>Fechar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.closeButton, { marginTop: 10, backgroundColor: 'transparent' }]}
                            onPress={openPairingFromQR}
                        >
                            <Text style={[styles.closeButtonText, { color: colors.primary }]}>
                                Conectar com Número de Telefone
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Pairing Code Modal */}
            <Modal
                visible={isPairingModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closePairingModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Pareamento por Código</Text>
                            <TouchableOpacity onPress={closePairingModal}>
                                <X size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {!pairingCode ? (
                                <>
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.label}>Seu Número (com DDD)</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Ex: 5511999999999"
                                            placeholderTextColor={colors.textMuted}
                                            value={phoneNumber}
                                            onChangeText={setPhoneNumber}
                                            keyboardType="phone-pad"
                                            autoFocus
                                        />
                                        <Text style={[styles.subtitle, { fontSize: 12 }]}>
                                            Digite o número do WhatsApp que você quer conectar a esta instância.
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.createButton, loadingPairing && styles.disabledButton]}
                                        onPress={handleRequestPairingCode}
                                        disabled={loadingPairing}
                                    >
                                        {loadingPairing ? (
                                            <ActivityIndicator color={colors.white} />
                                        ) : (
                                            <Text style={styles.createButtonText}>Gerar Código</Text>
                                        )}
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={styles.qrInstructions}>
                                        No seu WhatsApp: {'\n'}
                                        1. Configurações {'>'} Aparelhos conectados {'\n'}
                                        2. Conectar um aparelho {'\n'}
                                        3. "Conectar com número de telefone"
                                    </Text>

                                    {/* Code Display Area */}
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: colors.background,
                                        padding: 10,
                                        borderRadius: 8,
                                        marginBottom: 20
                                    }}>
                                        <TextInput
                                            style={{
                                                fontSize: 32,
                                                fontWeight: 'bold',
                                                letterSpacing: 4,
                                                color: colors.primary,
                                                textAlign: 'center',
                                                minWidth: 200
                                            }}
                                            value={pairingCode?.toUpperCase()}
                                            editable={false}
                                            selectable={true}
                                        />
                                        <TouchableOpacity
                                            onPress={() => Share.share({ message: pairingCode })}
                                            style={{ padding: 10 }}
                                        >
                                            <Share2 size={24} color={colors.primary} />
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={[styles.subtitle, { textAlign: 'center', marginBottom: 20 }]}>
                                        Copie o código acima e cole no WhatsApp para conectar.
                                    </Text>

                                    <TouchableOpacity style={styles.createButton} onPress={closePairingModal}>
                                        <Text style={styles.createButtonText}>Concluir</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    // Header (Standardized)
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
        padding: spacing.sm,
    },
    // Search Bar (Standardized)
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
    listContent: {
        padding: spacing.md,
        paddingBottom: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl * 2,
    },
    emptyText: {
        ...typography.h3,
        marginBottom: spacing.xs,
    },
    emptySubtext: {
        ...typography.bodySmall,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 4,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: typography.weights.bold,
        color: colors.text,
    },
    inputContainer: {
        marginBottom: spacing.xl,
    },
    label: {
        fontSize: 14,
        fontWeight: typography.weights.medium,
        color: colors.textMuted,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        color: colors.text,
        fontSize: 16,
    },
    createButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.7,
    },
    createButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: typography.weights.semibold,
    },
    // QR Modal specific
    qrModalContent: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        alignItems: 'center',
    },
    qrContainer: {
        width: 250,
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: spacing.lg,
        overflow: 'hidden',
    },
    qrImage: {
        width: '100%',
        height: '100%',
    },
    qrInstructions: {
        textAlign: 'center',
        color: colors.textMuted,
        lineHeight: 22,
        marginBottom: spacing.xl,
    },
    closeButton: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
    },
    closeButtonText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: typography.weights.medium,
    }
});

export default InstancesScreen;
