/**
 * AchievementsScreen — Badge System
 * Badges are earned by real app activity and stored in AsyncStorage.
 * They are checked/awarded on screen mount.
 */
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

interface Badge {
    id: string;
    emoji: string;
    title: string;
    desc: string;
    category: 'streak' | 'games' | 'therapy' | 'social' | 'milestone';
    earned: boolean;
    earnedDate?: string;
    color: string;
}

const BADGE_DEFINITIONS = [
    // Streak
    { id: 'streak_3',    emoji: '🔥', title: '3-Day Streak',   desc: 'Login 3 days in a row',             category: 'streak',    color: '#F97316' },
    { id: 'streak_7',    emoji: '⚡', title: 'Week Warrior',   desc: 'Login 7 days in a row',             category: 'streak',    color: '#EAB308' },
    { id: 'streak_30',   emoji: '👑', title: 'Month Master',   desc: 'Login 30 days in a row',            category: 'streak',    color: '#A855F7' },
    // Games
    { id: 'first_game',  emoji: '🎮', title: 'First Play',     desc: 'Complete your first game session',  category: 'games',     color: '#3B82F6' },
    { id: 'game_10',     emoji: '🏅', title: 'Game Veteran',   desc: 'Complete 10 game sessions',         category: 'games',     color: '#6366F1' },
    { id: 'game_50',     emoji: '🏆', title: 'Game Champion',  desc: 'Complete 50 game sessions',         category: 'games',     color: '#F59E0B' },
    { id: 'first_build', emoji: '🪔', title: 'First Light',    desc: 'Unlock your first building',        category: 'games',     color: '#FDE68A' },
    { id: 'calm_10',     emoji: '🌊', title: 'Calm Mind',      desc: 'Complete 10 Breath Sync sessions',  category: 'games',     color: '#06B6D4' },
    // Therapy
    { id: 'first_chat',  emoji: '💬', title: 'First Words',    desc: 'Send your first message to AI',      category: 'therapy',   color: '#8B5CF6' },
    { id: 'chat_50',     emoji: '🗣️', title: 'Deep Talker',   desc: 'Send 50+ messages to companion',    category: 'therapy',   color: '#A855F7' },
    { id: 'first_diary', emoji: '📔', title: 'First Entry',    desc: 'Write your first diary entry',      category: 'therapy',   color: '#EC4899' },
    { id: 'diary_10',    emoji: '📚', title: 'Story Keeper',   desc: 'Write 10 diary entries',            category: 'therapy',   color: '#F43F5E' },
    { id: 'mood_7',      emoji: '🌤️', title: 'Mood Tracker',  desc: 'Check in your mood 7 days',         category: 'therapy',   color: '#0EA5E9' },
    // Quest
    { id: 'quest_all',   emoji: '⭐', title: 'Quest Master',   desc: 'Complete all 5 daily quests in one day', category: 'milestone', color: '#FBBF24' },
    { id: 'week_report', emoji: '📊', title: 'Insight Seeker', desc: 'Read your first weekly AI report',  category: 'milestone', color: '#10B981' },
] as const;

type BadgeId = typeof BADGE_DEFINITIONS[number]['id'];

