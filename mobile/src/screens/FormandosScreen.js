import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { colors } from '../theme/colors';
import { API_URL } from '../config/api';
import { Users } from 'lucide-react-native';

const FormandosScreen = () => {
    const [formandos, setFormandos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

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
        <View style={styles.card}>
            <View style={styles.iconContainer}>
                <Users color={colors.secondary} size={24} />
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{item.nome_completo}</Text>
                <Text style={styles.email}>{item.email}</Text>
                {item.curso_atual && (
                    <Text style={styles.details}>Curso: {item.curso_atual}</Text>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Formandos</Text>
            {loading ? (
                <ActivityIndicator size="large" color={colors.secondary} style={styles.loader} />
            ) : errorMsg ? (
                <View style={styles.center}>
                    <Text style={styles.errorText}>Erro: {errorMsg}</Text>
                    <Text style={styles.errorSub}>Verifique a conexão ao backend</Text>
                </View>
            ) : (
                <FlatList
                    data={formandos}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>Nenhum formando encontrado.</Text>}
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
        backgroundColor: colors.iconBgSecondary,
        borderRadius: 12,
        marginRight: 16,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: colors.textLight,
        marginBottom: 2,
    },
    details: {
        fontSize: 12,
        color: colors.textLight,
        marginTop: 2,
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

export default FormandosScreen;
