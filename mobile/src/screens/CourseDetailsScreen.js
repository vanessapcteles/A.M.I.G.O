import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useThemeColors } from '../theme/colors';
import { API_URL } from '../config/api';
import BackButton from '../components/BackButton';
import { BookOpen, Clock } from 'lucide-react-native';

const CourseDetailsScreen = ({ route }) => {
    const { courseId, courseName } = route.params;
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const colors = useThemeColors();

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            setLoading(true);
            setErrorMsg(null);
            const response = await axios.get(`${API_URL}/courses/${courseId}/modules`);
            setModules(response.data);
        } catch (error) {
            console.error('Error fetching modules:', error);
            setErrorMsg('Erro ao carregar módulos.');
        } finally {
            setLoading(false);
        }
    };

    const renderModuleItem = ({ item }) => (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.sequenceContainer, { backgroundColor: colors.background }]}>
                <Text style={[styles.sequenceText, { color: colors.primary }]}>{item.sequencia}</Text>
            </View>
            <View style={styles.info}>
                <Text style={[styles.moduleName, { color: colors.text }]}>{item.nome_modulo}</Text>
                <View style={styles.metaContainer}>
                    <Clock size={14} color={colors.textLight} />
                    <Text style={[styles.metaText, { color: colors.textLight }]}>{item.carga_horaria}h</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <BackButton />
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerSubtitle, { color: colors.textLight }]}>Módulos do Curso</Text>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{courseName}</Text>
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
                    data={modules}
                    renderItem={renderModuleItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={[styles.emptyText, { color: colors.textLight }]}>
                                Nenhum módulo encontrado para este curso.
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
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sequenceContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    sequenceText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    info: {
        flex: 1,
    },
    moduleName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 14,
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
});

export default CourseDetailsScreen;
