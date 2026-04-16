import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BG_GRADIENT, GRADIENT_PRIMARY, PROGRESS_GRADIENT, COLOR, ORB } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MoodCheckInModal from './MoodCheckInModal';
import {
    createNeuroProfileResult,
    loadNeuroProfileResult,
    NeuroProfileResult,
    saveNeuroProfileResult,
} from '../utils/neuroProfile';

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

const GAME_ROUTES: Record<string, string> = {
    "Chromatic Rush": 'ChromaticRush',
    "Impulse Guard": 'ImpulseGuard',
    "Pattern Release": 'PatternRelease',
    "Order Shift": 'OrderShift',
    "Sensory Flow": 'SensoryFlow',
    "Emotion Match": 'EmotionMatch',
    "Breath Sync": 'BreathSync',
    "Calm Path": 'CalmPath',
    "Light Builder": 'LightBuilder',
    "Momentum Steps": 'MomentumSteps',
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
    const { user, loading: authLoading } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [assessmentResult, setAssessmentResult] = useState<NeuroProfileResult | null>(null);
    const [recommendations, setRecommendations] = useState<string[]>(PROFILE_MAP["General"]);
    const [loading, setLoading] = useState(false);
    // Dashboard stats
    const [streak, setStreak] = useState(0);
    const [todayMood, setTodayMood] = useState<number | null>(null);
    const [questsDone, setQuestsDone] = useState(0);
    const [gamesToday, setGamesToday] = useState(0);

    const username = user?.email?.split('@')[0] || 'Traveler';
    const TODAY = new Date().toISOString().slice(0, 10);
    const profileScores = assessmentResult?.categoryScores ?? {};
    const hasAssessment = Boolean(
        assessmentResult?.questionnaireCompleted && assessmentResult?.primaryProfile
    );
    const rankedScores = Object.entries(profileScores).sort(([, scoreA], [, scoreB]) => scoreB - scoreA);
    const maxProfileScore = Math.max(1, ...Object.values(profileScores));

    useEffect(() => {
        if (authLoading) return;
        loadData();
        loadDashboardStats();
    }, [authLoading, user?.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (!user?.id) {
                setAssessmentResult(null);
                setRecommendations(PROFILE_MAP["General"]);
                return;
            }

            const storedResult = await loadNeuroProfileResult(user.id);
            let nextResult = storedResult;

            const { data, error } = await supabase
                .from('profiles')
                .select('primary_profile, secondary_profile, questionnaire_completed, updated_at, scores')
                .eq('id', user.id)
                .maybeSingle();

            if (error) {
                console.log('Profile lookup falling back to local assessment cache:', error.message);
            }

            if (data) {
                nextResult = createNeuroProfileResult({
                    primaryProfile: data.primary_profile ?? storedResult?.primaryProfile,
                    secondaryProfile: data.secondary_profile ?? storedResult?.secondaryProfile,
                    categoryScores: data.scores ?? storedResult?.categoryScores,
                    questionnaireCompleted: data.questionnaire_completed ?? storedResult?.questionnaireCompleted,
                    updatedAt: data.updated_at ?? storedResult?.updatedAt ?? null,
                });
            }

            if (nextResult?.questionnaireCompleted && nextResult.primaryProfile) {
                setAssessmentResult(nextResult);
                calculateRecommendations(nextResult.categoryScores);
                await saveNeuroProfileResult(user.id, nextResult);
            } else {
                setAssessmentResult(null);
                setRecommendations(PROFILE_MAP["General"]);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            setAssessmentResult(null);
            setRecommendations(PROFILE_MAP["General"]);
        } finally {
            setLoading(false);
        }
    };

    const loadDashboardStats = async () => {
        if (!user?.id) {
            setStreak(0);
            setTodayMood(null);
            setQuestsDone(0);
            setGamesToday(0);
            return;
        }

        // Login streak
        let streakCount = 0;
        for (let i = 0; i < 60; i++) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const key = `lumina_login_${d.toISOString().slice(0, 10)}`;
            const v = await AsyncStorage.getItem(key);
            if (v) streakCount++; else break;
        }
        setStreak(streakCount);

        // Today's mood (user-scoped key)
        const moodRaw = await AsyncStorage.getItem(`mood_checkin_${user.id}_${TODAY}`);
        if (moodRaw) {
            setTodayMood(parseInt(moodRaw, 10));
        } else {
            setTodayMood(null);
        }

        // Quests done today
        let done = 0;
        // Simple: count how many AsyncStorage quest flags are set
        const loginDone = await AsyncStorage.getItem(`lumina_login_${TODAY}`);
        if (loginDone) done++;
        if (moodRaw) done++; // mood = companion_chat proxy
        setQuestsDone(done);

        // Games played today
        try {
            const { count } = await supabase
                .from('game_sessions')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('created_at', `${TODAY}T00:00:00`);
            setGamesToday(count ?? 0);
        } catch (_) { }
    };

    const calculateRecommendations = (currentScores: Record<string, number>) => {
        if (!currentScores || Object.keys(currentScores).length === 0) return;

        const sortedCategories = Object.entries(currentScores)
            .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
            .map(([category]) => category);

        const primaryCat = sortedCategories[0];
        const secondaryCat = sortedCategories[1];

        const normalize = (key: string) => {
            if (!key) return 'General';
            if (key === 'ASD' || key.includes("Autism")) return "Autism";
            return key;
        };

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
        await loadDashboardStats();
        setRefreshing(false);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient
                    colors={BG_GRADIENT}
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
            {/* Daily mood check-in modal */}
            {user?.id && <MoodCheckInModal onComplete={(mood) => setTodayMood(mood)} />}

            {/* Background Gradient */}
            <LinearGradient colors={BG_GRADIENT} style={styles.backgroundGradient} />
            <View style={[styles.floatingElement, styles.floatingElement1]} />
            <View style={[styles.floatingElement, styles.floatingElement2]} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A855F7" />
                }
            >
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
                </View>

                {/* Welcome */}
                <View style={styles.header}>
                    <View style={styles.statusIndicator}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>You're in your safe space</Text>
                    </View>
                    <Text style={styles.welcomeTitle}>
                        Welcome back, <Text style={styles.usernameGradient}>{username}</Text>
                    </Text>
                    <Text style={styles.welcomeSubtitle}>
                        Take a deep breath. You're here, you're safe, and you're ready to grow.
                    </Text>
                </View>

                {/* ── Dashboard Stats Row ───────────────────────────────── */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statEmoji}>🔥</Text>
                        <Text style={styles.statValue}>{streak}</Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statEmoji}>
                            {todayMood ? ['', '😞', '😔', '😐', '🙂', '😊', '😄', '😁', '🤩', '🥳', '✨'][todayMood] : '—'}
                        </Text>
                        <Text style={styles.statValue}>{todayMood ? `${todayMood}/10` : '—'}</Text>
                        <Text style={styles.statLabel}>Today's Mood</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statEmoji}>🎮</Text>
                        <Text style={styles.statValue}>{gamesToday}</Text>
                        <Text style={styles.statLabel}>Games Today</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statEmoji}>⭐</Text>
                        <Text style={styles.statValue}>{questsDone}/5</Text>
                        <Text style={styles.statLabel}>Quests Done</Text>
                    </View>
                </View>

                {/* ── Feature Shortcuts ─────────────────────────────────── */}
                <View style={styles.shortcutsRow}>
                    <TouchableOpacity onPress={() => navigation.navigate('WeeklyReport')} style={styles.shortcutCard}>
                        <LinearGradient colors={['rgba(139,92,246,0.25)', 'rgba(139,92,246,0.05)']} style={styles.shortcutGrad}>
                            <Text style={styles.shortcutEmoji}>📊</Text>
                            <Text style={styles.shortcutTitle}>AI Report</Text>
                            <Text style={styles.shortcutDesc}>Weekly therapy insights</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Achievements')} style={styles.shortcutCard}>
                        <LinearGradient colors={['rgba(245,158,11,0.25)', 'rgba(245,158,11,0.05)']} style={styles.shortcutGrad}>
                            <Text style={styles.shortcutEmoji}>🏆</Text>
                            <Text style={styles.shortcutTitle}>Achievements</Text>
                            <Text style={styles.shortcutDesc}>Your earned badges</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('LightBuilder')} style={styles.shortcutCard}>
                        <LinearGradient colors={['rgba(251,191,36,0.25)', 'rgba(251,191,36,0.05)']} style={styles.shortcutGrad}>
                            <Text style={styles.shortcutEmoji}>✨</Text>
                            <Text style={styles.shortcutTitle}>Light Builder</Text>
                            <Text style={styles.shortcutDesc}>Daily quest city game</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Neuro Profile Section */}
                <View style={styles.profileCard}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                            <Ionicons name={"brain" as any} size={20} color="#A855F7" />
                        </View>
                        <Text style={styles.cardTitle}>Your Neuro Profile</Text>
                    </View>

                    {!hasAssessment ? (
                        <View style={styles.emptyProfile}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name={"brain" as any} size={24} color="#A855F7" />
                            </View>
                            <Text style={styles.emptyText}>Your profile is waiting to be discovered</Text>
                            <TouchableOpacity
                                style={styles.assessmentButton}
                                onPress={() => navigation.push('Questionnaire')}
                            >
                                <LinearGradient
                                    colors={GRADIENT_PRIMARY}
                                    style={styles.buttonGradient}
                                >
                                    <Ionicons name={"sunny" as any} size={16} color="white" />
                                    <Text style={styles.buttonText}>Complete Assessment</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.profileScores}>
                            <Text style={styles.profileResultTitle}>
                                Primary result: {assessmentResult?.primaryProfile}
                            </Text>
                            <Text style={styles.profileResultText}>
                                Your games and daily support are now personalized around your profile.
                            </Text>

                            <View style={styles.profileTags}>
                                <View style={[styles.profileTag, styles.profileTagPrimary]}>
                                    <Text style={styles.profileTagLabel}>Primary</Text>
                                    <Text style={styles.profileTagText}>
                                        {assessmentResult?.primaryProfile}
                                    </Text>
                                </View>
                                {assessmentResult?.secondaryProfile ? (
                                    <View style={[styles.profileTag, styles.profileTagSecondary]}>
                                        <Text style={styles.profileTagLabel}>Also seen</Text>
                                        <Text style={styles.profileTagText}>
                                            {assessmentResult.secondaryProfile}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>

                            <View style={styles.profileBreakdown}>
                                {rankedScores.map(([domain, score]) => (
                                    <View key={domain} style={styles.scoreItem}>
                                        <View style={styles.scoreHeader}>
                                            <View style={styles.scoreDot} />
                                            <Text style={styles.scoreDomain}>{domain}</Text>
                                            <Text style={styles.scoreValue}>{score}</Text>
                                        </View>
                                        <View style={styles.progressBar}>
                                            <LinearGradient
                                                colors={PROGRESS_GRADIENT}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={[
                                                    styles.progressFill,
                                                    { width: `${(score / maxProfileScore) * 100}%` },
                                                ]}
                                            />
                                        </View>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.assessmentButton}
                                onPress={() => navigation.push('Questionnaire')}
                            >
                                <LinearGradient
                                    colors={GRADIENT_PRIMARY}
                                    style={styles.buttonGradient}
                                >
                                    <Ionicons name={"refresh" as any} size={16} color="white" />
                                    <Text style={styles.buttonText}>Retake Assessment</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Today's Gentle Goal */}
                <View style={styles.goalCard}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="flag" size={20} color="#FBBF24" />
                        </View>
                        <Text style={styles.cardTitle}>Today's Gentle Goal</Text>
                    </View>
                    <Text style={styles.goalText}>
                        Take 5 deep breaths when you feel overwhelmed today.
                    </Text>
                    <View style={styles.streakContainer}>
                        <Ionicons name="flame" size={20} color="#F59E0B" />
                        <Text style={styles.streakText}>0 day streak</Text>
                    </View>
                </View>

                {/* Recommended Games */}
                <View style={styles.gamesSection}>
                    <Text style={styles.gamesTitle}>
                        <Text style={styles.gamesTitleGradient}>Chosen just for you</Text>
                    </Text>
                    <View style={styles.gamesGrid}>
                        {recommendations.map((gameName, index) => {
                            const game = GAME_LIBRARY[gameName] || GAME_LIBRARY["Calm Path"];
                            return (
                                <TouchableOpacity
                                    key={gameName}
                                    style={styles.gameCard}
                                    onPress={() => {
                                        const route = GAME_ROUTES[gameName];
                                        if (route) {
                                            navigation.navigate(route);
                                        } else {
                                            navigation.navigate('Games');
                                        }
                                    }}
                                >
                                    <LinearGradient
                                        colors={[game.colors[0], game.colors[1], 'rgba(0,0,0,0.2)'] as const}
                                        style={styles.gameGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <View style={styles.gameOverlay} />
                                        <View style={styles.gameContent}>
                                            <View style={styles.gameIcon}>
                                                <Ionicons name={game.icon as any} size={28} color="white" />
                                            </View>
                                            <Text style={styles.gameName}>{gameName}</Text>
                                            <Text style={styles.gameDesc}>{game.desc}</Text>
                                            <View style={styles.playIcon}>
                                                <Ionicons name="play" size={16} color="white" />
                                            </View>
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
        backgroundColor: ORB.purple,
        top: height * 0.2,
        right: -100,
        opacity: 1,
    },
    floatingElement2: {
        width: 320,
        height: 320,
        backgroundColor: ORB.indigo,
        bottom: height * 0.25,
        left: -80,
        opacity: 1,
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
        color: '#9CA3AF',
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
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logo: {
        width: 80,
        height: 80,
    },
    header: {
        marginBottom: 32,
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
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
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 12,
        lineHeight: 40,
    },
    usernameGradient: {
        color: '#F472B6',
        textTransform: 'capitalize',
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: '#D1D5DB',
        lineHeight: 24,
    },
    quickAccessGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    quickCard: {
        flex: 1,
        height: 140,
        borderRadius: 20,
        overflow: 'hidden',
    },
    quickCardInner: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        padding: 20,
        justifyContent: 'space-between',
    },
    quickCardIcon: {
        width: 48,
        height: 48,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    quickCardDesc: {
        fontSize: 12,
        color: '#9CA3AF',
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
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    emptyProfile: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyIcon: {
        width: 64,
        height: 64,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 14,
        marginBottom: 24,
        textAlign: 'center',
    },
    assessmentButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        gap: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    profileScores: {
        gap: 20,
    },
    profileResultTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    profileResultText: {
        fontSize: 14,
        lineHeight: 21,
        color: '#D1D5DB',
    },
    profileTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    profileTag: {
        flex: 1,
        minWidth: 130,
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
    },
    profileTagPrimary: {
        backgroundColor: 'rgba(99, 102, 241, 0.14)',
        borderColor: 'rgba(99, 102, 241, 0.35)',
    },
    profileTagSecondary: {
        backgroundColor: 'rgba(244, 114, 182, 0.12)',
        borderColor: 'rgba(244, 114, 182, 0.28)',
    },
    profileTagLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 6,
    },
    profileTagText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
    profileBreakdown: {
        gap: 16,
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
        borderRadius: 4,
        marginRight: 8,
        backgroundColor: '#3B82F6',
    },
    scoreDomain: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: '#E5E7EB',
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
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    goalText: {
        fontSize: 16,
        color: '#D1D5DB',
        lineHeight: 24,
        marginBottom: 16,
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
    gamesSection: {
        marginBottom: 24,
    },
    gamesTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
    },
    gamesTitleGradient: {
        color: '#F472B6',
    },
    gamesGrid: {
        gap: 20,
    },
    gameCard: {
        height: 220,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    gameGradient: {
        flex: 1,
        position: 'relative',
    },
    gameOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    gameContent: {
        flex: 1,
        padding: 24,
        justifyContent: 'flex-end',
    },
    gameIcon: {
        width: 56,
        height: 56,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    gameName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    gameDesc: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 20,
    },
    playIcon: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // \u2500\u2500 Dashboard stats
    statsRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, gap: 8 },
    statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 2 },
    statEmoji: { fontSize: 20 },
    statValue: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    statLabel: { color: 'rgba(156,163,175,0.7)', fontSize: 9, textAlign: 'center' },
    // \u2500\u2500 Shortcut cards
    shortcutsRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, gap: 8 },
    shortcutCard: { flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    shortcutGrad: { padding: 14, alignItems: 'center', gap: 4 },
    shortcutEmoji: { fontSize: 24 },
    shortcutTitle: { color: 'white', fontSize: 11, fontWeight: '700', textAlign: 'center' },
    shortcutDesc: { color: 'rgba(156,163,175,0.6)', fontSize: 9, textAlign: 'center' },
});
