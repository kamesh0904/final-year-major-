import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';

export default function ProfileScreen({ navigation }: any) {
    const { user, signOut } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [highScores, setHighScores] = useState<any>({});

    const loadProfile = async () => {
        try {
            const [profileRes, scoresRes] = await Promise.all([
                api.get('/profile'),
                api.get('/games/high-scores'),
            ]);
            setProfile(profileRes.data);
            setHighScores(scoresRes.data);
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProfile();
        setRefreshing(false);
    };

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        navigation.replace('Login');
                    },
                },
            ]
        );
    };

    const generateReport = async (type: 'daily' | 'weekly') => {
        try {
            Alert.alert('Generating Report', 'Please wait...');
            const response = await api.post(`/reports/${type}`);
            Alert.alert('Success', `${type === 'daily' ? 'Daily' : 'Weekly'} report generated!`);
        } catch (error) {
            Alert.alert('Error', 'Failed to generate report');
        }
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Ionicons name="person" size={40} color="white" />
                </View>
                <Text style={styles.email}>{user?.email}</Text>
            </View>

            {/* Reports Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reports</Text>
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => generateReport('daily')}
                >
                    <Ionicons name="document-text" size={24} color="#3B82F6" />
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Daily Report</Text>
                        <Text style={styles.cardSubtitle}>Generate today's insights</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => generateReport('weekly')}
                >
                    <Ionicons name="calendar" size={24} color="#8B5CF6" />
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Weekly Report</Text>
                        <Text style={styles.cardSubtitle}>View weekly progress</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            {/* High Scores */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Game High Scores</Text>
                <View style={styles.card}>
                    {Object.keys(highScores).length > 0 ? (
                        Object.entries(highScores).map(([game, score]: any) => (
                            <View key={game} style={styles.scoreRow}>
                                <Text style={styles.gameName}>{game}</Text>
                                <Text style={styles.scoreValue}>{score}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noDataText}>No high scores yet. Play some games!</Text>
                    )}
                </View>
            </View>

            {/* Diary */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personal</Text>
                <TouchableOpacity style={styles.card}>
                    <Ionicons name="book" size={24} color="#F59E0B" />
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>My Diary</Text>
                        <Text style={styles.cardSubtitle}>Private journal entries</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            {/* Settings */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Settings</Text>
                <TouchableOpacity style={styles.card}>
                    <Ionicons name="notifications" size={24} color="#10B981" />
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Notifications</Text>
                        <Text style={styles.cardSubtitle}>Manage notifications</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.card}>
                    <Ionicons name="help-circle" size={24} color="#3B82F6" />
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Help & Support</Text>
                        <Text style={styles.cardSubtitle}>Get help</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={handleSignOut}>
                    <Ionicons name="log-out" size={24} color="#EF4444" />
                    <View style={styles.cardContent}>
                        <Text style={[styles.cardTitle, { color: '#EF4444' }]}>Sign Out</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>NeuroNest v1.0.0</Text>
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
        alignItems: 'center',
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    email: {
        fontSize: 16,
        color: 'white',
        fontWeight: '600',
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 10,
        marginLeft: 5,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    cardContent: {
        flex: 1,
        marginLeft: 15,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    scoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    gameName: {
        fontSize: 14,
        color: '#4B5563',
    },
    scoreValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8B5CF6',
    },
    noDataText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    footer: {
        padding: 30,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
});
