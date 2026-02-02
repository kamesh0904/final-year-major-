import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';

const { width, height } = Dimensions.get('window');

const GAME_LIBRARY: Record<string, { desc: string; colors: string[]; icon: string }> = {
    "Chromatic Rush": { desc: "Train your focus and reaction speed.", colors: ['#3B82F6', '#6366F1'], icon: 'flash' },
    "Impulse Guard": { desc: "Resist the urge. Train impulse control.", colors: ['#EF4444', '#F97316'], icon: 'shield' },
    "Pattern Release": { desc: "Challenge your urge for perfection.", colors: ['#10B981', '#14B8A6'], icon: 'grid' },
    "Order Shift": { desc: "Adapt quickly to changing rules.", colors: ['#8B5CF6', '#EC4899'], icon: 'shuffle' },
    "Sensory Flow": { desc: "Calm visual drift without pressure.", colors: ['#14B8A6', '#06B6D4'], icon: 'water' },
    "Emotion Match": { desc: "Practice identifying facial expressions.", colors: ['#F43F5E', '#EF4444'], icon: 'heart' },
    "Breath Sync": { desc: "Regulate anxiety with visual breathing.", colors: ['#06B6D4', '#3B82F6'], icon: 'pulse' },
    "Calm Path": { desc: "Find your center in a chaotic world.", colors: ['#3B82F6', '#6366F1'], icon: 'leaf' },
    "Light Builder": { desc: "Restore light to the world, one step at a time.", colors: ['#F59E0B', '#F97316'], icon: 'sunny' },
    "Momentum Steps": { desc: "Build motivation through small wins.", colors: ['#6366F1', '#8B5CF6'], icon: 'trending-up' },
};

const PROFILE_MAP: Record<string, string[]> = {
    "ADHD": ["Chromatic Rush", "Impulse Guard"],
    "OCD": ["Pattern Release", "Order Shift"],
    "Autism": ["Sensory Flow", "Emotion Match"],
    "Anxiety": ["Breath Sync", "Calm Path"],
    "Depression": ["Light Builder", "Momentum Steps"],
    "General": ["Calm Path", "Chromatic Rush"]
};

