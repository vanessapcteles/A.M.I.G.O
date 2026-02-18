import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useThemeColors } from '../theme/colors';
import { API_URL } from '../config/api';
import BackButton from '../components/BackButton';
import { School, User, Calendar, BookOpen } from 'lucide-react-native';

const MyClassesScreen = () => {
    const { user } = useContext(AuthContext);
    const [turmas, setTurmas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const colors = useThemeColors();

    useEffect(() => {
        fetchTurmas();
    }, []);

    const fetchTurmas = async () => {
        try {
            setLoading(true);
            // The backend /api/turmas endpoint automatically filters for FORMADOR role
            const response = await axios.get(`${API_URL}/turmas`);

            if (response.data && response.data.data) {
                setTurmas(response.data.data);
            } else if (Array.isArray(response.data)) {
                setTurmas(response.data);
            } else {
                setTurmas([]);
            }

        } catch (error) {
            console.error('Error fetching turmas:', error);
            setErrorMsg('Erro ao carregar turmas.');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={[styles.card, { backgroundColor: colors.surface, borderLeftColor: item.estado === 'a decorrer' ? colors.success : colors.textLight }]}>
            <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                    <School size={20} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.turmaCode, { color: colors.text }]}>{item.codigo_turma}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.estado === 'a decorrer' ? '#e6f4ea' : '#fce8e6' }]}>
                    <Text style={[styles.statusText, { color: item.estado === 'a decorrer' ? colors.success : colors.textLight }]}>
                        {item.estado}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <BookOpen size={16} color={colors.textLight} />
                    <Text style={[styles.infoText, { color: colors.textLight }]}>{item.nome_curso}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Calendar size={16} color={colors.textLight} />
                    <Text style={[styles.infoText, { color: colors.textLight }]}>
                        {new Date(item.data_inicio).toLocaleDateString()} - {new Date(item.data_fim).toLocaleDateString()}
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <BackButton />
                <Text style={[styles.title, { color: colors.text }]}>Minhas Turmas</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : errorMsg ? (
                <View style={styles.center}>
                    <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
                </View>
            ) : (
                <FlatList
                    data={turmas}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={[styles.emptyText, { color: colors.textLight }]}>
                                Não está associado a nenhuma turma.
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    loader: {
        marginTop: 50,
    },
    list: {
        padding: 20,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    turmaCode: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    cardBody: {
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 14,
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 50,
    }
});

export default MyClassesScreen;
