import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { LogOut, Calendar, GraduationCap, XCircle } from 'lucide-react-native';

const DashboardScreen = () => {
    const { user, logout } = useContext(AuthContext);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Olá,</Text>
                    <Text style={styles.username}>{user?.nome_completo || 'Utilizador'}</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                    <LogOut color={colors.error} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Acesso Rápido</Text>

                <View style={styles.grid}>
                    <TouchableOpacity style={styles.card}>
                        <View style={[styles.iconContainer, { backgroundColor: '#e0e7ff' }]}>
                            <Calendar color={colors.primary} size={32} />
                        </View>
                        <Text style={styles.cardTitle}>Horário</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card}>
                        <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
                            <GraduationCap color={colors.secondary} size={32} />
                        </View>
                        <Text style={styles.cardTitle}>Notas</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card}>
                        <View style={[styles.iconContainer, { backgroundColor: '#fee2e2' }]}>
                            <XCircle color={colors.error} size={32} />
                        </View>
                        <Text style={styles.cardTitle}>Faltas</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.recentActivity}>
                    <Text style={styles.sectionTitle}>Atividade Recente</Text>
                    <View style={styles.activityCard}>
                        <Text style={styles.activityText}>Nenhuma atividade recente encontrada.</Text>
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
    header: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    greeting: {
        fontSize: 16,
        color: colors.textLight,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    logoutButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#fff0f0',
    },
    content: {
        padding: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    card: {
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        width: '30%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
    },
    recentActivity: {
        marginTop: 16,
    },
    activityCard: {
        backgroundColor: colors.surface,
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    activityText: {
        color: colors.textLight,
    },
});

export default DashboardScreen;