export default function AchievementsScreen({ navigation }: any) {
    const { user } = useAuth();
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('all');

    const CATEGORIES = ['all', 'streak', 'games', 'therapy', 'milestone'];

    useEffect(() => {
        checkAndLoadBadges();
    }, [user?.id]);

    const checkAndLoadBadges = async () => {
        setLoading(true);

        // Load which badges have been earned from AsyncStorage
        const earnedRaw = await AsyncStorage.getItem('earned_badges');
        const earnedMap: Record<string, string> = earnedRaw ? JSON.parse(earnedRaw) : {};

        // Check new badges from Supabase data
        if (user?.id) {
            try {
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);

                // Game sessions count
                const { data: sessions } = await supabase
                    .from('game_sessions')
                    .select('id, game_name, created_at')
                    .eq('user_id', user.id);

                const sessionCount = sessions?.length ?? 0;
                const breathCount  = sessions?.filter(s => s.game_name === 'Breath Sync').length ?? 0;

                if (sessionCount >= 1  && !earnedMap['first_game'])  earnedMap['first_game']  = new Date().toDateString();
                if (sessionCount >= 10 && !earnedMap['game_10'])     earnedMap['game_10']     = new Date().toDateString();
                if (sessionCount >= 50 && !earnedMap['game_50'])     earnedMap['game_50']     = new Date().toDateString();
                if (breathCount  >= 10 && !earnedMap['calm_10'])     earnedMap['calm_10']     = new Date().toDateString();

                // Chat messages count
                const { count: chatCount } = await supabase
                    .from('chat_messages')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('role', 'user');

                if ((chatCount ?? 0) >= 1  && !earnedMap['first_chat']) earnedMap['first_chat'] = new Date().toDateString();
                if ((chatCount ?? 0) >= 50 && !earnedMap['chat_50'])   earnedMap['chat_50']   = new Date().toDateString();

                // Diary entries
                const { count: diaryCount } = await supabase
                    .from('diary_entries')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                if ((diaryCount ?? 0) >= 1  && !earnedMap['first_diary']) earnedMap['first_diary'] = new Date().toDateString();
                if ((diaryCount ?? 0) >= 10 && !earnedMap['diary_10'])   earnedMap['diary_10']   = new Date().toDateString();

                // Mood check-ins (count days with mood stored)
                let moodDays = 0;
                for (let i = 0; i < 30; i++) {
                    const d = new Date(); d.setDate(d.getDate() - i);
                    const key = `mood_checkin_${d.toISOString().slice(0,10)}`;
                    const v = await AsyncStorage.getItem(key);
                    if (v) moodDays++;
                }
                if (moodDays >= 7 && !earnedMap['mood_7']) earnedMap['mood_7'] = new Date().toDateString();

                // Streak
                let streak = 0;
                for (let i = 0; i < 31; i++) {
                    const d = new Date(); d.setDate(d.getDate() - i);
                    const key = `lumina_login_${d.toISOString().slice(0,10)}`;
                    const v = await AsyncStorage.getItem(key);
                    if (v) streak++; else break;
                }
                if (streak >= 3  && !earnedMap['streak_3'])  earnedMap['streak_3']  = new Date().toDateString();
                if (streak >= 7  && !earnedMap['streak_7'])  earnedMap['streak_7']  = new Date().toDateString();
                if (streak >= 30 && !earnedMap['streak_30']) earnedMap['streak_30'] = new Date().toDateString();

                await AsyncStorage.setItem('earned_badges', JSON.stringify(earnedMap));
            } catch (_) {}
        }

        // Map definitions to badge list
        const result: Badge[] = BADGE_DEFINITIONS.map(def => ({
            ...def,
            category: def.category as Badge['category'],
            earned: !!earnedMap[def.id],
            earnedDate: earnedMap[def.id],
        }));

        setBadges(result);
        setLoading(false);
    };

    const earnedCount = badges.filter(b => b.earned).length;
    const filtered = activeCategory === 'all' ? badges : badges.filter(b => b.category === activeCategory);

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0a0514', '#1a0b2e', '#0f0619']} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="white" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Achievements</Text>
                    <Text style={styles.headerSub}>{earnedCount}/{BADGE_DEFINITIONS.length} earned</Text>
                </View>
                <View style={{ width: 38 }} />
            </View>

            {/* Progress bar */}
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(earnedCount / BADGE_DEFINITIONS.length) * 100}%` }]} />
            </View>

            {/* Category filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
                {CATEGORIES.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => setActiveCategory(cat)}
                        style={[styles.catBtn, activeCategory === cat && styles.catBtnActive]}
                    >
                        <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Badge grid */}
            <ScrollView contentContainerStyle={styles.badgeGrid}>
                {loading ? (
                    <Text style={styles.loadingText}>Loading badges...</Text>
                ) : (
                    filtered.map(badge => (
                        <View key={badge.id} style={[styles.badgeCard, !badge.earned && styles.badgeCardLocked]}>
                            <View style={[styles.badgeIconWrap, badge.earned && { backgroundColor: badge.color + '22', borderColor: badge.color + '55' }]}>
                                <Text style={[styles.badgeEmoji, !badge.earned && { opacity: 0.25 }]}>{badge.emoji}</Text>
                                {badge.earned && (
                                    <View style={[styles.earnedDot, { backgroundColor: badge.color }]} />
                                )}
                            </View>
                            <Text style={[styles.badgeTitle, !badge.earned && styles.badgeTitleLocked]}>{badge.title}</Text>
                            <Text style={styles.badgeDesc} numberOfLines={2}>{badge.desc}</Text>
                            {badge.earned && badge.earnedDate && (
                                <Text style={[styles.badgeDate, { color: badge.color }]}>{badge.earnedDate}</Text>
                            )}
                            {!badge.earned && (
                                <View style={styles.lockIcon}>
                                    <Ionicons name="lock-closed" size={10} color="#4B5563" />
                                </View>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const CARD_W = (width - 48) / 3;

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
    backBtn: { width: 38, height: 38, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    headerCenter: { alignItems: 'center' },
    headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    headerSub: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
    progressBar: { height: 4, marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 16 },
    progressFill: { height: '100%', backgroundColor: '#A855F7', borderRadius: 2 },
    catRow: { paddingHorizontal: 20, gap: 8, marginBottom: 16 },
    catBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    catBtnActive: { backgroundColor: 'rgba(168,85,247,0.2)', borderColor: '#A855F7' },
    catText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
    catTextActive: { color: '#A855F7' },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, paddingBottom: 32 },
    badgeCard: { width: CARD_W, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 4 },
    badgeCardLocked: { opacity: 0.6 },
    badgeIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 4, position: 'relative' },
    badgeEmoji: { fontSize: 28 },
    earnedDot: { position: 'absolute', bottom: 0, right: 2, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#0a0514' },
    badgeTitle: { color: 'white', fontSize: 11, fontWeight: '700', textAlign: 'center' },
    badgeTitleLocked: { color: '#4B5563' },
    badgeDesc: { color: 'rgba(156,163,175,0.6)', fontSize: 9, textAlign: 'center', lineHeight: 13 },
    badgeDate: { fontSize: 9, fontWeight: '600' },
    lockIcon: { position: 'absolute', top: 8, right: 8 },
    loadingText: { color: '#6B7280', textAlign: 'center', marginTop: 60, width: '100%' },
});
