import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import MainNavigator from './src/navigation/MainNavigator';
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import QuestionnaireScreen from './src/screens/QuestionnaireScreen';

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <AuthProvider>
            <NavigationContainer>
                <StatusBar style="light" />
                <Stack.Navigator
                    initialRouteName="Landing"
                    screenOptions={{ headerShown: false }}
                >
                    <Stack.Screen name="Landing" component={LandingScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Signup" component={SignupScreen} />
                    <Stack.Screen name="Questionnaire" component={QuestionnaireScreen} />
                    <Stack.Screen name="Main" component={MainNavigator} />
                </Stack.Navigator>
            </NavigationContainer>
        </AuthProvider>
    );
}
