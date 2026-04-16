import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated,
    Dimensions, TextInput, ScrollView, Modal, Platform, Alert,
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
    ADHD: ['Chromatic Rush', 'Impulse Guard'],
    OCD: ['Pattern Release', 'Order Shift'],
    ASD: ['Sensory Flow', 'Emotion Match'],
    Anxiety: ['Breath Sync', 'Calm Path'],
    Depression: ['Light Builder', 'Momentum Steps'],
    General: ['Calm Path', 'Breath Sync'],
};

const PROFILE_EMOJI: Record<string, string> = {
    ADHD: '⚡', OCD: '🔄', ASD: '🌊', Anxiety: '🫁', Depression: '🌱', General: '🎮',
};

// ─── Buildings (11 total) ─────────────────────────────────────────────────────
const ELEMENTS = [
    { id: 1, name: 'Street Lamp', cost: 50, passive: 1, icon: '🪔', color: '#FDE68A', glow: 'rgba(253,224,71,0.6)' },
    { id: 2, name: 'Cottage', cost: 120, passive: 2, icon: '🏡', color: '#FCA5A5', glow: 'rgba(253,164,175,0.5)' },
    { id: 3, name: 'Café', cost: 300, passive: 4, icon: '☕', color: '#FED7AA', glow: 'rgba(253,186,116,0.5)' },
    { id: 4, name: 'Library', cost: 600, passive: 6, icon: '📚', color: '#67E8F9', glow: 'rgba(103,232,249,0.5)' },
    { id: 5, name: 'Park', cost: 1000, passive: 10, icon: '🎵', color: '#6EE7B7', glow: 'rgba(110,231,183,0.5)' },
    { id: 6, name: 'Town Hall', cost: 2000, passive: 20, icon: '🏛️', color: '#DDD6FE', glow: 'rgba(216,180,254,0.6)' },
    { id: 7, name: 'Bakery', cost: 4000, passive: 35, icon: '🥐', color: '#FDE68A', glow: 'rgba(251,191,36,0.5)' },
    { id: 8, name: 'Hospital', cost: 7000, passive: 55, icon: '🏥', color: '#6EE7B7', glow: 'rgba(52,211,153,0.5)' },
    { id: 9, name: 'School', cost: 12000, passive: 80, icon: '🏫', color: '#93C5FD', glow: 'rgba(147,197,253,0.5)' },
    { id: 10, name: 'Market', cost: 20000, passive: 110, icon: '🏪', color: '#FCA5A5', glow: 'rgba(249,115,22,0.4)' },
    { id: 11, name: 'Cathedral', cost: 35000, passive: 150, icon: '⛪', color: '#E9D5FF', glow: 'rgba(167,139,250,0.6)' },
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
type PersonalTask = { id: number; text: string; completed: boolean; dueTime?: string; notifId?: string };

// Points scale: 1st=100, 2nd=150, 3rd=200, 4th=250, 5th=300 (max 5 rewarded)
const TASK_POINTS = [100, 150, 200, 250, 300];
const TASKS_STORAGE_KEY = 'lumina_tasks_v2';
const TASKS_DATE_KEY = 'lumina_tasks_date';

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
    const games = GAMES_BY_PROFILE[profile] ?? GAMES_BY_PROFILE['General'];
    const emoji = PROFILE_EMOJI[profile] ?? '🎮';
    const gameList = games.join(' / ');
    return [
        { id: 'daily_login', icon: '📅', title: 'Daily Login', desc: 'Open NeuroNest today', reward: 50, completed: false },
        { id: 'play_profile_game', icon: emoji, title: `Play ${profile} Game`, desc: `Play ${gameList} for 2+ minutes`, reward: 100, completed: false, progress: '0:00 / 2:00' },
        { id: 'breath_sync', icon: '🫁', title: 'Breath Sync Session', desc: 'Complete a Breath Sync session', reward: 10, completed: false },
        { id: 'companion_chat', icon: '💬', title: 'Talk to Companion', desc: 'Send a message to your AI companion', reward: 20, completed: false },
        { id: 'personal_tasks', icon: '✅', title: 'Complete a Task', desc: 'Finish a personal task (+100 each)', reward: 100, completed: false },
    ];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LightBuilderScreen({ navigation }: any) {
    const { user } = useAuth();

    const [energy, setEnergy] = useState(0);
    const [unlockedIds, setUnlockedIds] = useState<number[]>([]);
    const [passiveRate, setPassiveRate] = useState(0);
    const [isWon, setIsWon] = useState(false);
    const [userProfile, setUserProfile] = useState('General');
    const [quests, setQuests] = useState<Quest[]>(buildQuests('General'));
    const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([]);
    const [taskInput, setTaskInput] = useState('');
    const [taskDueHour, setTaskDueHour] = useState('');
    const [taskDueMin, setTaskDueMin] = useState('');
    const [showTimeInput, setShowTimeInput] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [clickEffects, setClickEffects] = useState<{ id: number; val: number; label: string }[]>([]);
    const [notifGranted, setNotifGranted] = useState(false);
    const [rewardedCount, setRewardedCount] = useState(0);

    const sunScale = useRef(new Animated.Value(1)).current;
    const winOpacity = useRef(new Animated.Value(0)).current;

    const progress = (unlockedIds.length / ELEMENTS.length) * 100;
    const skyColors = getSkyColors(progress);
    const completedQuests = quests.filter(q => q.completed).length;

    // ─── Init ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        requestNotifPermission().then(g => setNotifGranted(g));
        loadProfileAndCheckQuests();
        loadPersistedTasks();
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
            } catch (_) { }
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
                const mins = Math.floor(maxDur / 60);
                const secs = maxDur % 60;
                gameQ.progress = `${mins}:${String(secs).padStart(2, '0')} / 2:00`;
                if (maxDur >= 120 && !gameQ.completed) {
                    gameQ.completed = true;
                    gained += gameQ.reward;
                }
            }
        } catch (_) { }

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
        } catch (_) { }

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
        } catch (_) { }

        return { updated, gained };
    };

    // ─── Persist tasks to AsyncStorage ───────────────────────────────────────
    const saveTasksToStorage = async (tasks: PersonalTask[], rewarded: number) => {
        await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
        await AsyncStorage.setItem(TASKS_DATE_KEY, JSON.stringify({ date: TODAY, rewarded }));
    };

    // ─── Load persisted tasks (reset if new day) ──────────────────────────────
    const loadPersistedTasks = async () => {
        try {
            const dateRaw = await AsyncStorage.getItem(TASKS_DATE_KEY);
            const tasksRaw = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
            if (dateRaw && tasksRaw) {
                const { date, rewarded } = JSON.parse(dateRaw);
                if (date === TODAY) {
                    setPersonalTasks(JSON.parse(tasksRaw));
                    setRewardedCount(rewarded ?? 0);
                    return;
                }
            }
            // New day — clear tasks
            await AsyncStorage.removeItem(TASKS_STORAGE_KEY);
            await AsyncStorage.removeItem(TASKS_DATE_KEY);
        } catch (_) { }
    };

    // ─── Award lumens with floating label ────────────────────────────────────
    const awardLumens = (amount: number, label: string) => {
        setEnergy(e => e + amount);
        const id = Date.now();
        setClickEffects(prev => [...prev, { id, val: amount, label }]);
        setTimeout(() => setClickEffects(prev => prev.filter(x => x.id !== id)), 2200);
    };

    // ─── Complete personal task (escalating points, max 5 rewarded) ──────────
    const completePersonalTask = (taskId: number) => {
        setPersonalTasks(prev => {
            const updated = prev.map(t => t.id === taskId && !t.completed ? { ...t, completed: true } : t);
            const completedNow = updated.find(t => t.id === taskId);
            if (completedNow?.completed && !prev.find(t => t.id === taskId)?.completed) {
                // Count how many were already rewarded
                setRewardedCount(rc => {
                    if (rc < 5) {
                        const pts = TASK_POINTS[rc];
                        awardLumens(pts, `+${pts}⚡ Task ${rc + 1} Done!`);
                        const newRc = rc + 1;
                        saveTasksToStorage(updated, newRc);
                        if (newRc >= 1) {
                            setQuests(q => q.map(quest =>
                                quest.id === 'personal_tasks' ? { ...quest, completed: true } : quest
                            ));
                        }
                        return newRc;
                    }
                    saveTasksToStorage(updated, rc);
                    return rc;
                });
            }
            return updated;
        });
    };

    // ─── Schedule a due-time notification for a task ──────────────────────────
    const scheduleTaskNotif = async (taskText: string, hour: number, min: number): Promise<string | undefined> => {
        if (!notifGranted) return undefined;
        try {
            const now = new Date();
            const due = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, min, 0);
            if (due <= now) return undefined; // time already passed today
            const seconds = Math.floor((due.getTime() - now.getTime()) / 1000);
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: '⏰ Task Reminder',
                    body: `Time to do: ${taskText}`,
                    sound: true,
                },
                trigger: { seconds, repeats: false } as any,
            });
            return id;
        } catch (_) {
            return undefined;
        }
    };

    const addPersonalTask = async () => {
        if (!taskInput.trim()) return;
        let dueTime: string | undefined;
        let notifId: string | undefined;

        if (showTimeInput && taskDueHour && taskDueMin) {
            const h = parseInt(taskDueHour, 10);
            const m = parseInt(taskDueMin, 10);
            if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
                dueTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                notifId = await scheduleTaskNotif(taskInput.trim(), h, m);
            } else {
                Alert.alert('Invalid time', 'Please enter a valid hour (0-23) and minute (0-59).');
                return;
            }
        }

        const newTask: PersonalTask = {
            id: Date.now(),
            text: taskInput.trim(),
            completed: false,
            dueTime,
            notifId,
        };
        setPersonalTasks(prev => {
            const updated = [...prev, newTask];
            saveTasksToStorage(updated, rewardedCount);
            return updated;
        });
        setTaskInput('');
        setTaskDueHour('');
        setTaskDueMin('');
        setShowTimeInput(false);
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
                    <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
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
                <View style={styles.passiveRow}>
                    <Ionicons name="trending-up" size={12} color="#6EE7B7" />
                    <Text style={styles.passiveTag}>+{passiveRate}/s passive income</Text>
                </View>
            )}

            {/* Quest Panel */}
            <View style={styles.questPanel}>
                <Text style={styles.questPanelTitle}>
                    {userProfile} Daily Quests
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
                            <View style={[styles.questRewardPill, q.completed && styles.questRewardPillDone]}>
                                <Text style={[styles.questReward, q.completed && styles.questRewardDone]}>
                                    {q.completed ? '✓ Done' : `+${q.reward}⚡`}
                                </Text>
                            </View>
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
                    <LinearGradient colors={['#FBBF24', '#F59E0B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.overallFill, { width: `${(completedQuests / quests.length) * 100}%` }]} />
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
                    const canAfford = energy >= el.cost;
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
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>📝 Personal Tasks</Text>
                            <View style={styles.rewardBadge}>
                                <Text style={styles.rewardBadgeText}>{rewardedCount}/5 rewarded</Text>
                            </View>
                        </View>
                        <Text style={styles.modalSub}>
                            Complete tasks to earn Lumens. Points increase with each task:{'\n'}
                            1st=100⚡ · 2nd=150⚡ · 3rd=200⚡ · 4th=250⚡ · 5th=300⚡
                        </Text>

                        <ScrollView style={{ maxHeight: 200, marginBottom: 12 }}>
                            {personalTasks.map((t, idx) => {
                                const completedBefore = personalTasks.slice(0, idx).filter(x => x.completed).length;
                                const pts = completedBefore < 5 ? TASK_POINTS[completedBefore] : 0;
                                return (
                                    <TouchableOpacity
                                        key={t.id}
                                        onPress={() => completePersonalTask(t.id)}
                                        disabled={t.completed}
                                        style={[styles.taskRow, t.completed && styles.taskRowDone]}
                                    >
                                        <View style={[styles.taskCircle, t.completed && styles.taskCircleDone]}>
                                            {t.completed && <Ionicons name="checkmark" size={12} color="white" />}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.taskText, t.completed && styles.taskTextDone]} numberOfLines={1}>
                                                {t.text}
                                            </Text>
                                            {t.dueTime && (
                                                <Text style={styles.taskDueTime}>
                                                    <Ionicons name="time-outline" size={11} color="#FBBF24" /> {t.dueTime}
                                                </Text>
                                            )}
                                        </View>
                                        {!t.completed && (
                                            <Text style={styles.taskPts}>
                                                {rewardedCount < 5 ? `+${pts}⚡` : '—'}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                            {personalTasks.length === 0 && (
                                <Text style={styles.emptyTasks}>No tasks yet. Add some below.</Text>
                            )}
                        </ScrollView>

                        {/* Add task input */}
                        <View style={styles.addTaskRow}>
                            <TextInput
                                style={styles.taskInput}
                                value={taskInput}
                                onChangeText={setTaskInput}
                                placeholder="Add a task..."
                                placeholderTextColor="#6B7280"
                                returnKeyType="done"
                            />
                            <TouchableOpacity
                                onPress={() => setShowTimeInput(v => !v)}
                                style={[styles.timeToggleBtn, showTimeInput && styles.timeToggleBtnActive]}
                            >
                                <Ionicons name="time-outline" size={18} color={showTimeInput ? '#FBBF24' : '#9CA3AF'} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={addPersonalTask} style={styles.addBtn}>
                                <Ionicons name="add" size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        {/* Optional time picker */}
                        {showTimeInput && (
                            <View style={styles.timeRow}>
                                <Ionicons name="alarm-outline" size={16} color="#FBBF24" />
                                <Text style={styles.timeLabel}>Due at</Text>
                                <TextInput
                                    style={styles.timeInput}
                                    value={taskDueHour}
                                    onChangeText={setTaskDueHour}
                                    placeholder="HH"
                                    placeholderTextColor="#4B5563"
                                    keyboardType="number-pad"
                                    maxLength={2}
                                />
                                <Text style={styles.timeColon}>:</Text>
                                <TextInput
                                    style={styles.timeInput}
                                    value={taskDueMin}
                                    onChangeText={setTaskDueMin}
                                    placeholder="MM"
                                    placeholderTextColor="#4B5563"
                                    keyboardType="number-pad"
                                    maxLength={2}
                                />
                                <Text style={styles.timeHint}>24h · notif when due</Text>
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
    hud: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 10, zIndex: 20 },
    closeBtn: { width: 40, height: 40, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    centerHud: { alignItems: 'center' },
    hudTitle: { color: 'white', fontWeight: '800', fontSize: 18, letterSpacing: 0.3 },
    hudSub: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2, fontWeight: '500' },
    energyPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 24, paddingHorizontal: 14, paddingVertical: 8, gap: 6, borderWidth: 1, borderColor: 'rgba(251,191,36,0.5)' },
    energyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FBBF24' },
    energyNum: { color: 'white', fontWeight: '800', fontSize: 20 },
    lumLabel: { fontSize: 14 },
    passiveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 6, zIndex: 20 },
    passiveTag: { color: '#6EE7B7', fontSize: 12, fontWeight: '700' },
    // Quests
    questPanel: { zIndex: 20, paddingHorizontal: 14, marginBottom: 8 },
    questPanelTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingLeft: 2 },
    questRow: { gap: 10, paddingRight: 10 },
    questCard: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: 14, width: 140, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', gap: 6 },
    questCardDone: { backgroundColor: 'rgba(110,231,183,0.12)', borderColor: 'rgba(110,231,183,0.4)' },
    questIcon: { fontSize: 26 },
    questTitle: { color: 'white', fontSize: 12, fontWeight: '700', textAlign: 'center' },
    questTitleDone: { color: '#6EE7B7' },
    questProgress: { color: '#FBBF24', fontSize: 11, fontWeight: '600' },
    questRewardPill: { backgroundColor: 'rgba(251,191,36,0.15)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)' },
    questRewardPillDone: { backgroundColor: 'rgba(110,231,183,0.15)', borderColor: 'rgba(110,231,183,0.3)' },
    questReward: { color: '#FBBF24', fontSize: 12, fontWeight: '800' },
    questRewardDone: { color: '#6EE7B7' },
    questBtn: { backgroundColor: 'rgba(139,92,246,0.3)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(139,92,246,0.5)', marginTop: 2 },
    questBtnText: { color: '#DDD6FE', fontSize: 11, fontWeight: '700' },
    overallBar: { height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
    overallFill: { height: '100%', borderRadius: 3 },
    // World
    worldMap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
    land: { position: 'absolute', bottom: 0, left: 0, right: 0 },
    sun: { position: 'absolute', alignSelf: 'center', left: width / 2 - 30 },
    // Award
    award: { position: 'absolute', top: height * 0.38, left: 0, right: 0, alignItems: 'center', zIndex: 50 },
    awardText: { color: '#FDE68A', fontWeight: 'bold', fontSize: 22, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
    // Buildings
    buildingsScroll: { flex: 1, zIndex: 10 },
    buildingsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, paddingBottom: 24, gap: 10, justifyContent: 'center' },
    building: { width: (width - 56) / 3, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 20, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 5 },
    buildingIcon: { fontSize: 28 },
    buildingName: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
    buildingPassive: { fontSize: 11, color: '#6EE7B7', fontWeight: '800' },
    buildingCost: { fontSize: 11, fontWeight: '800' },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalCard: { backgroundColor: '#14101E', borderRadius: 28, padding: 24, width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    modalTitle: { color: 'white', fontWeight: 'bold', fontSize: 20 },
    rewardBadge: { backgroundColor: 'rgba(251,191,36,0.15)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)' },
    rewardBadgeText: { color: '#FBBF24', fontSize: 12, fontWeight: '700' },
    modalSub: { color: '#9CA3AF', fontSize: 12, marginBottom: 14, lineHeight: 18 },
    taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 12 },
    taskRowDone: { backgroundColor: 'rgba(110,231,183,0.1)' },
    taskCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#6B7280', justifyContent: 'center', alignItems: 'center' },
    taskCircleDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
    taskText: { color: 'white', fontSize: 14 },
    taskTextDone: { textDecorationLine: 'line-through', color: '#6EE7B7' },
    taskDueTime: { color: '#FBBF24', fontSize: 11, marginTop: 2 },
    taskPts: { color: '#FBBF24', fontSize: 12, fontWeight: '700', minWidth: 40, textAlign: 'right' },
    taskHint: { color: '#4B5563', fontSize: 11 },
    emptyTasks: { color: '#4B5563', fontSize: 14, textAlign: 'center', padding: 20 },
    addTaskRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    taskInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderRadius: 14, padding: 12, color: 'white', fontSize: 15 },
    timeToggleBtn: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    timeToggleBtnActive: { backgroundColor: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.4)' },
    addBtn: { backgroundColor: 'rgba(139,92,246,0.35)', borderRadius: 14, padding: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(139,92,246,0.5)' },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(251,191,36,0.08)', borderRadius: 12, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)' },
    timeLabel: { color: '#FBBF24', fontSize: 13, fontWeight: '600' },
    timeInput: { width: 44, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 6, color: 'white', fontSize: 15, textAlign: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    timeColon: { color: '#FBBF24', fontSize: 18, fontWeight: 'bold' },
    timeHint: { color: 'rgba(255,255,255,0.35)', fontSize: 11, flex: 1 },
    modalClose: { marginTop: 16, alignItems: 'center', paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16 },
    modalCloseText: { color: '#9CA3AF', fontWeight: '600', fontSize: 16 },
    // Win
    winOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 60, padding: 32 },
    winTitle: { color: 'white', fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
    winSub: { color: 'rgba(255,255,255,0.7)', fontSize: 16, textAlign: 'center', marginBottom: 36, lineHeight: 24 },
    winBtn: { borderRadius: 28, overflow: 'hidden' },
    winBtnGrad: { paddingHorizontal: 40, paddingVertical: 16 },
    winBtnText: { color: '#78350F', fontWeight: 'bold', fontSize: 18 },
});
