import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import { theme } from '../constants/theme';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // Assuming Expo provides this

export default function DashboardScreen() {
    const navigation = useNavigation();
    const { signOut } = React.useContext(AuthContext);
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const userData = await authService.getUser();
            setUser(userData);
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Sair",
            "Tem a certeza que deseja terminar sessão?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sair",
                    style: "destructive",
                    onPress: async () => {
                        await signOut();
                    }
                }
            ]
        );
    };

    const menuItems = [
        { id: 1, title: 'Cursos', icon: 'book', route: 'Cursos', color: '#10b981' },
        { id: 2, title: 'Formandos', icon: 'people', route: 'Formandos', color: '#3b82f6' },
        { id: 3, title: 'Formadores', icon: 'school', route: 'Formadores', color: '#f59e0b' },
        { id: 4, title: 'Salas', icon: 'business', route: 'Salas', color: '#ef4444' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Olá, {user?.nome?.split(' ')[0] || 'Visitante'}</Text>
                    <Text style={styles.role}>{user?.tipo_utilizador || ''}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Consultas Rápidas</Text>

                <View style={styles.grid}>
                    {menuItems.map(item => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.card}
                            onPress={() => navigation.navigate(item.route)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                                <Ionicons name={item.icon} size={32} color={item.color} />
                            </View>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardSubtitle}>Consultar lista</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* You can add Horario button here if needed later */}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    role: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 4,
        textTransform: 'uppercase',
    },
    logoutButton: {
        padding: 8,
        backgroundColor: `${theme.colors.error}20`,
        borderRadius: 8,
    },
    content: {
        padding: theme.spacing.l,
    },
    sectionTitle: {
        fontSize: 18,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.l,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '600',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.m,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.l,
        width: '47%', // roughly half - gap
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    iconContainer: {
        padding: theme.spacing.m,
        borderRadius: 50,
        marginBottom: theme.spacing.m,
    },
    cardTitle: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    cardSubtitle: {
        color: theme.colors.textSecondary,
        fontSize: 12,
    }
});
