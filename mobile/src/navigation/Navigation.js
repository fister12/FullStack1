/**
 * Navigation Configuration
 * Handles auth-based navigation flow
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import DashboardScreen from '../screens/DashboardScreen';
import VideoPlayerScreen from '../screens/VideoPlayerScreen';

const Stack = createNativeStackNavigator();

// Auth Stack - For unauthenticated users
function AuthStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
    );
}

// Main Stack - For authenticated users
function MainStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen
                name="VideoPlayer"
                component={VideoPlayerScreen}
            />
        </Stack.Navigator>
    );
}

// Loading Screen
function LoadingScreen() {
    return (
        <View style={styles.loading}>
            <ActivityIndicator size="large" color="#6366f1" />
        </View>
    );
}

// Main Navigation Component
export default function Navigation() {
    const { isLoading, isAuthenticated } = useAuth();

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? <MainStack /> : <AuthStack />}
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        backgroundColor: '#0f0f23',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
