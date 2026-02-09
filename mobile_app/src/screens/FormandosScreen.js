import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dataService } from '../services/dataService';
import { theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function FormandosScreen() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const result = await dataService.getFormandos();
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data.filter(item =>
        (item.nome_completo || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.email || '').toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.title}>{item.nome_completo}</Text>
            </View>
            <Text style={styles.subtitle}>{item.email}</Text>
            <Text style={styles.info}>{item.telemovel || 'Sem contacto'}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Pesquisar formandos..."
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
                    ListEmptyComponent={<Text style={styles.emptyText}>Nenhum formando encontrado.</Text>}
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
        marginBottom: theme.spacing.xs,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    info: {
        fontSize: 12,
        color: theme.colors.primary,
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        marginTop: 20,
    }
});
