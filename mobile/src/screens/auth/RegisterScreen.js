import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';

const RegisterScreen = ({ navigation }) => {
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const THEME = {
        background: '#FFFFFF',
        textPrimary: '#1E293B',
        textSecondary: '#64748B',
        textMuted: '#94A3B8',
        border: '#E2E8F0',
        primary: '#3B82F6',
        errorBg: '#FEF2F2',
        errorText: '#B91C1C',
        errorBorder: '#FECACA',
    };

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Erro', 'Preencha todos os campos');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Erro', 'As senhas não coincidem');
            return;
        }

        try {
            setLoading(true);
            // Supabase auth usually doesn't take 'name' in signUp directly unless in metadata
            await register(email, password, { full_name: name });
            Alert.alert('Sucesso', 'Conta criada com sucesso! Verifique seu email se necessário.');
            navigation.navigate('Login');
        } catch (error) {
            Alert.alert('Erro', error.message || 'Falha ao criar conta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: THEME.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.content}>

                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <ArrowLeft size={24} color={THEME.textPrimary} />
                    </TouchableOpacity>

                    <Text style={[styles.title, { color: THEME.textPrimary }]}>Crie sua conta</Text>
                    Comece a usar o ÁXIS hoje mesmo

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: THEME.textPrimary }]}>Nome Completo</Text>
                            <TextInput
                                style={[styles.input, { borderColor: THEME.border, color: THEME.textPrimary, backgroundColor: 'white' }]}
                                placeholder="Seu Nome"
                                placeholderTextColor="#9CA3AF"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: THEME.textPrimary }]}>E-mail</Text>
                            <TextInput
                                style={[styles.input, { borderColor: THEME.border, color: THEME.textPrimary, backgroundColor: 'white' }]}
                                placeholder="seu@email.com"
                                placeholderTextColor="#9CA3AF"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: THEME.textPrimary }]}>Senha</Text>
                            <TextInput
                                style={[styles.input, { borderColor: THEME.border, color: THEME.textPrimary, backgroundColor: 'white' }]}
                                placeholder="••••••••"
                                placeholderTextColor="#9CA3AF"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: THEME.textPrimary }]}>Confirmar Senha</Text>
                            <TextInput
                                style={[styles.input, { borderColor: THEME.border, color: THEME.textPrimary, backgroundColor: 'white' }]}
                                placeholder="••••••••"
                                placeholderTextColor="#9CA3AF"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleRegister}
                            disabled={loading}
                            activeOpacity={0.8}
                            style={styles.buttonWrapper}
                        >
                            <LinearGradient
                                colors={['#60A5FA', '#3B82F6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.button, loading && styles.buttonDisabled]}
                            >
                                <Text style={styles.buttonText}>
                                    {loading ? 'Criando conta...' : 'Cadastrar'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => navigation.navigate('Login')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.footerText}>
                                Já tem uma conta?{' '}
                                <Text style={[styles.linkTextBold, { color: THEME.primary }]}>Entrar</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    backButton: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 32,
    },
    form: {
        gap: 24,
    },
    inputContainer: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
    },
    buttonWrapper: {
        marginTop: 8,
    },
    button: {
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    linkButton: {
        alignItems: 'center',
        marginTop: 8,
    },
    footerText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    linkTextBold: {
        fontWeight: '500',
    },
});

export default RegisterScreen;