export default function HomeScreen({ navigation }: any) {
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [gentleGoal, setGentleGoal] = useState<any>(null);
    const [streak, setStreak] = useState(0);
    const [scores, setScores] = useState<Record<string, number>>({});
    const [recommendations, setRecommendations] = useState<string[]>(PROFILE_MAP["General"]);
    const [loading, setLoading] = useState(true);

    const username = user?.email?.split('@')[0] || 'Traveler';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [goalRes, streakRes] = await Promise.all([
                api.get('/gentle-goal/today').catch(() => ({ data: null })),
                api.get('/gentle-goal/streak').catch(() => ({ data: { streak: 0 } })),
            ]);
            setGentleGoal(goalRes.data);
            setStreak(streakRes.data.streak || 0);

            // Load scores from local storage or API
            const localScores = JSON.parse(localStorage?.getItem?.("userScores") || "{}");
            if (Object.keys(localScores).length > 0) {
                setScores(localScores);
                calculateRecommendations(localScores);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateRecommendations = (currentScores: Record<string, number>) => {
        if (!currentScores || Object.keys(currentScores).length === 0) return;

        const sortedCategories = Object.entries(currentScores)
            .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
            .map(([category]) => category);

        const primaryCat = sortedCategories[0];
        const secondaryCat = sortedCategories[1];

        const normalize = (key: string) => (key?.includes("Autism") ? "Autism" : key);

        const primaryGames = PROFILE_MAP[normalize(primaryCat)] || PROFILE_MAP["General"];
        const secondaryGames = PROFILE_MAP[normalize(secondaryCat)] || PROFILE_MAP["General"];

        const finalMix = [
            primaryGames[0],
            primaryGames[1],
            secondaryGames[0]
        ].filter(Boolean);

        const uniqueMix = [...new Set(finalMix)];
        setRecommendations(uniqueMix);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
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
                    <Text style={styles.loadingText}>Preparing your personalized space...</Text>
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
                {/* Welcome Header */}
                <View style={styles.header}>
                    <View style={styles.statusIndicator}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>You're in your safe space</Text>
                    </View>
                    <Text style={styles.welcomeTitle}>
                        Welcome back,{' '}
                        <Text style={styles.usernameGradient}>{username}</Text>
                    </Text>
                    <Text style={styles.welcomeSubtitle}>
                        Take a deep breath. You're here, you're safe, and you're ready to grow.
                    </Text>
                </View>

                {/* Neuro Profile Section */}
                <View style={styles.profileCard}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="brain" size={20} color="#A855F7" />
                        </View>
                        <Text style={styles.cardTitle}>Your Neuro Profile</Text>
                    </View>

                    {Object.keys(scores).length === 0 ? (
                        <View style={styles.emptyProfile}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="brain" size={24} color="#A855F7" />
                            </View>
                            <Text style={styles.emptyText}>Your profile is waiting to be discovered</Text>
                            <TouchableOpacity
                                style={styles.assessmentButton}
                                onPress={() => navigation.navigate('Questionnaire')}
                            >
                                <LinearGradient
                                    colors={['rgba(99, 102, 241, 0.8)', 'rgba(139, 92, 246, 0.8)']}
                                    style={styles.buttonGradient}
                                >
                                    <Ionicons name="sunrise" size={16} color="white" />
                                    <Text style={styles.buttonText}>Complete Assessment</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.profileScores}>
                            {Object.entries(scores).map(([domain, score]) => (
                                <View key={domain} style={styles.scoreItem}>
                                    <View style={styles.scoreHeader}>
                                        <View style={styles.scoreDot} />
                                        <Text style={styles.scoreDomain}>{domain}</Text>
                                        <Text style={styles.scoreValue}>{score}/25</Text>
                                    </View>
                                    <View style={styles.progressBar}>
                                        <LinearGradient
                                            colors={['#3B82F6', '#A855F7', '#EC4899']}
                                            style={[styles.progressFill, { width: `${(score / 25) * 100}%` }]}
                                        />
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Today's Gentle Goal */}
                <View style={styles.goalCard}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="flag" size={20} color="#A855F7" />
                        </View>
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

                {/* Recommended Games */}
                <View style={styles.gamesSection}>
                    <Text style={styles.gamesTitle}>Chosen just for you</Text>
                    <View style={styles.gamesGrid}>
                        {recommendations.map((gameName, index) => {
                            const game = GAME_LIBRARY[gameName] || GAME_LIBRARY["Calm Path"];
                            return (
                                <TouchableOpacity
                                    key={gameName}
                                    style={styles.gameCard}
                                    onPress={() => navigation.navigate('Games')}
                                >
                                    <LinearGradient
                                        colors={game.colors}
                                        style={styles.gameGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <View style={styles.gameContent}>
                                            <View style={styles.gameIcon}>
                                                <Ionicons name={game.icon as any} size={24} color="white" />
                                            </View>
                                            <Text style={styles.gameName}>{gameName}</Text>
                                            <Text style={styles.gameDesc}>{game.desc}</Text>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
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
        top: height * 0.33,
        right: width * 0.25,
    },
    floatingElement2: {
        width: 320,
        height: 320,
        backgroundColor: '#6366F1',
        bottom: height * 0.33,
        left: width * 0.25,
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
    header: {
        marginBottom: 32,
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        backgroundColor: '#10B981',
        borderRadius: 4,
        marginRight: 12,
    },
    statusText: {
        color: '#10B981',
        fontSize: 14,
        fontWeight: '500',
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 12,
        lineHeight: 36,
    },
    usernameGradient: {
        color: '#A855F7',
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: 'rgba(209, 213, 219, 1)',
        lineHeight: 24,
    },
    profileCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    emptyProfile: {
        alignItems: 'center',
        paddingVertical: 48,
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
    emptyText: {
        color: 'rgba(156, 163, 175, 1)',
        fontSize: 16,
        marginBottom: 24,
    },
    assessmentButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        gap: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    profileScores: {
        gap: 24,
    },
    scoreItem: {
        gap: 12,
    },
    scoreHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    scoreDot: {
        width: 8,
        height: 8,
        backgroundColor: '#3B82F6',
        borderRadius: 4,
    },
    scoreDomain: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: 'rgba(229, 231, 235, 1)',
        marginLeft: 8,
    },
    scoreValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#A855F7',
        fontFamily: 'monospace',
    },
    progressBar: {
        height: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 8,
    },
    goalCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    goalText: {
        fontSize: 16,
        color: 'rgba(75, 85, 99, 1)',
        lineHeight: 24,
        marginBottom: 12,
    },
    streakContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    streakText: {
        fontSize: 14,
        color: '#F59E0B',
        fontWeight: '600',
        marginLeft: 8,
    },
    noGoalText: {
        fontSize: 14,
        color: 'rgba(156, 163, 175, 1)',
        fontStyle: 'italic',
    },
    gamesSection: {
        marginBottom: 24,
    },
    gamesTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 24,
    },
    gamesGrid: {
        gap: 16,
    },
    gameCard: {
        height: 200,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 16,
    },
    gameGradient: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    gameContent: {
        padding: 24,
    },
    gameIcon: {
        width: 48,
        height: 48,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    gameName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    gameDesc: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 20,
    },
});