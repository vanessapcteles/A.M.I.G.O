import React, { useContext, useState } from 'react';
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
import { LogIn, Lock, User, Eye, EyeOff, Shield, ChevronLeft } from 'lucide-react-native';
import Logo from '../../assets/logo_website.png';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [show2FA, setShow2FA] = useState(false);

    const { isLoading, login, verifyOTP } = useContext(AuthContext);
    const colors = useThemeColors();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setError('');
        if (!email || !password) {
            setError('Por favor preencha todos os campos.');
            return;
        }
        try {
            const result = await login(email, password);
            if (result && result.requires2FA) {
                setShow2FA(true);
            }
        } catch (e) {
            setError('Email ou password incorretos.');
        }
    };

    const handleVerify = async () => {
        setError('');
        if (!otp || otp.length < 6) {
            setError('O código deve ter 6 dígitos.');
            return;
        }
        try {
            await verifyOTP(email, otp);
        } catch (e) {
            setError('Código incorreto. Tente novamente.');
        }
    };

    const renderLoginForm = () => (
        <View style={styles.form}>
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

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
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
        </View>
    );

    const render2FAForm = () => (
        <View style={styles.form}>
            <View style={styles.shieldIconContainer}>
                <Shield size={64} color={colors.primary} />
            </View>
            <Text style={[styles.otpInstruction, { color: colors.textLight }]}>
                Introduza o código de 6 dígitos da sua aplicação autenticadora.
            </Text>

            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Lock color={colors.textLight} size={20} style={styles.icon} />
                <TextInput
                    style={[styles.input, { color: colors.text, letterSpacing: 5, fontSize: 20, textAlign: 'center' }]}
                    placeholder="000000"
                    placeholderTextColor={colors.textLight}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                />
            </View>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                onPress={handleVerify}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Verificar Código</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                    setShow2FA(false);
                    setOtp('');
                    setError('');
                }}
            >
                <ChevronLeft size={20} color={colors.textLight} />
                <Text style={[styles.backButtonText, { color: colors.textLight }]}>Voltar ao Login</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.header}>
                    <Image source={Logo} style={styles.logo} resizeMode="contain" />
                    <Text style={[styles.brand, { color: colors.primary }]}>A.M.I.G.O</Text>
                    <Text style={[styles.brandSubtitle, { color: colors.textLight }]}>
                        Academy Management Interactive Guide & Organizer
                    </Text>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {show2FA ? 'Verificação 2FA' : 'Bem-vindo'}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textLight }]}>
                        {show2FA ? 'Proteja a sua conta' : 'Inicie sessão para continuar'}
                    </Text>
                </View>

                {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

                {show2FA ? render2FAForm() : renderLoginForm()}

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
        alignItems: 'center', // Center align header for better OTP look
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 16,
    },
    brand: {
        fontSize: 48,
        fontWeight: '900',
        marginBottom: 4,
    },
    brandSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 32,
        textTransform: 'uppercase',
        letterSpacing: 1,
        maxWidth: '80%',
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
        fontWeight: '600',
    },
    shieldIconContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    otpInstruction: {
        textAlign: 'center',
        marginBottom: 24,
        fontSize: 14,
        lineHeight: 20,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        padding: 10,
    },
    backButtonText: {
        marginLeft: 8,
        fontSize: 14,
    }
});

export default LoginScreen;
