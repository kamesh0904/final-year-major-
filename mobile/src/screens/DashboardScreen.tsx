import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Image,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import { BG_GRADIENT, GRADIENT_PRIMARY, GRADIENT_CALM, GRADIENT_WARM, GRADIENT_NATURE, PROGRESS_GRADIENT, COLOR, GLASS, ORB } from '../config/theme';

const { width } = Dimensions.get('window');

const WEEKLY_TIPS = [
    "Take 5 deep breaths when you feel overwhelmed today.",
    "Drink a glass of water and notice how your body feels.",
    "Send a kind message to someone you care about.",
    "Spend 10 minutes outside, even if just at a window.",
    "Write down one thing you're grateful for today.",
    "Move your body for 5 minutes — stretch, walk, or dance.",
    "Acknowledge one small win from this week.",
];

export default function DashboardScreen({ navigation }: any) {
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [weeklyReport, setWeeklyReport] = useState<any>(null);
    const [generating, setGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('weekly');

    const username = user?.email?.split('@')[0] || 'Traveler';
    const todayTip = WEEKLY_TIPS[new Date().getDay()];

    useEffect(() => {
        loadReport();
    }, [activeTab]);

    const loadReport = async () => {
        try {
            const endpoint = activeTab === 'weekly' ? '/weekly-report' : '/daily-report';
            const response = await api.get(endpoint);
            if (response.data) setWeeklyReport(response.data);
        } catch (error) {
            console.error('Error loading report:', error);
        }
    };

    const generateReport = async () => {
        setGenerating(true);
        try {
            const endpoint = activeTab === 'weekly' ? '/generate-weekly-report' : '/generate-daily-report';
            const response = await api.post(endpoint, {});
            if (response.data) setWeeklyReport(response.data);
        } catch (error) {
            console.error('Error generating report:', error);
        } finally {
            setGenerating(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadReport();
        setRefreshing(false);
    };

    const QuickCard = ({ icon, label, color, onPress }: { icon: any; label: string; color: readonly [string, string, ...string[]]; onPress: () => void }) => (
        <TouchableOpacity style={styles.quickCard} onPress={onPress}>
            <LinearGradient colors={color} style={styles.quickCardGrad}>
                <Ionicons name={icon} size={26} color="white" />
                <Text style={styles.quickCardLabel}>{label}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={BG_GRADIENT} style={styles.bg} />
            <View style={[styles.orb, { backgroundColor: ORB.indigo, top: 100, right: -80 }]} />
            <View style={[styles.orb, { backgroundColor: ORB.pink, bottom: 250, left: -80 }]} />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLOR.purple400} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
                    <View style={styles.welcomeBadge}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.welcomeBadgeText}>All systems active</Text>
                    </View>
                    <Text style={styles.welcomeTitle}>
                        Dashboard,{' '}
                        <Text style={styles.usernameHighlight}>{username}</Text>
                    </Text>
                    <Text style={styles.welcomeSub}>Your progress at a glance.</Text>
                </View>

                {/* Quick Access Grid */}
                <View style={styles.quickGrid}>
                    <QuickCard icon="chatbubbles" label="AI Companion" color={GRADIENT_PRIMARY} onPress={() => navigation.navigate('Chat')} />
                    <QuickCard icon="book" label="My Diary" color={GRADIENT_WARM} onPress={() => navigation.navigate('Diary')} />
                    <QuickCard icon="game-controller" label="Games" color={GRADIENT_CALM} onPress={() => navigation.navigate('Games')} />
                    <QuickCard icon="person" label="Profile" color={GRADIENT_NATURE} onPress={() => navigation.navigate('Profile')} />
                </View>

                {/* Today's Gentle Goal */}
                <View style={styles.goalCard}>
                    <View style={styles.cardHeaderRow}>
                        <View style={[styles.sectionIcon, { backgroundColor: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.2)' }]}>
                            <Ionicons name="flag" size={18} color={COLOR.amber400} />
                        </View>
                        <Text style={styles.cardTitle}>Today's Gentle Goal</Text>
                    </View>
                    <Text style={styles.goalText}>{todayTip}</Text>
                    <View style={styles.streakRow}>
                        <Ionicons name="flame" size={18} color={COLOR.amber500} />
                        <Text style={styles.streakText}>Keep your streak alive 🔥</Text>
                    </View>
                </View>

                {/* Crisis Resources */}
                <TouchableOpacity style={styles.crisisCard} onPress={() => navigation.navigate('Chat')}>
                    <LinearGradient colors={['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.05)']} style={styles.crisisGrad}>
                        <Ionicons name="heart" size={20} color="#EF4444" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.crisisTitle}>Need Support Right Now?</Text>
                            <Text style={styles.crisisSub}>Your AI companion is always here for you</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#EF4444" />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Report Section */}
                <View style={styles.reportSection}>
                    <View style={styles.cardHeaderRow}>
                        <View style={[styles.sectionIcon, { backgroundColor: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.2)' }]}>
                            <Ionicons name="bar-chart" size={18} color={COLOR.indigo400} />
                        </View>
                        <Text style={styles.cardTitle}>Therapy Reports</Text>
                    </View>

                    {/* Tab Switcher */}
                    <View style={styles.tabRow}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'weekly' && styles.tabActive]}
                            onPress={() => setActiveTab('weekly')}
                        >
                            <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>Weekly</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'daily' && styles.tabActive]}
                            onPress={() => setActiveTab('daily')}
                        >
                            <Text style={[styles.tabText, activeTab === 'daily' && styles.tabTextActive]}>Daily</Text>
                        </TouchableOpacity>
                    </View>

                    {weeklyReport ? (
                        <View style={styles.reportCard}>
                            {/* Summary */}
                            {weeklyReport.summary && (
                                <View style={styles.reportBlock}>
                                    <Text style={styles.reportBlockTitle}>📊 Summary</Text>
                                    <Text style={styles.reportText}>{weeklyReport.summary}</Text>
                                </View>
                            )}
                            {/* Insights */}
                            {weeklyReport.insights && (
                                <View style={styles.reportBlock}>
                                    <Text style={styles.reportBlockTitle}>💡 Key Insights</Text>
                                    <Text style={styles.reportText}>{weeklyReport.insights}</Text>
                                </View>
                            )}
                            {/* Recommendations */}
                            {weeklyReport.recommendations && (
                                <View style={styles.reportBlock}>
                                    <Text style={styles.reportBlockTitle}>🎯 Recommendations</Text>
                                    <Text style={styles.reportText}>{weeklyReport.recommendations}</Text>
                                </View>
                            )}
                            {/* Data Points */}
                            {weeklyReport.data_points && (
                                <View style={styles.dataPointsRow}>
                                    {Object.entries(weeklyReport.data_points).map(([key, val]: any) => (
                                        <View key={key} style={styles.dataPoint}>
                                            <Text style={styles.dataPointVal}>{val}</Text>
                                            <Text style={styles.dataPointKey}>{key.replace(/_/g, ' ')}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={styles.emptyReport}>
                            <Ionicons name="document-text-outline" size={40} color="rgba(139,92,246,0.4)" />
                            <Text style={styles.emptyReportText}>No {activeTab} report yet</Text>
                            <Text style={styles.emptyReportSub}>Generate one to see your personalized therapeutic insights</Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.generateBtn} onPress={generateReport} disabled={generating}>
                        <LinearGradient colors={GRADIENT_PRIMARY} style={styles.generateBtnGrad}>
                            <Ionicons name="sparkles" size={18} color="white" />
                            <Text style={styles.generateBtnText}>{generating ? 'Generating...' : `Generate ${activeTab === 'weekly' ? 'Weekly' : 'Daily'} Report`}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    bg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
    scroll: { flex: 1 },
    content: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 100 },
    header: { marginBottom: 28, alignItems: 'center' },
    logo: { width: 50, height: 50, marginBottom: 16 },
    welcomeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 12 },
    onlineDot: { width: 8, height: 8, backgroundColor: COLOR.emerald500, borderRadius: 4 },
    welcomeBadgeText: { color: COLOR.emerald500, fontSize: 13, fontWeight: '500' },
    welcomeTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 6 },
    usernameHighlight: { color: COLOR.purple400 },
    welcomeSub: { fontSize: 15, color: COLOR.textFaint, textAlign: 'center' },
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    quickCard: { width: (width - 48 - 12) / 2, borderRadius: 18, overflow: 'hidden' },
    quickCardGrad: { padding: 20, alignItems: 'center', gap: 8 },
    quickCardLabel: { color: 'white', fontSize: 14, fontWeight: '700' },
    goalCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 22, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16 },
    cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    sectionIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    goalText: { fontSize: 16, color: COLOR.textMuted, lineHeight: 24, marginBottom: 14 },
    streakRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    streakText: { color: COLOR.amber400, fontWeight: '600', fontSize: 14 },
    crisisCard: { borderRadius: 18, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
    crisisGrad: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    crisisTitle: { color: 'white', fontWeight: '700', fontSize: 15 },
    crisisSub: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
    reportSection: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 22, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16 },
    tabRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 16 },
    tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: 'rgba(139,92,246,0.3)' },
    tabText: { color: '#6B7280', fontWeight: '600', fontSize: 14 },
    tabTextActive: { color: COLOR.purple400 },
    reportCard: { gap: 16, marginBottom: 16 },
    reportBlock: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14 },
    reportBlockTitle: { fontSize: 15, fontWeight: '700', color: 'white', marginBottom: 8 },
    reportText: { fontSize: 14, color: COLOR.textMuted, lineHeight: 22 },
    dataPointsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    dataPoint: { backgroundColor: 'rgba(139,92,246,0.1)', borderRadius: 12, padding: 12, alignItems: 'center', flex: 1, minWidth: 80 },
    dataPointVal: { fontSize: 20, fontWeight: 'bold', color: COLOR.purple400, marginBottom: 2 },
    dataPointKey: { fontSize: 11, color: COLOR.textFaint, textAlign: 'center', textTransform: 'capitalize' },
    emptyReport: { alignItems: 'center', paddingVertical: 32, gap: 8 },
    emptyReportText: { fontSize: 16, color: 'white', fontWeight: '600' },
    emptyReportSub: { fontSize: 13, color: COLOR.textFaint, textAlign: 'center', lineHeight: 20 },
    generateBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
    generateBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14 },
    generateBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
