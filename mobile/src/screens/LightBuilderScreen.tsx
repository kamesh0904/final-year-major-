import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated,
    Dimensions, TextInput, ScrollView, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

// ─── Notification handler ─────────────────────────────────────────────────────
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// ─── Profile → recommended games  (mirrors backend game_router.py) ────────────
const GAMES_BY_PROFILE: Record<string, string[]> = {
    ADHD:       ['Chromatic Rush', 'Impulse Guard'],
    OCD:        ['Pattern Release', 'Order Shift'],
    ASD:        ['Sensory Flow', 'Emotion Match'],
    Anxiety:    ['Breath Sync', 'Calm Path'],
    Depression: ['Light Builder', 'Momentum Steps'],
    General:    ['Calm Path', 'Breath Sync'],
};

const PROFILE_EMOJI: Record<string, string> = {
    ADHD: '⚡', OCD: '🔄', ASD: '🌊', Anxiety: '🫁', Depression: '🌱', General: '🎮',
};

// ─── Buildings (11 total) ─────────────────────────────────────────────────────
const ELEMENTS = [
    { id: 1,  name: 'Street Lamp', cost: 50,    passive: 1,   icon: '🪔', color: '#FDE68A', glow: 'rgba(253,224,71,0.6)'  },
    { id: 2,  name: 'Cottage',     cost: 120,   passive: 2,   icon: '🏡', color: '#FCA5A5', glow: 'rgba(253,164,175,0.5)' },
    { id: 3,  name: 'Café',        cost: 300,   passive: 4,   icon: '☕', color: '#FED7AA', glow: 'rgba(253,186,116,0.5)' },
    { id: 4,  name: 'Library',     cost: 600,   passive: 6,   icon: '📚', color: '#67E8F9', glow: 'rgba(103,232,249,0.5)' },
    { id: 5,  name: 'Park',        cost: 1000,  passive: 10,  icon: '🎵', color: '#6EE7B7', glow: 'rgba(110,231,183,0.5)' },
    { id: 6,  name: 'Town Hall',   cost: 2000,  passive: 20,  icon: '🏛️', color: '#DDD6FE', glow: 'rgba(216,180,254,0.6)' },
    { id: 7,  name: 'Bakery',      cost: 4000,  passive: 35,  icon: '🥐', color: '#FDE68A', glow: 'rgba(251,191,36,0.5)'  },
    { id: 8,  name: 'Hospital',    cost: 7000,  passive: 55,  icon: '🏥', color: '#6EE7B7', glow: 'rgba(52,211,153,0.5)'  },
    { id: 9,  name: 'School',      cost: 12000, passive: 80,  icon: '🏫', color: '#93C5FD', glow: 'rgba(147,197,253,0.5)' },
    { id: 10, name: 'Market',      cost: 20000, passive: 110, icon: '🏪', color: '#FCA5A5', glow: 'rgba(249,115,22,0.4)'  },
    { id: 11, name: 'Cathedral',   cost: 35000, passive: 150, icon: '⛪', color: '#E9D5FF', glow: 'rgba(167,139,250,0.6)' },
];

type QuestId = 'daily_login' | 'play_profile_game' | 'breath_sync' | 'companion_chat' | 'personal_tasks';
interface Quest {
    id: QuestId;
    icon: string;
    title: string;
    desc: string;
    reward: number;
    completed: boolean;
    progress?: string;
}
type PersonalTask = { id: number; text: string; completed: boolean };

const getSkyColors = (pct: number): readonly [string, string, string] => {
    if (pct < 20) return ['#0F0726', '#1E0B3E', '#160B35'] as const;
    if (pct < 40) return ['#1E2B6B', '#4A1A6B', '#5C1832'] as const;
    if (pct < 60) return ['#1D5FA8', '#1A9BA8', '#D9834A'] as const;
    if (pct < 80) return ['#F97316', '#FB923C', '#FDE68A'] as const;
    return ['#38BDF8', '#7DD3FC', '#6EE7B7'] as const;
};

