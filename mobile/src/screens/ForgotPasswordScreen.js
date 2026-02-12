import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';
import { Mail, ChevronLeft, Send } from 'lucide-react-native';

const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { isLoading, forgotPassword } = useContext(AuthContext);
    const colors = useThemeColors();
    const [error, setError] = useState('');

    const handleResetPassword = async () => {
        setError('');
        if (!email) {
            setError('Por favor introduza o seu email.');
            return;
        }

        try {
            await forgotPassword(email);
            setIsSubmitted(true);
        } catch (e) {
            setError('Ocorreu um erro. Tente novamente.');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft color={colors.text} size={28} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>Recuperar Password</Text>
                    <Text style={[styles.subtitle, { color: colors.textLight }]}>
                        {isSubmitted
                            ? 'Verifique o seu email para instruções de recuperação.'
                            : 'Introduza o seu email para receber um link de recuperação.'}
                    </Text>
                </View>

                <View style={styles.form}>
                    {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

                    {!isSubmitted ? (
                        <>
                            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Mail color={colors.textLight} size={20} style={styles.icon} />
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

                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                                onPress={handleResetPassword}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <View style={styles.buttonContent}>
                                        <Text style={styles.buttonText}>Enviar Email</Text>
                                        <Send color="#fff" size={20} style={styles.buttonIcon} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: colors.success, shadowColor: colors.success }]}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.buttonText}>Voltar ao Login</Text>
                        </TouchableOpacity>
                    )}
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
    backButton: {
        marginBottom: 16,
        marginLeft: -4,
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
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    buttonIcon: {
        marginLeft: 8,
    },
    errorText: {
        marginBottom: 16,
        textAlign: 'center',
        fontWeight: '600',
    },
});

export default ForgotPasswordScreen;
