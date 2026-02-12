import React, { useContext, useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { useThemeColors } from '../theme/colors';
import { LogIn, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

// Hardcoded for Expo Go development to match .env
// In production, these should be in app.json or ENV variables
const GOOGLE_CLIENT_ID = '949180899462-lh3kdvlpvfbo3ar0bu8coemggppg6f0b.apps.googleusercontent.com';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { isLoading, login, googleLogin } = useContext(AuthContext); // Ensure googleLogin is available
    const colors = useThemeColors();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        // For Expo Go on Android/iOS, redirectUri is usually handled automatically,
        // but explicit definition helps clarity.
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleGoogleSignIn(id_token);
        } else if (response?.type === 'error') {
            setError('Erro no login com Google.');
        }
    }, [response]);

    const handleGoogleSignIn = async (idToken) => {
        setError('');
        try {
            await googleLogin(idToken);
        } catch (e) {
            setError('Falha ao autenticar com Google. Tente novamente.');
        }
    };

    const handleLogin = async () => {
        setError('');
        if (!email || !password) {
            setError('Por favor preencha todos os campos.');
            return;
        }
        try {
            await login(email, password);
        } catch (e) {
            setError('Email ou password incorretos.');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.header}>
                    <Text style={[styles.brand, { color: colors.primary }]}>A.M.I.G.O</Text>
                    <Text style={[styles.title, { color: colors.text }]}>Bem-vindo</Text>
                    <Text style={[styles.subtitle, { color: colors.textLight }]}>Inicie sessão para continuar</Text>
                </View>

                <View style={styles.form}>
                    {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

                    <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <User color={colors.textLight} size={20} style={styles.icon} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Email"
                            placeholderTextColor={colors.textLight}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Lock color={colors.textLight} size={20} style={styles.icon} />
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Password"
                            placeholderTextColor={colors.textLight}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            {showPassword ? (
                                <EyeOff color={colors.textLight} size={20} />
                            ) : (
                                <Eye color={colors.textLight} size={20} />
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => {/* Forgot Password logic later */ }}>
                        <Text style={[styles.forgotPassword, { color: colors.primary }]}>Esqueceu-se da password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Entrar</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <Text style={[styles.dividerText, { color: colors.textLight }]}>OU</Text>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    </View>

                    <TouchableOpacity
                        style={[styles.googleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        disabled={!request || isLoading}
                        onPress={() => promptAsync()}
                    >
                        {/* Placeholder for Google Icon - In a real app use an SVG or Image asset */}
                        <Text style={[styles.googleButtonText, { color: colors.text }]}>
                            G  Entrar com Google
                        </Text>
                    </TouchableOpacity>

                </View>
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
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    header: {
        marginBottom: 40,
    },
    brand: {
        fontSize: 48,
        fontWeight: '900',
        marginBottom: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 16,
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    button: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    forgotPassword: {
        textAlign: 'right',
        marginTop: -8,
        marginBottom: 24,
    },
    errorText: {
        marginBottom: 16,
        textAlign: 'center',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    divider: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
    },
    googleButton: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        flexDirection: 'row',
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default LoginScreen;