const TODAY = new Date().toISOString().slice(0, 10);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildQuests(profile: string): Quest[] {
    const games    = GAMES_BY_PROFILE[profile] ?? GAMES_BY_PROFILE['General'];
    const emoji    = PROFILE_EMOJI[profile]    ?? '🎮';
    const gameList = games.join(' / ');
    return [
        { id: 'daily_login',     icon: '📅', title: 'Daily Login',          desc: 'Open NeuroNest today',                      reward: 50,  completed: false },
        { id: 'play_profile_game',icon: emoji, title: `Play ${profile} Game`,desc: `Play ${gameList} for 2+ minutes`,            reward: 100, completed: false, progress: '0:00 / 2:00' },
        { id: 'breath_sync',     icon: '🫁', title: 'Breath Sync Session',  desc: 'Complete a Breath Sync session',             reward: 10,  completed: false },
        { id: 'companion_chat',  icon: '💬', title: 'Talk to Companion',    desc: 'Send a message to your AI companion',        reward: 20,  completed: false },
        { id: 'personal_tasks',  icon: '✅', title: 'Complete a Task',      desc: 'Finish a personal task (+100 each)',         reward: 100, completed: false },
    ];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LightBuilderScreen({ navigation }: any) {
    const { user } = useAuth();

    const [energy, setEnergy]             = useState(0);
    const [unlockedIds, setUnlockedIds]   = useState<number[]>([]);
    const [passiveRate, setPassiveRate]   = useState(0);
    const [isWon, setIsWon]               = useState(false);
    const [userProfile, setUserProfile]   = useState('General');
    const [quests, setQuests]             = useState<Quest[]>(buildQuests('General'));
    const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([]);
    const [taskInput, setTaskInput]       = useState('');
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [clickEffects, setClickEffects] = useState<{ id: number; val: number; label: string }[]>([]);
    const [notifGranted, setNotifGranted] = useState(false);

    const sunScale   = useRef(new Animated.Value(1)).current;
    const winOpacity = useRef(new Animated.Value(0)).current;

    const progress        = (unlockedIds.length / ELEMENTS.length) * 100;
    const skyColors       = getSkyColors(progress);
    const completedQuests = quests.filter(q => q.completed).length;

    // ─── Init ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        requestNotifPermission().then(g => setNotifGranted(g));
        loadProfileAndCheckQuests();
    }, [user?.id]);

    // ─── Passive income ───────────────────────────────────────────────────────
    useEffect(() => {
        if (isWon || passiveRate === 0) return;
        const t = setInterval(() => setEnergy(e => e + passiveRate), 1000);
        return () => clearInterval(t);
    }, [passiveRate, isWon]);

    // ─── Win detection ────────────────────────────────────────────────────────
    useEffect(() => {
        if (unlockedIds.length === ELEMENTS.length && !isWon) {
            setIsWon(true);
            Animated.timing(winOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
            Notifications.cancelAllScheduledNotificationsAsync();
        }
    }, [unlockedIds]);

    // ─── Schedule notifications when quests change ────────────────────────────
    useEffect(() => {
        if (!notifGranted || isWon) return;
        const allDone = quests.every(q => q.completed);
        if (allDone) {
            Notifications.cancelAllScheduledNotificationsAsync();
        } else {
            scheduleReminders(quests);
        }
    }, [quests, notifGranted, isWon]);

    // ─── Notification helpers ─────────────────────────────────────────────────
    const requestNotifPermission = async () => {
        if (!Device.isDevice) return false;
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'granted') return true;
        const { status: asked } = await Notifications.requestPermissionsAsync();
        return asked === 'granted';
    };

    const scheduleReminders = async (currentQuests: Quest[]) => {
        await Notifications.cancelAllScheduledNotificationsAsync();
        const incomplete = currentQuests.filter(q => !q.completed);
        if (incomplete.length === 0) return;
        const body = `${incomplete.length} quest${incomplete.length > 1 ? 's' : ''} waiting — restore the light! 🌟`;
        for (let i = 1; i <= 4; i++) {
            await Notifications.scheduleNotificationAsync({
                content: { title: 'NeuroNest — Light Builder', body, sound: true },
                trigger: { seconds: i * 3 * 60 * 60, repeats: false } as any,
            });
        }
    };

    // ─── Load user profile → build quests → check completion ─────────────────
    const loadProfileAndCheckQuests = async () => {
        let profile = 'General';
        if (user?.id) {
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('primary_profile')
                    .eq('id', user.id)
                    .single();
                if (data?.primary_profile) profile = data.primary_profile;
            } catch (_) {}
        }
        setUserProfile(profile);
        const fresh = buildQuests(profile);
        const { updated, gained } = await evaluateQuests(fresh, profile);
        if (gained > 0) awardLumens(gained, `+${gained}⚡ Daily Quests!`);
        setQuests(updated);
    };

    // ─── Evaluate quests against Supabase ────────────────────────────────────
    const evaluateQuests = async (questList: Quest[], profile: string) => {
        const updated = questList.map(q => ({ ...q }));
        const profileGames = GAMES_BY_PROFILE[profile] ?? GAMES_BY_PROFILE['General'];
        let gained = 0;

        if (!user?.id) return { updated, gained };

        const todayStart = `${TODAY}T00:00:00`;

        // 1. Daily login
        const loginKey = `lumina_login_${TODAY}`;
        const alreadyLoggedIn = await AsyncStorage.getItem(loginKey);
        const loginQ = updated.find(q => q.id === 'daily_login')!;
        if (!alreadyLoggedIn) {
            await AsyncStorage.setItem(loginKey, '1');
            if (!loginQ.completed) { loginQ.completed = true; gained += loginQ.reward; }
        } else {
            loginQ.completed = true;
        }

        // 2. Play recommended game for this profile >= 2 min today
        try {
            const { data: sessions } = await supabase
                .from('game_sessions')
                .select('game_name, duration_seconds')
                .eq('user_id', user.id)
                .gte('created_at', todayStart)
                .in('game_name', profileGames);

            const gameQ = updated.find(q => q.id === 'play_profile_game')!;
            if (sessions && sessions.length > 0) {
                const maxDur = Math.max(...sessions.map(s => s.duration_seconds ?? 0));
                const mins   = Math.floor(maxDur / 60);
                const secs   = maxDur % 60;
                gameQ.progress = `${mins}:${String(secs).padStart(2, '0')} / 2:00`;
                if (maxDur >= 120 && !gameQ.completed) {
                    gameQ.completed = true;
                    gained += gameQ.reward;
                }
            }
        } catch (_) {}

        // 3. Breath Sync today
        try {
            const { data: bsData } = await supabase
                .from('game_sessions')
                .select('id')
                .eq('user_id', user.id)
                .eq('game_name', 'Breath Sync')
                .gte('created_at', todayStart)
                .limit(1);
            const bsQ = updated.find(q => q.id === 'breath_sync')!;
            if (bsData && bsData.length > 0 && !bsQ.completed) {
                bsQ.completed = true;
                gained += bsQ.reward;
            }
        } catch (_) {}

        // 4. Companion chat today
        try {
            const { data: chatData } = await supabase
                .from('chat_messages')
                .select('id')
                .eq('user_id', user.id)
                .eq('role', 'user')
                .gte('created_at', todayStart)
                .limit(1);
            const chatQ = updated.find(q => q.id === 'companion_chat')!;
            if (chatData && chatData.length > 0 && !chatQ.completed) {
                chatQ.completed = true;
                gained += chatQ.reward;
            }
        } catch (_) {}

        return { updated, gained };
    };

    // ─── Award lumens with floating label ────────────────────────────────────
    const awardLumens = (amount: number, label: string) => {
        setEnergy(e => e + amount);
        const id = Date.now();
        setClickEffects(prev => [...prev, { id, val: amount, label }]);
        setTimeout(() => setClickEffects(prev => prev.filter(x => x.id !== id)), 2200);
    };

    // ─── Complete personal task ───────────────────────────────────────────────
    const completePersonalTask = (taskId: number) => {
        let gained = 0;
        setPersonalTasks(prev => prev.map(t => {
            if (t.id === taskId && !t.completed) { gained = 100; return { ...t, completed: true }; }
            return t;
        }));
        if (gained > 0) {
            awardLumens(gained, '+100⚡ Task Done!');
            setQuests(prev => prev.map(q =>
                q.id === 'personal_tasks' ? { ...q, completed: true } : q
            ));
        }
    };

    const addPersonalTask = () => {
        if (taskInput.trim() && personalTasks.length < 5) {
            setPersonalTasks(prev => [...prev, { id: Date.now(), text: taskInput.trim(), completed: false }]);
            setTaskInput('');
        }
    };

    // ─── Unlock building ──────────────────────────────────────────────────────
    const unlockElement = (el: typeof ELEMENTS[0]) => {
        if (energy < el.cost || unlockedIds.includes(el.id)) return;
        setEnergy(e => e - el.cost);
        setUnlockedIds(prev => [...prev, el.id]);
        setPassiveRate(r => r + el.passive);
        Animated.sequence([
            Animated.timing(sunScale, { toValue: 1.15, duration: 200, useNativeDriver: true }),
            Animated.spring(sunScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
        ]).start();
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <LinearGradient colors={skyColors} style={StyleSheet.absoluteFill} />

            {/* HUD */}
            <View style={styles.hud}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
                <View style={styles.centerHud}>
                    <Text style={styles.hudTitle}>✨ Light Builder</Text>
                    <Text style={styles.hudSub}>{completedQuests}/{quests.length} quests · {unlockedIds.length}/{ELEMENTS.length} buildings</Text>
                </View>
                <View style={styles.energyPill}>
                    <View style={styles.energyDot} />
                    <Text style={styles.energyNum}>{energy}</Text>
                    <Text style={styles.lumLabel}>⚡</Text>
                </View>
            </View>

            {passiveRate > 0 && (
                <Text style={styles.passiveTag}>+{passiveRate}/s passive income</Text>
            )}

            {/* Quest Panel */}
            <View style={styles.questPanel}>
                <Text style={styles.questPanelTitle}>
                    {userProfile} Daily Quests — earn Lumens by using NeuroNest
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.questRow}>
                    {quests.map(q => (
                        <View key={q.id} style={[styles.questCard, q.completed && styles.questCardDone]}>
                            <Text style={styles.questIcon}>{q.icon}</Text>
                            <Text style={[styles.questTitle, q.completed && styles.questTitleDone]} numberOfLines={2}>
                                {q.title}
                            </Text>
                            {q.progress && !q.completed && (
                                <Text style={styles.questProgress}>{q.progress}</Text>
                            )}
                            <Text style={[styles.questReward, q.completed && styles.questRewardDone]}>
                                {q.completed ? '✓ Done' : `+${q.reward}⚡`}
                            </Text>
                            {!q.completed && q.id === 'personal_tasks' && (
                                <TouchableOpacity onPress={() => setShowTaskModal(true)} style={styles.questBtn}>
                                    <Text style={styles.questBtnText}>Add Task</Text>
                                </TouchableOpacity>
                            )}
                            {!q.completed && q.id === 'play_profile_game' && (
                                <TouchableOpacity onPress={() => navigation.navigate('Games')} style={styles.questBtn}>
                                    <Text style={styles.questBtnText}>Go Play</Text>
                                </TouchableOpacity>
                            )}
                            {!q.completed && q.id === 'breath_sync' && (
                                <TouchableOpacity onPress={() => navigation.navigate('BreathSync')} style={styles.questBtn}>
                                    <Text style={styles.questBtnText}>Open</Text>
                                </TouchableOpacity>
                            )}
                            {!q.completed && q.id === 'companion_chat' && (
                                <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.questBtn}>
                                    <Text style={styles.questBtnText}>Chat Now</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </ScrollView>
                <View style={styles.overallBar}>
                    <View style={[styles.overallFill, { width: `${(completedQuests / quests.length) * 100}%` }]} />
                </View>
            </View>

            {/* Decorative world */}
            <View style={styles.worldMap} pointerEvents="none">
                <View style={[styles.land, { height: height * 0.18, backgroundColor: '#160B35', opacity: 0.6 }]} />
                <View style={[styles.land, { height: height * 0.13, backgroundColor: '#1A0938', opacity: 0.75 }]} />
                <View style={[styles.land, { height: height * 0.09, backgroundColor: progress > 50 ? '#1A3A2A' : '#0A0A14' }]} />
                <Animated.View style={[styles.sun, { top: height * (0.52 - progress * 0.0025), transform: [{ scale: sunScale }] }]}>
                    <Text style={{ fontSize: 60 }}>☀️</Text>
                </Animated.View>
            </View>

            {/* Award effects */}
            {clickEffects.map(e => (
                <View key={e.id} style={styles.award} pointerEvents="none">
                    <Text style={styles.awardText}>{e.label}</Text>
                </View>
            ))}

            {/* Buildings grid */}
            <ScrollView style={styles.buildingsScroll} contentContainerStyle={styles.buildingsGrid}>
                {ELEMENTS.map(el => {
                    const isUnlocked = unlockedIds.includes(el.id);
                    const canAfford  = energy >= el.cost;
                    return (
                        <TouchableOpacity
                            key={el.id}
                            onPress={() => unlockElement(el)}
                            disabled={isUnlocked}
                            activeOpacity={0.7}
                            style={[
                                styles.building,
                                isUnlocked && { borderColor: el.glow, backgroundColor: 'rgba(255,255,255,0.1)' },
                                !isUnlocked && canAfford && { borderColor: '#FBBF24', borderWidth: 1.5 },
                            ]}
                        >
                            <Text style={[styles.buildingIcon, !isUnlocked && { opacity: 0.3 }]}>{el.icon}</Text>
                            <Text style={[styles.buildingName, { color: isUnlocked ? el.color : '#6B7280' }]} numberOfLines={1}>
                                {el.name}
                            </Text>
                            {isUnlocked
                                ? <Text style={styles.buildingPassive}>+{el.passive}/s</Text>
                                : <Text style={[styles.buildingCost, { color: canAfford ? '#FBBF24' : '#4B5563' }]}>{el.cost}⚡</Text>
                            }
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Personal task modal */}
            <Modal visible={showTaskModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>📝 Personal Tasks</Text>
                        <Text style={styles.modalSub}>Tap a task to complete it and earn +100 Lumens each.</Text>
                        <ScrollView style={{ maxHeight: 150, marginBottom: 12 }}>
                            {personalTasks.map(t => (
                                <TouchableOpacity
                                    key={t.id}
                                    onPress={() => completePersonalTask(t.id)}
                                    disabled={t.completed}
                                    style={[styles.taskRow, t.completed && styles.taskRowDone]}
                                >
                                    <View style={[styles.taskCircle, t.completed && styles.taskCircleDone]}>
                                        {t.completed && <Ionicons name="checkmark" size={10} color="white" />}
                                    </View>
                                    <Text style={[styles.taskText, t.completed && styles.taskTextDone]} numberOfLines={1}>{t.text}</Text>
                                    {!t.completed && <Text style={styles.taskHint}>tap ✓</Text>}
                                </TouchableOpacity>
                            ))}
                            {personalTasks.length === 0 && (
                                <Text style={styles.emptyTasks}>No tasks yet. Add up to 5 below.</Text>
                            )}
                        </ScrollView>
                        {personalTasks.length < 5 && (
                            <View style={styles.addTaskRow}>
                                <TextInput
                                    style={styles.taskInput}
                                    value={taskInput}
                                    onChangeText={setTaskInput}
                                    placeholder="Add a task..."
                                    placeholderTextColor="#6B7280"
                                    onSubmitEditing={addPersonalTask}
                                    returnKeyType="done"
                                />
                                <TouchableOpacity onPress={addPersonalTask} style={styles.addBtn}>
                                    <Ionicons name="add" size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        )}
                        <TouchableOpacity onPress={() => setShowTaskModal(false)} style={styles.modalClose}>
                            <Text style={styles.modalCloseText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Win overlay */}
            {isWon && (
                <Animated.View style={[styles.winOverlay, { opacity: winOpacity }]}>
                    <Text style={{ fontSize: 72, marginBottom: 16 }}>😊</Text>
                    <Text style={styles.winTitle}>Town Fully Restored!</Text>
                    <Text style={styles.winSub}>All 11 buildings unlocked. You brought light back to the world.</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.winBtn}>
                        <LinearGradient colors={['#FBBF24', '#F59E0B'] as const} style={styles.winBtnGrad}>
                            <Text style={styles.winBtnText}>Continue Journey</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    hud: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 6, zIndex: 20 },
    closeBtn: { width: 36, height: 36, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    centerHud: { alignItems: 'center' },
    hudTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    hudSub: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 1 },
    energyPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 4, borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)' },
    energyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FBBF24' },
    energyNum: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    lumLabel: { fontSize: 14 },
    passiveTag: { textAlign: 'center', color: '#6EE7B7', fontSize: 10, fontWeight: '600', marginBottom: 4, zIndex: 20 },
    // Quests
    questPanel: { zIndex: 20, paddingHorizontal: 10, marginBottom: 4 },
    questPanelTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, paddingLeft: 4 },
    questRow: { gap: 8, paddingRight: 8 },
    questCard: { backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 14, padding: 10, width: 120, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', gap: 3 },
    questCardDone: { backgroundColor: 'rgba(110,231,183,0.08)', borderColor: 'rgba(110,231,183,0.3)' },
    questIcon: { fontSize: 22 },
    questTitle: { color: 'white', fontSize: 11, fontWeight: '700', textAlign: 'center' },
    questTitleDone: { color: '#6EE7B7' },
    questProgress: { color: '#FBBF24', fontSize: 10 },
    questReward: { color: '#FBBF24', fontSize: 11, fontWeight: '600' },
    questRewardDone: { color: '#6EE7B7' },
    questBtn: { backgroundColor: 'rgba(139,92,246,0.3)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)', marginTop: 2 },
    questBtnText: { color: '#DDD6FE', fontSize: 10, fontWeight: '700' },
    overallBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
    overallFill: { height: '100%', backgroundColor: '#FBBF24', borderRadius: 2 },
    // World
    worldMap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
    land: { position: 'absolute', bottom: 0, left: 0, right: 0 },
    sun: { position: 'absolute', alignSelf: 'center', left: width / 2 - 30 },
    // Award
    award: { position: 'absolute', top: height * 0.38, left: 0, right: 0, alignItems: 'center', zIndex: 50 },
    awardText: { color: '#FDE68A', fontWeight: 'bold', fontSize: 20, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
    // Buildings
    buildingsScroll: { flex: 1, zIndex: 10 },
    buildingsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingBottom: 16, gap: 7, justifyContent: 'center' },
    building: { width: (width - 60) / 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', gap: 2 },
    buildingIcon: { fontSize: 22 },
    buildingName: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
    buildingPassive: { fontSize: 9, color: '#6EE7B7', fontWeight: '600' },
    buildingCost: { fontSize: 9, fontWeight: '600' },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalCard: { backgroundColor: '#14101E', borderRadius: 24, padding: 22, width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modalTitle: { color: 'white', fontWeight: 'bold', fontSize: 18, marginBottom: 4 },
    modalSub: { color: '#9CA3AF', fontSize: 12, marginBottom: 14, lineHeight: 18 },
    taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, paddingHorizontal: 4, borderRadius: 10 },
    taskRowDone: { backgroundColor: 'rgba(110,231,183,0.1)' },
    taskCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#6B7280', justifyContent: 'center', alignItems: 'center' },
    taskCircleDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
    taskText: { color: 'white', fontSize: 13, flex: 1 },
    taskTextDone: { textDecorationLine: 'line-through', color: '#6EE7B7' },
    taskHint: { color: '#4B5563', fontSize: 10 },
    emptyTasks: { color: '#4B5563', fontSize: 13, textAlign: 'center', padding: 16 },
    addTaskRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    taskInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10, color: 'white', fontSize: 14 },
    addBtn: { backgroundColor: 'rgba(139,92,246,0.3)', borderRadius: 12, padding: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)' },
    modalClose: { marginTop: 14, alignItems: 'center', paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14 },
    modalCloseText: { color: '#9CA3AF', fontWeight: '600', fontSize: 15 },
    // Win
    winOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', zIndex: 60, padding: 32 },
    winTitle: { color: 'white', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    winSub: { color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
    winBtn: { borderRadius: 24, overflow: 'hidden' },
    winBtnGrad: { paddingHorizontal: 36, paddingVertical: 14 },
    winBtnText: { color: '#78350F', fontWeight: 'bold', fontSize: 17 },
});
