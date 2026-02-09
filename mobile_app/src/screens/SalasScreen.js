import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dataService } from '../services/dataService';
import { theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function SalasScreen() {
    const [rooms, setRooms] = useState([]);
    const [occupiedRooms, setOccupiedRooms] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [roomsData, scheduleData] = await Promise.all([
                dataService.getSalas(),
                fetchCurrentStatus()
            ]);

            setRooms(roomsData);
            setOccupiedRooms(new Set(scheduleData.map(s => s.nome_sala))); // Assuming schedule returns room name or ID
            // Ideally we need room ID. The endpoint returns "nome_sala".
            // Let's rely on name matching or update endpoint to return ID.
            // For now, assume unique names.
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchCurrentStatus = async () => {
        const now = new Date();
        const start = now.toISOString();
        const end = new Date(now.getTime() + 60000).toISOString(); // +1 min window

        // This relies on getGlobalSchedule filtering correctly
        const events = await dataService.getGlobalSchedule({ start, end });
        return events;
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const filteredData = rooms.filter(item =>
        (item.nome_sala || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.tipo || '').toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = ({ item }) => {
        const isOccupied = occupiedRooms.has(item.nome_sala);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.title}>{item.nome_sala}</Text>
                    <View style={[styles.badge, { backgroundColor: isOccupied ? theme.colors.error : theme.colors.success }]}>
                        <Text style={styles.badgeText}>{isOccupied ? 'OCUPADA' : 'LIVRE'}</Text>
                    </View>
                </View>
                <View style={styles.details}>
                    <Text style={styles.subtitle}>Capacidade: {item.capacidade}</Text>
                    <Text style={styles.subtitle}>Tipo: {item.tipo}</Text>
                </View>
                <Text style={styles.info}>{item.localizacao || 'Sem localização'}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Pesquisar salas..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={item => (item.id || Math.random()).toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma sala encontrada.</Text>}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        margin: theme.spacing.m,
        paddingHorizontal: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    searchIcon: {
        marginRight: theme.spacing.s,
    },
    searchInput: {
        flex: 1,
        color: theme.colors.text,
        paddingVertical: theme.spacing.m,
    },
    list: {
        paddingHorizontal: theme.spacing.m,
        paddingBottom: theme.spacing.xl,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.m,
        padding: theme.spacing.m,
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.s,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    details: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    info: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        marginTop: 20,
    }
});
