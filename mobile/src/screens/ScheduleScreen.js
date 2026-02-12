import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../theme/colors';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config/api';
import { Calendar as CalendarIcon, Clock, MapPin, User, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react-native';

const ScheduleScreen = ({ navigation }) => {
    const colors = useThemeColors();
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [schedule, setSchedule] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // State for navigation
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));

    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    const fetchSchedule = useCallback(async () => {
        try {
            let endpoint = '';

            if (user.tipo_utilizador === 'FORMADOR') {
                endpoint = `${API_URL}/schedules/formador/${user.id}`;
            } else {
                endpoint = `${API_URL}/schedules/all`;
            }

            const response = await axios.get(endpoint);
            setSchedule(response.data);

        } catch (error) {
            console.error('Erro ao buscar horário:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchSchedule();
    };

    // Helper functions for dates
    const addDays = (date, days) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    const isSameDay = (d1, d2) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    }

    const handleWeekChange = (direction) => {
        const newStart = addDays(currentWeekStart, direction * 7);
        setCurrentWeekStart(newStart);
        // Also move selection to Monday of that week
        setSelectedDate(newStart);
    }

    // Generate days for current week strip
    const weekDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(addDays(currentWeekStart, i));
        }
        return days;
    }, [currentWeekStart]);

    // Filter events for selected date
    const dailyEvents = useMemo(() => {
        if (!schedule) return [];
        return schedule.filter(item => {
            const itemDate = new Date(item.inicio);
            return isSameDay(itemDate, selectedDate);
        }).sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
    }, [schedule, selectedDate]);

    // Format helpers
    const getWeekRangeString = () => {
        const endOfWeek = addDays(currentWeekStart, 6);
        const options = { month: 'long', day: 'numeric' };
        return `${currentWeekStart.toLocaleDateString('pt-PT', options)} - ${endOfWeek.toLocaleDateString('pt-PT', options)}`;
    }

    const renderHeader = () => (
        <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
            <View style={styles.weekControl}>
                <TouchableOpacity onPress={() => handleWeekChange(-1)} style={[styles.navButton, { backgroundColor: colors.surface }]}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.weekTitle, { color: colors.text }]}>
                    {getWeekRangeString()}
                </Text>
                <TouchableOpacity onPress={() => handleWeekChange(1)} style={[styles.navButton, { backgroundColor: colors.surface }]}>
                    <ChevronRight size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.daysStrip}>
                {weekDays.map((date, index) => {
                    const isSelected = isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, new Date());

                    // Check if day has dots (events)
                    const hasEvents = schedule.some(item => isSameDay(new Date(item.inicio), date));

                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => setSelectedDate(date)}
                            style={[
                                styles.dayItem,
                                {
                                    backgroundColor: isSelected ? colors.primary : 'transparent',
                                    borderColor: isToday && !isSelected ? colors.primary : 'transparent',
                                    borderWidth: isToday && !isSelected ? 1 : 0
                                }
                            ]}
                        >
                            <Text style={[
                                styles.dayName,
                                { color: isSelected ? '#fff' : colors.textLight }
                            ]}>
                                {date.toLocaleDateString('pt-PT', { weekday: 'short' }).slice(0, 3)}
                            </Text>
                            <Text style={[
                                styles.dayNumber,
                                { color: isSelected ? '#fff' : colors.text }
                            ]}>
                                {date.getDate()}
                            </Text>
                            {hasEvents && !isSelected && (
                                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    const renderItem = ({ item }) => {
        const isFormador = user.tipo_utilizador === 'FORMADOR';

        // Format time "HH:mm"
        const startTime = new Date(item.inicio).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
        const endTime = new Date(item.fim).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

        return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
                <View style={styles.timeColumn}>
                    <Text style={[styles.startTime, { color: colors.text }]}>{startTime}</Text>
                    <Text style={[styles.endTime, { color: colors.textLight }]}>{endTime}</Text>
                </View>

                <View style={styles.cardContent}>
                    <Text style={[styles.moduleTitle, { color: colors.primary }]}>
                        {item.nome_modulo}
                    </Text>

                    <View style={styles.row}>
                        <MapPin size={14} color={colors.textLight} />
                        <Text style={[styles.infoText, { color: colors.textLight }]}>
                            {item.nome_sala}
                        </Text>
                    </View>

                    {!isFormador && (
                        <View style={styles.row}>
                            <User size={14} color={colors.textLight} />
                            <Text style={[styles.infoText, { color: colors.textLight }]}>
                                {item.nome_formador}
                            </Text>
                        </View>
                    )}

                    {isFormador && item.codigo_turma && (
                        <View style={styles.row}>
                            <User size={14} color={colors.textLight} />
                            <Text style={[styles.infoText, { color: colors.textLight }]}>
                                Turma: {item.codigo_turma}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {renderHeader()}

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={dailyEvents}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.textLight }]}>
                                Sem aulas para este dia.
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
    headerContainer: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    weekControl: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    navButton: {
        padding: 8,
        borderRadius: 8,
    },
    weekTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    daysStrip: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
    },
    dayItem: {
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 12,
        minWidth: 45,
    },
    dayName: {
        fontSize: 12,
        marginBottom: 4,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    dayNumber: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 4,
    },
    list: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        borderRadius: 12,
        marginBottom: 16,
        padding: 16,
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    timeColumn: {
        marginRight: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 50,
    },
    startTime: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    endTime: {
        fontSize: 12,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
    },
    moduleTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        marginLeft: 6,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        marginTop: 50,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
    }
});

export default ScheduleScreen;
