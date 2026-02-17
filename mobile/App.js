import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { AuthProvider, AuthContext } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CoursesScreen from './src/screens/CoursesScreen';
import CourseDetailsScreen from './src/screens/CourseDetailsScreen';
import GradesScreen from './src/screens/GradesScreen';
import FormandosScreen from './src/screens/FormandosScreen';
import FormadoresScreen from './src/screens/FormadoresScreen';
import MyClassesScreen from './src/screens/MyClassesScreen';
import RoomsScreen from './src/screens/RoomsScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import { colors } from './src/theme/colors';

import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

const Stack = createNativeStackNavigator();

const AppNav = () => {
  const { isLoading, user, splashLoading } = useContext(AuthContext);

  if (splashLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Courses" component={CoursesScreen} />
            <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} />
            <Stack.Screen name="Grades" component={GradesScreen} />
            <Stack.Screen name="Formandos" component={FormandosScreen} />
            <Stack.Screen name="Formadores" component={FormadoresScreen} />
            <Stack.Screen name="MyClasses" component={MyClassesScreen} />
            <Stack.Screen name="Rooms" component={RoomsScreen} />
            <Stack.Screen name="Schedule" component={ScheduleScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNav />
    </AuthProvider>
  );
}
