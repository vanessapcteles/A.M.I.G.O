import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dataService } from '../services/dataService';
import { theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';

export default function FormadoresScreen() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const result = await dataService.getFormadores();
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data.filter(item =>
        (item.nome_completo || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.area || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleCall = (phone) => {
        if (phone) Linking.openURL(`tel:${phone}`);
    };

    const handleEmail = (email) => {
        if (email) Linking.openURL(`mailto:${email}`);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.title}>{item.nome_completo}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.area || 'Geral'}</Text>
                </View>
            </View>

            <TouchableOpacity onPress={() => handleEmail(item.email)}>
                <Text style={styles.linkText}>{item.email}</Text>
            </TouchableOpacity>

            {item.telemovel && (
                <TouchableOpacity onPress={() => handleCall(item.telemovel)} style={{ marginTop: 4 }}>
                    <Text style={styles.info}>{item.telemovel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Pesquisar formadores..."
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
                    ListEmptyComponent={<Text style={styles.emptyText}>Nenhum formador encontrado.</Text>}
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
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
        flex: 1,
    },
    badge: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.primary,
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        color: theme.colors.primary,
        fontSize: 10,
        fontWeight: 'bold',
    },
    linkText: {
        fontSize: 14,
        color: theme.colors.secondary,
        textDecorationLine: 'underline',
        marginBottom: 4,
    },
    info: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        marginTop: 20,
    }
});
