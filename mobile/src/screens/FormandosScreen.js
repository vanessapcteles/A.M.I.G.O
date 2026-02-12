import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useThemeColors } from '../theme/colors';
import { API_URL } from '../config/api';
import { Users } from 'lucide-react-native';

const FormandosScreen = () => {
    const [formandos, setFormandos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const colors = useThemeColors();

    useEffect(() => {
        fetchFormandos();
    }, []);

    const fetchFormandos = async () => {
        try {
            setErrorMsg(null);
            const response = await axios.get(`${API_URL}/formandos`);

            if (Array.isArray(response.data)) {
                setFormandos(response.data);
            } else {
                console.warn('Resposta inesperada:', response.data);
                setFormandos([]);
            }
        } catch (error) {
            console.error('Error fetching formandos:', error);
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.iconBgSecondary }]}>
                <Users color={colors.secondary} size={24} />
            </View>
            <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]}>{item.nome_completo}</Text>
                <Text style={[styles.email, { color: colors.textLight }]}>{item.email}</Text>
                {item.curso_atual && (
                    <Text style={[styles.details, { color: colors.textLight }]}>Curso: {item.curso_atual}</Text>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text, backgroundColor: colors.surface }]}>Formandos</Text>
            {loading ? (
                <ActivityIndicator size="large" color={colors.secondary} style={styles.loader} />
            ) : errorMsg ? (
                <View style={styles.center}>
                    <Text style={[styles.errorText, { color: colors.error }]}>Erro: {errorMsg}</Text>
                    <Text style={[styles.errorSub, { color: colors.textLight }]}>Verifique a conexão ao backend</Text>
                </View>
            ) : (
                <FlatList
                    data={formandos}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textLight }]}>Nenhum formando encontrado.</Text>}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        padding: 20,
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
    name: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        marginBottom: 2,
    },
    details: {
        fontSize: 12,
        marginTop: 2,
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

export default FormandosScreen;
