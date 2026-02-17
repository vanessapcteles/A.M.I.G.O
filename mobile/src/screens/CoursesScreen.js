import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useThemeColors } from '../theme/colors';
import { API_URL } from '../config/api';
import { BookOpen } from 'lucide-react-native';
import BackButton from '../components/BackButton';

const CoursesScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const colors = useThemeColors();

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setErrorMsg(null);

            if (user.tipo_utilizador === 'FORMANDO') {
                // Fetch student profile to get enrolled course
                const response = await axios.get(`${API_URL}/formandos/${user.id}/profile`);
                if (response.data && response.data.id_curso) {
                    setCourses([{
                        id: response.data.id_curso,
                        nome_curso: response.data.curso_atual,
                        area: 'O teu curso',
                        estado: 'a decorrer' // Assuming active if enrolled
                    }]);
                } else {
                    setCourses([]);
                }
            } else {
                // Admin/Staff sees all courses
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
            }

        } catch (error) {
            console.error('Error fetching courses:', error);
            setErrorMsg(error.message || 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('CourseDetails', {
                courseId: item.id,
                courseName: item.nome_curso
            })}
        >
            <View style={[styles.iconContainer, { backgroundColor: colors.iconBgPrimary }]}>
                <BookOpen color={colors.primary} size={24} />
            </View>
            <View style={styles.info}>
                <Text style={[styles.courseName, { color: colors.text }]}>{item.nome_curso}</Text>
                <Text style={[styles.courseArea, { color: colors.textLight }]}>{item.area}</Text>
                <Text style={[styles.status, { color: item.estado === 'a decorrer' ? colors.success : colors.textLight }]}>
                    {item.estado}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <BackButton />
                <Text style={[styles.title, { color: colors.text }]}>Cursos</Text>
            </View>
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : errorMsg ? (
                <View style={styles.center}>
                    <Text style={[styles.errorText, { color: colors.error }]}>Erro: {errorMsg}</Text>
                    <Text style={[styles.errorSub, { color: colors.textLight }]}>Verifique a conexão em {API_URL}</Text>
                    <Text style={[styles.errorSub, { color: colors.textLight }]}>Se estiver num telemóvel físico, verifique o IP.</Text>
                </View>
            ) : (
                <FlatList
                    data={courses}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textLight }]}>Nenhum curso encontrado.</Text>}
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
        borderRadius: 12,
        marginRight: 16,
    },
    info: {
        flex: 1,
    },
    courseName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    courseArea: {
        fontSize: 14,
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
        fontSize: 16,
        marginBottom: 8,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    errorSub: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
    },
});

export default CoursesScreen;
