import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { LogOut, BookOpen, Users, User, MapPin } from 'lucide-react-native';

const DashboardScreen = () => {
    const { user, logout } = useContext(AuthContext);
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.brand}>AMIGO</Text>
                    <Text style={styles.greeting}>Olá, {user?.tipo_utilizador === 'ADMIN' ? 'Admin' : ''}</Text>
                    <Text style={styles.username}>{user?.nome_completo || 'Utilizador'}</Text>
                    {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                    <LogOut color={colors.error} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Acesso Rápido</Text>

                <View style={styles.grid}>
                    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Courses')}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.iconBgPrimary }]}>
                            <BookOpen color={colors.primary} size={32} />
                        </View>
                        <Text style={styles.cardTitle}>Cursos</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Formandos')}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.iconBgSecondary }]}>
                            <Users color={colors.secondary} size={32} />
                        </View>
                        <Text style={styles.cardTitle}>Formandos</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Formadores')}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.iconBgWarning }]}>
                            <User color={colors.warning} size={32} />
                        </View>
                        <Text style={styles.cardTitle}>Formadores</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Rooms')}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.iconBgError }]}>
                            <MapPin color={colors.error} size={32} />
                        </View>
                        <Text style={styles.cardTitle}>Salas</Text>
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
    brand: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.primary,
        letterSpacing: 2,
        marginBottom: 8,
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
    userEmail: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '500',
        marginTop: 2,
    },
    logoutButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: colors.iconBgError,
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
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    card: {
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        width: '48%', // 2 per row
        marginBottom: 16,
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
