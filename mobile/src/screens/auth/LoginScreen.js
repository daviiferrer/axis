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
import Svg, { Path } from 'react-native-svg';
import { Check } from 'lucide-react-native';

const LoginScreen = ({ navigation }) => {
    const { login, loginWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    // Explicitly forcing light theme colors from desktop version
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
        googleBorder: '#E2E8F0',
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Erro', 'Preencha todos os campos');
            return;
        }

        try {
            setLoading(true);
            await login(email, password);
            // Navigation is handled by auth state listener usually,/
            // but if not, we might need manual navigation. 
            // Existing code didn't navigate manually on success (AuthContext usually updates user state -> MainNavigator switches).
            // However, LoginPage.jsx DOES navigate navigate('/app/dashboard').
            // I will leave it to the auth flow but if current mobile app expects manual nav, I might need to check.
            // Original LoginScreen.js: didn't navigate manually. It relied on state change?
            // Wait, original code:
            // const handleLogin = async () => { ... await signIn(email, password); ... }
            // It didn't navigate. So I assume an AuthStack listener handles it.
        } catch (error) {
            Alert.alert('Erro', error.message || 'Falha ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (error) {
            Alert.alert('Erro', error.message || 'Falha no login com Google');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: THEME.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.content}>

                    {/* Social Login Buttons - Top */}
                    <View style={styles.socialContainer}>
                        <TouchableOpacity
                            onPress={handleGoogleLogin}
                            style={[styles.googleButton, { borderColor: THEME.googleBorder, backgroundColor: 'white' }]}
                            activeOpacity={0.7}
                        >
                            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                                <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.04-3.71 1.04-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                                <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </Svg>
                            <Text style={[styles.googleButtonText, { color: THEME.textPrimary }]}>Google</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                        <View style={[styles.dividerLine, { backgroundColor: THEME.border }]} />
                        <Text style={[styles.dividerText, { color: THEME.textMuted }]}>OU</Text>
                        <View style={[styles.dividerLine, { backgroundColor: THEME.border }]} />
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
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

                        <View style={styles.optionsRow}>
                            <TouchableOpacity
                                style={styles.rememberRow}
                                onPress={() => setRememberMe(!rememberMe)}
                                activeOpacity={0.7}
                            >
                                <View style={[
                                    styles.checkbox,
                                    { borderColor: '#CBD5E1' }
                                ]}>
                                    {rememberMe && <Check size={12} color="#3B82F6" strokeWidth={3} />}
                                </View>
                                <Text style={[styles.rememberText, { color: THEME.textSecondary }]}>Manter-me conectado</Text>
                            </TouchableOpacity>

                            <TouchableOpacity activeOpacity={0.7}>
                                <Text style={[styles.forgotText, { color: THEME.primary }]}>Esqueci minha senha</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                            style={styles.shadowButtonWrapper}
                        >
                            <LinearGradient
                                colors={['#60A5FA', '#3B82F6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.button, loading && styles.buttonDisabled]}
                            >
                                <Text style={styles.buttonText}>
                                    {loading ? 'Entrando...' : 'Entrar'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => navigation.navigate('Register')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.footerText}>
                                Ainda não possui conta?{' '}
                                <Text style={[styles.linkTextBold, { color: THEME.primary }]}>Cadastre-se</Text>
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
    socialContainer: {
        marginBottom: 24,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        // Elevation for Android
        elevation: 1,
    },
    googleButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        fontSize: 12,
        textTransform: 'uppercase',
    },
    form: {
        gap: 24,
    },
    inputContainer: {
        gap: 8, // gap in React Native needs newer versions or explicit margins. Views support gap now.
    },
    label: {
        fontSize: 14,
        fontWeight: '500', // Matches desktop font-medium
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rememberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderWidth: 1,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    rememberText: {
        fontSize: 14,
    },
    forgotText: {
        fontSize: 14,
        fontWeight: '500',
    },
    shadowButtonWrapper: {
        // Wrapper if we need external shadow, but LinearGradient can't shadow easily without wrapper on Android
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

export default LoginScreen;
