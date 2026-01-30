import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';

export default function HomeScreen({ navigation }: any) {
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [gentleGoal, setGentleGoal] = useState<any>(null);
    const [streak, setStreak] = useState(0);

    const loadData = async () => {
        try {
            const [goalRes, streakRes] = await Promise.all([
                api.get('/gentle-goal/today'),
                api.get('/gentle-goal/streak'),
            ]);
            setGentleGoal(goalRes.data);
            setStreak(streakRes.data.streak || 0);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={styles.header}>
                <Text style={styles.greeting}>Hello! 👋</Text>
                <Text style={styles.email}>{user?.email}</Text>
            </View>

            {/* Today's Gentle Goal */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="flag" size={24} color="#8B5CF6" />
                    <Text style={styles.cardTitle}>Today's Gentle Goal</Text>
                </View>
                {gentleGoal ? (
                    <View>
                        <Text style={styles.goalText}>{gentleGoal.goal_text}</Text>
                        <View style={styles.streakContainer}>
                            <Ionicons name="flame" size={20} color="#F59E0B" />
                            <Text style={styles.streakText}>{streak} day streak</Text>
                        </View>
                    </View>
                ) : (
                    <Text style={styles.noGoalText}>Loading your goal...</Text>
                )}
            </View>

            {/* Quick Actions */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Quick Actions</Text>
                <View style={styles.actionGrid}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('Games')}
                    >
                        <Ionicons name="game-controller" size={32} color="#8B5CF6" />
                        <Text style={styles.actionText}>Play Games</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('Chat')}
                    >
                        <Ionicons name="chatbubbles" size={32} color="#10B981" />
                        <Text style={styles.actionText}>Chat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Ionicons name="document-text" size={32} color="#3B82F6" />
                        <Text style={styles.actionText}>Reports</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Ionicons name="book" size={32} color="#F59E0B" />
                        <Text style={styles.actionText}>Diary</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Features */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Features</Text>
                <View style={styles.featureList}>
                    <View style={styles.featureItem}>
                        <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                        <Text style={styles.featureText}>Safe & Confidential</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="person" size={24} color="#8B5CF6" />
                        <Text style={styles.featureText}>Personalized Support</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="trophy" size={24} color="#F59E0B" />
                        <Text style={styles.featureText}>Gamified Experience</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#8B5CF6',
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 5,
    },
    email: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    card: {
        backgroundColor: 'white',
        margin: 15,
        padding: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 10,
    },
    goalText: {
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 24,
    },
    noGoalText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    streakContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    streakText: {
        fontSize: 14,
        color: '#F59E0B',
        fontWeight: '600',
        marginLeft: 5,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    actionButton: {
        width: '48%',
        backgroundColor: '#F9FAFB',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    actionText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    featureList: {
        marginTop: 15,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    featureText: {
        fontSize: 16,
        color: '#4B5563',
        marginLeft: 15,
    },
});
