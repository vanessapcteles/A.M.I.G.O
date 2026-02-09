import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import { theme } from '../constants/theme';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn } = React.useContext(AuthContext);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Erro', 'Por favor preencha todos os campos');
            return;
        }

        setLoading(true);
        try {
            await signIn(email, password);
        } catch (error) {
            Alert.alert('Erro de Login', error.message || 'Credenciais inválidas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Academy Manager</Text>
                    <Text style={styles.subtitle}>ATEC</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="seu.email@atec.pt"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="********"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Entrar</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
        padding: theme.spacing.l,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl * 2,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: theme.spacing.s,
    },
    subtitle: {
        fontSize: 18,
        color: theme.colors.textSecondary,
        letterSpacing: 2,
    },
    form: {
        width: '100%',
    },
    label: {
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.s,
        marginLeft: theme.spacing.xs,
        fontSize: 14,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.m,
        padding: theme.spacing.m,
        color: theme.colors.text,
        marginBottom: theme.spacing.l,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    button: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        alignItems: 'center',
        marginTop: theme.spacing.m,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
