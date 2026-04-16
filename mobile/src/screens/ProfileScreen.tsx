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
    Image,
    TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { BG_GRADIENT, GRADIENT_PRIMARY, COLOR, ORB } from '../config/theme';

const { width, height } = Dimensions.get('window');

export default function ProfileScreen({ navigation }: any) {
    const { user, signOut } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [highScores, setHighScores] = useState<any[]>([]);
    const [gameStats, setGameStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingContact, setEditingContact] = useState(false);
    const [contactInfo, setContactInfo] = useState({
        address: '',
        emergency_phone: '',
    });

    const username = user?.email?.split('@')[0] || 'Neuro Explorer';

    useEffect(() => {
        loadProfileData();
    }, []);

    const loadProfileData = async () => {
        try {
            // Mock data for now - no DB connection
            setProfile({
                xp: 0,
                streak_count: 0,
                address: '',
                emergency_phone: '',
            });
            setHighScores([]);
            setGameStats([]);
            setContactInfo({
                address: '',
                emergency_phone: '',
            });
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
                        navigation.replace('Landing');
                    },
                },
            ]
        );
    };

    const handleSaveContactInfo = () => {
        setProfile({ ...profile, ...contactInfo });
        setEditingContact(false);
        Alert.alert('Success', 'Contact information updated!');
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
                colors={BG_GRADIENT}
                style={styles.backgroundGradient}
            />

            {/* Floating Background Elements */}
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
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        <LinearGradient
                            colors={GRADIENT_PRIMARY}
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
                                <View style={styles.statIconWrapper}>
                                    <Ionicons name="flame" size={16} color="#F59E0B" />
                                </View>
                                <Text style={styles.statValue}>{profile?.streak_count || 0}</Text>
                                <Text style={styles.statLabel}>Day Streak</Text>
                            </View>
                            <View style={styles.statItem}>
                                <View style={styles.statIconWrapper}>
                                    <Ionicons name="trophy" size={16} color="#FBBF24" />
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
                                colors={GRADIENT_PRIMARY}
                                style={styles.buttonGradient}
                            >
                                <Ionicons name="chatbubbles" size={18} color="white" />
                                <Text style={styles.buttonText}>Talk to Companion</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Today's Gentle Goal */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIcon}>
                            <Ionicons name="flag" size={20} color="#FBBF24" />
                        </View>
                        <Text style={styles.sectionTitle}>Today's Gentle Goal</Text>
                    </View>
                    <View style={styles.card}>
                        <Text style={styles.goalText}>
                            Take 5 deep breaths when you feel overwhelmed today.
                        </Text>
                        <View style={styles.streakContainer}>
                            <Ionicons name="flame" size={20} color="#F59E0B" />
                            <Text style={styles.streakText}>{profile?.streak_count || 0} day streak</Text>
                        </View>
                    </View>
                </View>

                {/* Personal Bests */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIcon}>
                            <Ionicons name="trophy" size={20} color="#FBBF24" />
                        </View>
                        <Text style={styles.sectionTitle}>Personal Bests</Text>
                    </View>

                    {highScores.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="trophy" size={24} color="rgba(251, 191, 36, 0.5)" />
                            </View>
                            <Text style={styles.emptyTitle}>Your journey begins here</Text>
                            <TouchableOpacity
                                style={styles.startButton}
                                onPress={() => navigation.navigate('Games')}
                            >
                                <LinearGradient
                                    colors={['#F43F5E', '#A855F7']}
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
                                    <Text style={styles.scoreValue}>
                                        {score.score?.toLocaleString?.() || score.score}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Game Statistics */}
                {gameStats.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Ionicons name="game-controller" size={20} color="#A855F7" />
                            </View>
                            <Text style={styles.sectionTitle}>Game Statistics</Text>
                        </View>
                        <View style={styles.gameStatsGrid}>
                            {gameStats.map((stat, idx) => (
                                <View key={idx} style={styles.gameStatCard}>
                                    <Text style={styles.gameStatName}>{stat.game}</Text>
                                    <Text style={styles.gameStatSessions}>{stat.sessions} sessions</Text>
                                    <View style={styles.statGrid}>
                                        <View style={styles.statColumn}>
                                            <Text style={styles.statNumber}>{stat.bestScore}</Text>
                                            <Text style={styles.statTag}>Best</Text>
                                        </View>
                                        <View style={styles.statColumn}>
                                            <Text style={[styles.statNumber, { color: '#3B82F6' }]}>
                                                {stat.averageScore}
                                            </Text>
                                            <Text style={styles.statTag}>Average</Text>
                                        </View>
                                        <View style={styles.statColumn}>
                                            <Text style={[styles.statNumber, { color: '#A855F7' }]}>
                                                {stat.totalScore}
                                            </Text>
                                            <Text style={styles.statTag}>Total</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Emergency Contact */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIcon}>
                            <Ionicons name="call" size={20} color="#10B981" />
                        </View>
                        <Text style={styles.sectionTitle}>Emergency Contact</Text>
                        {!editingContact ? (
                            <TouchableOpacity onPress={() => setEditingContact(true)} style={styles.editButton}>
                                <Ionicons name="pencil" size={16} color="#9CA3AF" />
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.editActions}>
                                <TouchableOpacity onPress={handleSaveContactInfo} style={styles.saveButton}>
                                    <Ionicons name="checkmark" size={16} color="#10B981" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        setEditingContact(false);
                                        setContactInfo({
                                            address: profile?.address || '',
                                            emergency_phone: profile?.emergency_phone || '',
                                        });
                                    }}
                                    style={styles.cancelButton}
                                >
                                    <Ionicons name="close" size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.contactCard}>
                        <View style={styles.contactField}>
                            <View style={styles.contactLabel}>
                                <Ionicons name="location" size={14} color="#3B82F6" />
                                <Text style={styles.contactLabelText}>Address</Text>
                            </View>
                            {editingContact ? (
                                <TextInput
                                    style={styles.contactInput}
                                    value={contactInfo.address}
                                    onChangeText={(text) =>
                                        setContactInfo({ ...contactInfo, address: text })
                                    }
                                    placeholder="Enter your address..."
                                    placeholderTextColor="#6B7280"
                                    multiline
                                />
                            ) : (
                                <Text style={styles.contactValue}>
                                    {profile?.address || 'No address provided'}
                                </Text>
                            )}
                        </View>

                        <View style={styles.contactField}>
                            <View style={styles.contactLabel}>
                                <Ionicons name="call" size={14} color="#10B981" />
                                <Text style={styles.contactLabelText}>Emergency Phone</Text>
                            </View>
                            {editingContact ? (
                                <TextInput
                                    style={styles.contactInput}
                                    value={contactInfo.emergency_phone}
                                    onChangeText={(text) =>
                                        setContactInfo({ ...contactInfo, emergency_phone: text })
                                    }
                                    placeholder="Enter emergency phone..."
                                    placeholderTextColor="#6B7280"
                                    keyboardType="phone-pad"
                                />
                            ) : (
                                <Text style={styles.contactValue}>
                                    {profile?.emergency_phone || 'No emergency contact provided'}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Personal */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitleSimple}>Personal</Text>
                    <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('Diary')}>
                        <View style={styles.menuIcon}>
                            <Ionicons name="book" size={24} color="#F472B6" />
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>My Diary</Text>
                            <Text style={styles.menuSubtitle}>Private journal entries</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitleSimple}>Settings</Text>

                    <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('DailyReport')}>
                        <View style={styles.menuIcon}>
                            <Ionicons name="document-text" size={24} color="#3B82F6" />
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>Daily Report</Text>
                            <Text style={styles.menuSubtitle}>Generate today's insights</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#6B7280" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('WeeklyReport')}>
                        <View style={styles.menuIcon}>
                            <Ionicons name="calendar" size={24} color="#8B5CF6" />
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>Weekly Report</Text>
                            <Text style={styles.menuSubtitle}>View weekly progress</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#6B7280" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuCard} onPress={handleSignOut}>
                        <View style={styles.menuIcon}>
                            <Ionicons name="log-out" size={24} color="#EF4444" />
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Sign Out</Text>
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
        right: -100,
    },
    floatingElement2: {
        width: 320,
        height: 320,
        backgroundColor: '#6366F1',
        bottom: height * 0.25,
        left: -80,
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
        width: 60,
        height: 60,
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
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    profileInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    profileName: {
        fontSize: 28,
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
        gap: 32,
    },
    statItem: {
        alignItems: 'center',
    },
    statIconWrapper: {
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    actionButtons: {
        width: '100%',
    },
    actionButton: {
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
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        gap: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
        marginBottom: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionIcon: {
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
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        flex: 1,
    },
    sectionTitleSimple: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 16,
        marginLeft: 4,
    },
    editButton: {
        padding: 8,
        borderRadius: 8,
    },
    editActions: {
        flexDirection: 'row',
        gap: 8,
    },
    saveButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    cancelButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 20,
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
    emptyCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 40,
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
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    emptyTitle: {
        fontSize: 16,
        color: '#9CA3AF',
        marginBottom: 24,
    },
    startButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#F43F5E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
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
        width: (width - 72) / 2,
        alignItems: 'center',
    },
    scoreName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#E5E7EB',
        marginBottom: 8,
        textAlign: 'center',
    },
    scoreValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#10B981',
        fontFamily: 'monospace',
    },
    gameStatsGrid: {
        gap: 16,
    },
    gameStatCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    gameStatName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    gameStatSessions: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 16,
    },
    statGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    statColumn: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#10B981',
        marginBottom: 4,
    },
    statTag: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    contactCard: {
        gap: 20,
    },
    contactField: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    contactLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    contactLabelText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#D1D5DB',
    },
    contactValue: {
        fontSize: 14,
        color: '#E5E7EB',
        lineHeight: 20,
    },
    contactInput: {
        fontSize: 14,
        color: 'white',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    menuCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    menuIcon: {
        marginRight: 16,
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginBottom: 2,
    },
    menuSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    footerText: {
        fontSize: 12,
        color: '#6B7280',
    },
});