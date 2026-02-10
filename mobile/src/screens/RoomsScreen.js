import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { colors } from '../theme/colors';
import { API_URL } from '../config/api';
import { MapPin } from 'lucide-react-native';

const RoomsScreen = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            setErrorMsg(null);
            const response = await axios.get(`${API_URL}/rooms`);

            if (Array.isArray(response.data)) {
                setRooms(response.data);
            } else {
                console.warn('Resposta inesperada:', response.data);
                setRooms([]);
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: '#fee2e2' }]}>
                <MapPin color={colors.error} size={24} />
            </View>
            <View style={styles.info}>
                <Text style={styles.roomName}>{item.nome_sala}</Text>
                <Text style={styles.roomType}>{item.localizacao || 'Edifício Principal'}</Text>
            </View>
            <View style={styles.capacityBadge}>
                <Text style={styles.capacityText}>{item.capacidade} pax</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Salas</Text>
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : errorMsg ? (
                <View style={styles.center}>
                    <Text style={styles.errorText}>Erro: {errorMsg}</Text>
                    <Text style={styles.errorSub}>Verifique a conexão ao backend</Text>
                </View>
            ) : (
                <FlatList
                    data={rooms}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma sala encontrada.</Text>}
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
        borderRadius: 12,
        marginRight: 16,
    },
    info: {
        flex: 1,
    },
    roomName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    roomType: {
        fontSize: 14,
        color: colors.textLight,
        marginBottom: 4,
    },
    capacityBadge: {
        backgroundColor: colors.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    capacityText: {
        fontSize: 12,
        color: colors.textLight,
        fontWeight: '600',
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

export default RoomsScreen;
