import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useThemeColors } from '../theme/colors';
import { API_URL } from '../config/api';
import BackButton from '../components/BackButton';
import { GraduationCap, Award, Calendar } from 'lucide-react-native';

const GradesScreen = () => {
    const { user } = useContext(AuthContext);
    const [gradesData, setGradesData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const colors = useThemeColors();

    useEffect(() => {
        fetchGrades();
    }, []);

    const fetchGrades = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/formandos/${user.id}/grades`);
            setGradesData(response.data);
        } catch (error) {
            console.error('Error fetching grades:', error);
            setErrorMsg('Erro ao carregar notas.');
        } finally {
            setLoading(false);
        }
    };

    const renderGradeItem = ({ item }) => {
        const hasGrade = item.nota !== null && item.nota !== undefined;
        let gradeColor = colors.text;
        if (hasGrade) {
            if (item.nota >= 10) gradeColor = colors.success;
            else gradeColor = colors.error;
        }

        return (
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.moduleName, { color: colors.text }]}>{item.nome_modulo}</Text>
                    {hasGrade && (
                        <View style={[styles.gradeBadge, { backgroundColor: item.nota >= 10 ? '#e6f4ea' : '#fce8e6' }]}>
                            <Text style={[styles.gradeText, { color: gradeColor }]}>{item.nota}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.metaRow}>
                        <Award size={14} color={colors.textLight} />
                        <Text style={[styles.metaText, { color: colors.textLight }]}>{item.carga_horaria}h</Text>
                    </View>
                    {item.data_avaliacao && (
                        <View style={styles.metaRow}>
                            <Calendar size={14} color={colors.textLight} />
                            <Text style={[styles.metaText, { color: colors.textLight }]}>
                                {new Date(item.data_avaliacao).toLocaleDateString()}
                            </Text>
                        </View>
                    )}
                </View>
                {!hasGrade && (
                    <Text style={[styles.pendingText, { color: colors.textLight }]}>Sem avaliação</Text>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <BackButton />
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerSubtitle, { color: colors.textLight }]}>A Minha Caderneta</Text>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                        {gradesData?.curso || 'Notas e Avaliações'}
                    </Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : errorMsg ? (
                <View style={styles.center}>
                    <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
                </View>
            ) : (
                <FlatList
                    data={gradesData?.grades || []}
                    renderItem={renderGradeItem}
                    keyExtractor={item => item.modulo_id.toString()}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={
                        gradesData?.turma ? (
                            <View style={[styles.turmaBadge, { backgroundColor: colors.primary + '20' }]}>
                                <Text style={[styles.turmaText, { color: colors.primary }]}>Turma: {gradesData.turma}</Text>
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={[styles.emptyText, { color: colors.textLight }]}>
                                Nenhuma nota registada.
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
        paddingBottom: 10,
    },
    headerTitleContainer: {
        marginLeft: 10,
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 12,
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 2,
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
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    moduleName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 10,
    },
    gradeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        minWidth: 40,
        alignItems: 'center',
    },
    gradeText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: 16,
        marginTop: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 13,
    },
    pendingText: {
        fontSize: 12,
        marginTop: 8,
        fontStyle: 'italic',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
    turmaBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 16,
    },
    turmaText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default GradesScreen;
