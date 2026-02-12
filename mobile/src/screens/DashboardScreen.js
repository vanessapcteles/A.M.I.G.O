import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useThemeColors } from '../theme/colors';
import { LogOut, BookOpen, Users, User, MapPin, Calendar } from 'lucide-react-native';

const DashboardScreen = () => {
    const { user, logout } = useContext(AuthContext);
    const navigation = useNavigation();
    const colors = useThemeColors();

    const menuItems = [
        {
            title: 'Cursos',
            icon: BookOpen,
            color: colors.cardBlue,
            screen: 'Courses',
        },
        {
            title: 'Horário',
            icon: Calendar,
            color: colors.cardPink,
            screen: 'Schedule',
        },
        {
            title: 'Formandos',
            icon: Users,
            color: colors.cardPink,
            screen: 'Formandos',
        },
        {
            title: 'Equipa',
            icon: User,
            color: colors.cardPink,
            screen: 'Formadores',
        },
        {
            title: 'Salas',
            icon: MapPin,
            color: colors.cardBlue,
            screen: 'Rooms',
        },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                    <LogOut color={colors.cardPink} size={20} />
                    <Text style={[styles.logoutText, { color: colors.cardPink }]}>Sair</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.logoContainer}>
                    {/* Placeholder for Logo - Using Icon + Text as per design */}
                    <View style={styles.logoIcon}>
                        <BookOpen color={colors.cardBlue} size={40} />
                    </View>
                    <Text style={[styles.logoText, { color: colors.cardBlue }]}>A.M.I.G.O</Text>
                    <Text style={[styles.logoSubtext, { color: colors.cardPink }]}>Academy Management Interactive Guide & Organizer</Text>
                </View>

                <View style={styles.greetingContainer}>
                    <Text style={[styles.greetingTitle, { color: colors.cardBlue }]}>Olá, {user?.nome?.split(' ')[0] || 'Utilizador'}!</Text>
                    <Text style={[styles.greetingSubtitle, { color: colors.textLight }]}>O teu Dashboard</Text>
                </View>

                <View style={styles.grid}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.card, { backgroundColor: item.color }]}
                            onPress={() => navigation.navigate(item.screen)}
                            activeOpacity={0.9}
                        >
                            <item.icon color={colors.textInverted} size={32} style={styles.cardIcon} />
                            <Text style={styles.cardTitle}>{item.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        alignItems: 'flex-end',
        borderBottomWidth: 0, // Removed border for cleaner look, or keep if desired
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    logoutText: {
        // Color is now handled inline
        marginLeft: 8,
        fontWeight: 'bold',
        fontSize: 16,
    },
    content: {
        padding: 24,
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 16,
    },
    logoIcon: {
        marginBottom: 16,
    },
    logoText: {
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 4,
    },
    logoSubtext: {
        fontSize: 10,
        marginTop: 4,
        textAlign: 'center',
    },
    greetingContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    greetingTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    greetingSubtitle: {
        fontSize: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
    },
    card: {
        width: '47%',
        aspectRatio: 1.1, // make it slightly rectangular/square
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 5.0,
        elevation: 6,
    },
    cardIcon: {
        marginBottom: 12,
    },
    cardTitle: {
        // Color handled inline or passed
        color: '#FFFFFF', // Constant white for card titles
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default DashboardScreen;
