import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { colors } from '../theme/colors';
import { API_URL } from '../config/api';
import { BookOpen } from 'lucide-react-native';

const CoursesScreen = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setErrorMsg(null);
            // Ensure we access the 'courses' property from the response object
            // backend returns { courses: [...], total: ..., pages: ... }
            const response = await axios.get(`${API_URL}/courses`);

            if (response.data && response.data.courses) {
                setCourses(response.data.courses);
            } else if (Array.isArray(response.data)) {
                setCourses(response.data);
            } else {
                setCourses([]);
            }

        } catch (error) {
            console.error('Error fetching courses:', error);
            setErrorMsg(error.message || 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.iconContainer}>
                <BookOpen color={colors.primary} size={24} />
            </View>
            <View style={styles.info}>
                <Text style={styles.courseName}>{item.nome_curso}</Text>
                <Text style={styles.courseArea}>{item.area}</Text>
                <Text style={[styles.status, { color: item.estado === 'a decorrer' ? colors.success : colors.textLight }]}>
                    {item.estado}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Cursos</Text>
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : errorMsg ? (
                <View style={styles.center}>
                    <Text style={styles.errorText}>Erro: {errorMsg}</Text>
                    <Text style={styles.errorSub}>Verifique a conexão em {API_URL}</Text>
                    <Text style={styles.errorSub}>Se estiver num telemóvel físico, verifique o IP.</Text>
                </View>
            ) : (
                <FlatList
                    data={courses}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>Nenhum curso encontrado.</Text>}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        padding: 20,
        backgroundColor: colors.surface,
    },
    loader: {
        marginTop: 50,
    },
    list: {
        padding: 20,
    },
    card: {
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        padding: 12,
        backgroundColor: colors.iconBgPrimary,
        borderRadius: 12,
        marginRight: 16,
    },
    info: {
        flex: 1,
    },
    courseName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    courseArea: {
        fontSize: 14,
        color: colors.textLight,
        marginBottom: 4,
    },
    status: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: colors.error,
        fontSize: 16,
        marginBottom: 8,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    errorSub: {
        color: colors.textLight,
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textLight,
        marginTop: 50,
    },
});

export default CoursesScreen;
