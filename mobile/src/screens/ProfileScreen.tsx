import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';

const { width, height } = Dimensions.get('window');

export default function ProfileScreen({ navigation }: any) {
    const { user, signOut } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [highScores, setHighScores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const username = user?.email?.split('@')[0] || 'Neuro Explorer';

    useEffect(() => {
        loadProfileData();
    }, []);

    const loadProfileData = async () => {
        try {
            const [profileRes, scoresRes] = await Promise.all([
                api.get('/profile').catch(() => ({ data: null })),
                api.get('/games/high-scores').catch(() => ({ data: {} })),
            ]);
            setProfile(profileRes.data);

            if (scoresRes.data && typeof scoresRes.data === 'object') {
                const scores = Object.entries(scoresRes.data).map(([game, score]) => ({ game, score }));
                setHighScores(scores);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProfileData();
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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient
                    colors={['#0a0514', '#1a0b2e', '#0f0619']}
                    style={styles.backgroundGradient}
                />
                <View style={styles.loadingContent}>
                    <View style={styles.loadingIcon} />
                    <Text style={styles.loadingText}>Loading your sanctuary...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#0a0514', '#1a0b2e', '#0f0619']}
                style={styles.backgroundGradient}
            />

            {/* Floating Background Elements */}
            <View style={[styles.floatingElement, styles.floatingElement1]} />
            <View style={[styles.floatingElement, styles.floatingElement2]} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        <LinearGradient
                            colors={['#A855F7', '#6366F1']}
                            style={styles.avatar}
                        >
                            <Ionicons name="person" size={48} color="white" />
                        </LinearGradient>
                    </View>

                    {/* Profile Info */}
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{username}</Text>
                        <Text style={styles.profileLevel}>
                            Level {Math.floor((profile?.xp || 0) / 1000) + 1} • {profile?.xp || 0} XP
                        </Text>

                        {/* Quick Stats */}
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <View style={styles.statIcon}>
                                    <Ionicons name="flame" size={16} color="#F59E0B" />
                                </View>
                                <Text style={styles.statValue}>{profile?.streak_count || 0}</Text>
                                <Text style={styles.statLabel}>Day Streak</Text>
                            </View>
                            <View style={styles.statItem}>
                                <View style={styles.statIcon}>
                                    <Ionicons name="trophy" size={16} color="#F59E0B" />
                                </View>
                                <Text style={styles.statValue}>{highScores.length}</Text>
                                <Text style={styles.statLabel}>Games</Text>
                            </View>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('Chat')}
                        >
                            <LinearGradient
                                colors={['rgba(99, 102, 241, 0.8)', 'rgba(139, 92, 246, 0.8)']}
                                style={styles.buttonGradient}
                            >
                                <Ionicons name="chatbubbles" size={18} color="white" />
                                <Text style={styles.buttonText}>Talk to Companion</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Reports Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Reports</Text>

                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => generateReport('daily')}
                    >
                        <View style={styles.cardIcon}>
                            <Ionicons name="document-text" size={24} color="#3B82F6" />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Daily Report</Text>
                            <Text style={styles.cardSubtitle}>Generate today's insights</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="rgba(156, 163, 175, 1)" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => generateReport('weekly')}
                    >
                        <View style={styles.cardIcon}>
                            <Ionicons name="calendar" size={24} color="#8B5CF6" />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Weekly Report</Text>
                            <Text style={styles.cardSubtitle}>View weekly progress</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="rgba(156, 163, 175, 1)" />
                    </TouchableOpacity>
                </View>

                {/* High Scores */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Bests</Text>

                    {highScores.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="trophy" size={24} color="rgba(248, 180, 52, 0.5)" />
                            </View>
                            <Text style={styles.emptyTitle}>Your journey begins here</Text>
                            <TouchableOpacity
                                style={styles.startButton}
                                onPress={() => navigation.navigate('Games')}
                            >
                                <LinearGradient
                                    colors={['#F43F5E', '#EF4444']}
                                    style={styles.buttonGradient}
                                >
                                    <Text style={styles.buttonText}>Start Your First Game</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.scoresGrid}>
                            {highScores.map((score, idx) => (
                                <View key={idx} style={styles.scoreCard}>
                                    <Text style={styles.scoreName}>{score.game}</Text>
                                    <Text style={styles.scoreValue}>{score.score?.toLocaleString?.() || score.score}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Personal Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal</Text>

                    <TouchableOpacity style={styles.card}>
                        <View style={styles.cardIcon}>
                            <Ionicons name="book" size={24} color="#F59E0B" />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>My Diary</Text>
                            <Text style={styles.cardSubtitle}>Private journal entries</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="rgba(156, 163, 175, 1)" />
                    </TouchableOpacity>
                </View>

                {/* Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Settings</Text>

                    <TouchableOpacity style={styles.card}>
                        <View style={styles.cardIcon}>
                            <Ionicons name="notifications" size={24} color="#10B981" />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Notifications</Text>
                            <Text style={styles.cardSubtitle}>Manage notifications</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="rgba(156, 163, 175, 1)" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card}>
                        <View style={styles.cardIcon}>
                            <Ionicons name="help-circle" size={24} color="#3B82F6" />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Help & Support</Text>
                            <Text style={styles.cardSubtitle}>Get help</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="rgba(156, 163, 175, 1)" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.card} onPress={handleSignOut}>
                        <View style={styles.cardIcon}>
                            <Ionicons name="log-out" size={24} color="#EF4444" />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={[styles.cardTitle, { color: '#EF4444' }]}>Sign Out</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>NeuroNest v1.0.0</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    floatingElement: {
        position: 'absolute',
        borderRadius: 200,
        opacity: 0.05,
    },
    floatingElement1: {
        width: 384,
        height: 384,
        backgroundColor: '#8B5CF6',
        top: height * 0.25,
        right: width * 0.33,
    },
    floatingElement2: {
        width: 320,
        height: 320,
        backgroundColor: '#6366F1',
        bottom: height * 0.25,
        left: width * 0.33,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContent: {
        alignItems: 'center',
    },
    loadingIcon: {
        width: 64,
        height: 64,
        backgroundColor: 'rgba(139, 92, 246, 0.3)',
        borderRadius: 32,
        marginBottom: 16,
    },
    loadingText: {
        color: 'rgba(156, 163, 175, 1)',
        fontSize: 16,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    profileHeader: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatar: {
        width: 128,
        height: 128,
        borderRadius: 64,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(168, 85, 247, 0.3)',
    },
    profileInfo: {
        alignItems: 'center',
        marginBottom: 24,
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    profileLevel: {
        fontSize: 16,
        color: '#A855F7',
        fontWeight: '500',
        marginBottom: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 24,
    },
    statItem: {
        alignItems: 'center',
    },
    statIcon: {
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(156, 163, 175, 1)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    actionButtons: {
        width: '100%',
    },
    actionButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        gap: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 16,
        marginLeft: 4,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cardIcon: {
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 14,
        color: 'rgba(107, 114, 128, 1)',
    },
    emptyCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 48,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderStyle: 'dashed',
    },
    emptyIcon: {
        width: 64,
        height: 64,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        color: 'rgba(156, 163, 175, 1)',
        marginBottom: 24,
    },
    startButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    scoresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    scoreCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        minWidth: '45%',
        alignItems: 'center',
    },
    scoreName: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(229, 231, 235, 1)',
        marginBottom: 8,
        textAlign: 'center',
    },
    scoreValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#10B981',
        fontFamily: 'monospace',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    footerText: {
        fontSize: 12,
        color: 'rgba(156, 163, 175, 1)',
    },
});