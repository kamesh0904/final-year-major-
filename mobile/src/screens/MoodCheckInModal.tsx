/**
 * MoodCheckInModal
 * Shows once per day when the app opens, before the user starts anything.
 * Saves mood to Supabase diary_entries (or a dedicated mood_logs table).
 * The result is passed to the AI with every chat message automatically.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal, Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

const MOODS = [
    { score: 1, emoji: '😞', label: 'Very Low' },
    { score: 2, emoji: '😔', label: 'Low' },
    { score: 3, emoji: '😐', label: 'Neutral' },
    { score: 4, emoji: '🙂', label: 'Okay' },
    { score: 5, emoji: '😊', label: 'Good' },
    { score: 6, emoji: '😄', label: 'Pretty Good' },
    { score: 7, emoji: '😁', label: 'Great' },
    { score: 8, emoji: '🤩', label: 'Amazing' },
    { score: 9, emoji: '🥳', label: 'Excellent' },
    { score: 10, emoji: '✨', label: 'Perfect' },
];

const MOOD_COLORS: Record<number, [string, string]> = {
    1: ['#6B21A8', '#1E1B4B'],
    2: ['#7C3AED', '#312E81'],
    3: ['#4338CA', '#1E3A8A'],
    4: ['#2563EB', '#164E63'],
    5: ['#0EA5E9', '#065F46'],
    6: ['#10B981', '#14532D'],
    7: ['#22C55E', '#166534'],
    8: ['#84CC16', '#365314'],
    9: ['#EAB308', '#713F12'],
    10: ['#F59E0B', '#7C2D12'],
};

const getToday = () => new Date().toISOString().slice(0, 10);
// Key is computed per-user inside the component — see getStorageKey()

interface Props {
    onComplete: (mood: number) => void;
}

export default function MoodCheckInModal({ onComplete }: Props) {
    const { user } = useAuth();
    const userId = user?.id ?? null;
    const [visible, setVisible] = useState(false);
    const [selected, setSelected] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const slideAnim = useRef(new Animated.Value(300)).current;

    // Account-scoped key so responses never leak across accounts
    const getStorageKey = () => (userId ? `mood_checkin_${userId}_${getToday()}` : null);

    useEffect(() => {
        let active = true;

        const checkIfNeeded = async () => {
            const key = getStorageKey();
            if (!key) {
                setVisible(false);
                setSelected(null);
                return;
            }

            const done = await AsyncStorage.getItem(key);
            if (!active) return;

            if (!done) {
                setVisible(true);
                setSelected(null); // reset any leftover selection from previous user
                slideAnim.setValue(300);
                Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
                return;
            }

            const parsedMood = parseInt(done, 10);
            setVisible(false);
            setSelected(null);
            onComplete(Number.isNaN(parsedMood) ? 5 : parsedMood);
        };

        checkIfNeeded();
        return () => {
            active = false;
        };
    }, [userId]);

    const submit = async () => {
        const key = getStorageKey();
        if (!selected || !key || !userId) return;
        setSubmitting(true);
        try {
            await AsyncStorage.setItem(key, String(selected));
            // Save to Supabase for AI context + mood trend charts
            await supabase.from('mood_logs').insert({
                user_id: userId,
                score: selected,
                logged_at: new Date().toISOString(),
            });
        } catch (_) { }
        setSubmitting(false);
        Animated.timing(slideAnim, { toValue: 600, duration: 300, useNativeDriver: true }).start(() => {
            setVisible(false);
            onComplete(selected);
        });
    };

    const skip = async () => {
        const key = getStorageKey();
        if (!key) return;
        await AsyncStorage.setItem(key, '5'); // neutral default
        Animated.timing(slideAnim, { toValue: 600, duration: 250, useNativeDriver: true }).start(() => {
            setVisible(false);
            onComplete(5);
        });
    };

    const gradColors = selected ? MOOD_COLORS[selected] : ['#1a0b2e', '#0a0514'];

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
            <View style={styles.overlay}>
                <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                    <LinearGradient colors={gradColors as any} style={styles.sheetGrad}>
                        {/* Header */}
                        <Text style={styles.greeting}>Good {getTimeOfDay()} 🌟</Text>
                        <Text style={styles.title}>How are you feeling right now?</Text>
                        <Text style={styles.sub}>This helps your AI companion support you better today.</Text>

                        {/* Emoji Grid */}
                        <View style={styles.moodGrid}>
                            {MOODS.map(m => (
                                <TouchableOpacity
                                    key={m.score}
                                    onPress={() => setSelected(m.score)}
                                    style={[styles.moodBtn, selected === m.score && styles.moodBtnSelected]}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.moodEmoji}>{m.emoji}</Text>
                                    <Text style={[styles.moodLabel, selected === m.score && { color: 'white' }]}>
                                        {m.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Score bar */}
                        {selected && (
                            <View style={styles.scoreRow}>
                                <Text style={styles.scoreText}>Mood: {selected}/10</Text>
                                <View style={styles.scoreBar}>
                                    <View style={[styles.scoreFill, { width: `${selected * 10}%` }]} />
                                </View>
                            </View>
                        )}

                        {/* CTA */}
                        <TouchableOpacity
                            onPress={submit}
                            disabled={!selected || submitting}
                            style={[styles.submitBtn, (!selected || submitting) && styles.submitBtnDisabled]}
                        >
                            <Text style={styles.submitText}>
                                {submitting ? 'Saving...' : selected ? `Start as ${MOODS[selected - 1].label}` : 'Select how you feel'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={skip} style={styles.skipBtn}>
                            <Text style={styles.skipText}>Skip for now</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </Animated.View>
            </View>
        </Modal>
    );
}

function getTimeOfDay() {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
    sheetGrad: { padding: 28, paddingBottom: 48 },
    greeting: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500', marginBottom: 6 },
    title: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 6 },
    sub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 24, lineHeight: 18 },
    moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 },
    moodBtn: { width: (width - 100) / 5, alignItems: 'center', paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)', gap: 2 },
    moodBtnSelected: { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.5)', transform: [{ scale: 1.05 }] },
    moodEmoji: { fontSize: 26 },
    moodLabel: { fontSize: 9, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
    scoreRow: { marginBottom: 20 },
    scoreText: { color: 'white', fontSize: 13, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
    scoreBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' },
    scoreFill: { height: '100%', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 3 },
    submitBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    submitBtnDisabled: { opacity: 0.4 },
    submitText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    skipBtn: { marginTop: 12, alignItems: 'center', padding: 8 },
    skipText: { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
});
