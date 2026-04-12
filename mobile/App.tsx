import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import SwipeTabNavigator from './src/navigation/SwipeTabNavigator';
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import QuestionnaireScreen from './src/screens/QuestionnaireScreen';
// Games
import EmotionMatchScreen from './src/screens/EmotionMatchScreen';
import ChromaticRushScreen from './src/screens/ChromaticRushScreen';
import BreathSyncScreen from './src/screens/BreathSyncScreen';
import ImpulseGuardScreen from './src/screens/ImpulseGuardScreen';
import PatternReleaseScreen from './src/screens/PatternReleaseScreen';
import OrderShiftScreen from './src/screens/OrderShiftScreen';
import SensoryFlowScreen from './src/screens/SensoryFlowScreen';
import CalmPathScreen from './src/screens/CalmPathScreen';
import LightBuilderScreen from './src/screens/LightBuilderScreen';
import MomentumStepsScreen from './src/screens/MomentumStepsScreen';
// Feature screens
import WeeklyReportScreen from './src/screens/WeeklyReportScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';

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
                    {/* Auth flow */}
                    <Stack.Screen name="Landing"       component={LandingScreen} />
                    <Stack.Screen name="Login"         component={LoginScreen} />
                    <Stack.Screen name="Signup"        component={SignupScreen} />
                    <Stack.Screen name="Questionnaire" component={QuestionnaireScreen} />
                    {/* Main tab navigator */}
                    <Stack.Screen name="Main"          component={SwipeTabNavigator} />
                    {/* Games */}
                    <Stack.Screen name="EmotionMatch"   component={EmotionMatchScreen} />
                    <Stack.Screen name="ChromaticRush"  component={ChromaticRushScreen} />
                    <Stack.Screen name="BreathSync"     component={BreathSyncScreen} />
                    <Stack.Screen name="ImpulseGuard"   component={ImpulseGuardScreen} />
                    <Stack.Screen name="PatternRelease" component={PatternReleaseScreen} />
                    <Stack.Screen name="OrderShift"     component={OrderShiftScreen} />
                    <Stack.Screen name="SensoryFlow"    component={SensoryFlowScreen} />
                    <Stack.Screen name="CalmPath"       component={CalmPathScreen} />
                    <Stack.Screen name="LightBuilder"   component={LightBuilderScreen} />
                    <Stack.Screen name="MomentumSteps"  component={MomentumStepsScreen} />
                    {/* Feature screens */}
                    <Stack.Screen name="WeeklyReport"   component={WeeklyReportScreen} />
                    <Stack.Screen name="Achievements"   component={AchievementsScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        </AuthProvider>
    );
}
