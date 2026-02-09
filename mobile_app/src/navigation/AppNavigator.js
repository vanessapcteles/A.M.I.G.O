import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { theme } from '../constants/theme';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CursosScreen from '../screens/CursosScreen';
import FormandosScreen from '../screens/FormandosScreen';
import FormadoresScreen from '../screens/FormadoresScreen';
import SalasScreen from '../screens/SalasScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
    const { userToken, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: theme.colors.surface,
                        elevation: 0,
                        shadowOpacity: 0,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                    },
                    headerTintColor: theme.colors.text,
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                    cardStyle: { backgroundColor: theme.colors.background }
                }}
            >
                {/* 
                  Conditional rendering based on auth state.
                  This pattern automatically handles redirects:
                  - If token exists -> Dashboard is shown
                  - If token is removed (logout) -> Login is shown
                */}
                {userToken ? (
                    <>
                        <Stack.Screen
                            name="Dashboard"
                            component={DashboardScreen}
                            options={{
                                title: 'Início',
                                headerLeft: null
                            }}
                        />
                        <Stack.Screen name="Cursos" component={CursosScreen} />
                        <Stack.Screen name="Formandos" component={FormandosScreen} />
                        <Stack.Screen name="Formadores" component={FormadoresScreen} />
                        <Stack.Screen name="Salas" component={SalasScreen} />
                    </>
                ) : (
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
