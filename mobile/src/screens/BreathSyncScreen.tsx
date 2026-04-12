import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated,
    Easing, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BG_GRADIENT, COLOR } from '../config/theme';

const { width } = Dimensions.get('window');

const SESSION_DURATION = 300; // 5 minutes
const BREATH_PHASES = [
    { name: 'Inhale', duration: 4000, color: '#67E8F9', instruction: 'Breathe in slowly through your nose' },
    { name: 'Hold', duration: 7000, color: '#A5B4FC', instruction: 'Hold gently — feel the stillness' },
    { name: 'Exhale', duration: 8000, color: '#6EE7B7', instruction: 'Release slowly through your mouth' },
];

export default function BreathSyncScreen({ navigation }: any) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [phaseIndex, setPhaseIndex] = useState(0);
    const [timeLeftInPhase, setTimeLeftInPhase] = useState(BREATH_PHASES[0].duration / 1000);
    const [sessionTimeLeft, setSessionTimeLeft] = useState(SESSION_DURATION);
    const [cycles, setCycles] = useState(0);

    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const opacityAnim = useRef(new Animated.Value(0.3)).current;
    const phaseTimer = useRef<any>(null);
    const sessionTimer = useRef<any>(null);
    const animRef = useRef<any>(null);
    const phaseIndexRef = useRef(0);

    const phase = BREATH_PHASES[phaseIndex];

    const runPhaseAnimation = (pIndex: number) => {
        const p = BREATH_PHASES[pIndex];
        if (animRef.current) animRef.current.stop();

        const targetScale = p.name === 'Inhale' ? 1 : p.name === 'Hold' ? 1 : 0.5;
        const targetOpacity = p.name === 'Inhale' ? 1 : p.name === 'Hold' ? 1 : 0.3;

        animRef.current = Animated.parallel([
            Animated.timing(scaleAnim, { toValue: targetScale, duration: p.duration, easing: Easing.ease, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: targetOpacity, duration: p.duration, easing: Easing.ease, useNativeDriver: true }),
        ]);
        animRef.current.start();
    };

    const advancePhase = () => {
        const nextIndex = (phaseIndexRef.current + 1) % BREATH_PHASES.length;
        phaseIndexRef.current = nextIndex;
        setPhaseIndex(nextIndex);
        setTimeLeftInPhase(BREATH_PHASES[nextIndex].duration / 1000);
        if (nextIndex === 0) setCycles(c => c + 1);
        runPhaseAnimation(nextIndex);
    };

    useEffect(() => {
        if (!isPlaying || isFinished) return;

        // Phase countdown
        phaseTimer.current = setInterval(() => {
            setTimeLeftInPhase(prev => {
                if (prev <= 1) {
                    advancePhase();
                    return BREATH_PHASES[(phaseIndexRef.current)].duration / 1000;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(phaseTimer.current);
    }, [isPlaying, isFinished]);

    useEffect(() => {
        if (!isPlaying || isFinished) return;

        // Session countdown
        sessionTimer.current = setInterval(() => {
            setSessionTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(sessionTimer.current);
                    setIsPlaying(false);
                    setIsFinished(true);
                    if (animRef.current) animRef.current.stop();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(sessionTimer.current);
    }, [isPlaying, isFinished]);

    const startSession = () => {
        phaseIndexRef.current = 0;
        setPhaseIndex(0);
        setTimeLeftInPhase(BREATH_PHASES[0].duration / 1000);
        setSessionTimeLeft(SESSION_DURATION);
        setCycles(0);
        setIsFinished(false);
        setIsPlaying(true);
        scaleAnim.setValue(0.5);
        opacityAnim.setValue(0.3);
        runPhaseAnimation(0);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    const phaseColors: Record<string, string[]> = {
        'Inhale': ['rgba(6,182,212,0.3)', 'rgba(6,182,212,0.05)'],
        'Hold': ['rgba(99,102,241,0.3)', 'rgba(99,102,241,0.05)'],
        'Exhale': ['rgba(16,185,129,0.3)', 'rgba(16,185,129,0.05)'],
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Ionicons name="close" size={22} color="white" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>Breath Sync</Text>
                    {isPlaying && <Text style={styles.timerText}>{formatTime(sessionTimeLeft)}</Text>}
                </View>
                <View style={styles.cycleBox}>
                    <Text style={styles.cycleNum}>{cycles}</Text>
                    <Text style={styles.cycleLabel}>cycles</Text>
                </View>
            </View>

            {/* Main Content */}
            <View style={styles.center}>
                {/* Breathing orb */}
                <TouchableOpacity onPress={!isPlaying && !isFinished ? startSession : undefined} activeOpacity={0.9}>
                    <View style={styles.orbContainer}>
                        {/* Outer glow rings */}
                        <Animated.View style={[styles.orbRing, styles.orbRing3, { opacity: opacityAnim, transform: [{ scale: Animated.multiply(scaleAnim, 1.4) }] }]} />
                        <Animated.View style={[styles.orbRing, styles.orbRing2, { opacity: opacityAnim, transform: [{ scale: Animated.multiply(scaleAnim, 1.2) }] }]} />
                        {/* Main orb */}
                        <Animated.View style={[styles.orbMain, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
                            <LinearGradient
                                colors={isPlaying ? (phaseColors[phase.name] || phaseColors['Inhale']) : ['rgba(139,92,246,0.3)', 'rgba(139,92,246,0.05)']}
                                style={styles.orbGrad}
                            >
                                {isPlaying ? (
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={[styles.phaseName, { color: phase.color }]}>{phase.name}</Text>
                                        <Text style={styles.phaseCount}>{timeLeftInPhase}s</Text>
                                    </View>
                                ) : isFinished ? (
                                    <Text style={styles.finishEmoji}>✨</Text>
                                ) : (
                                    <Ionicons name="play" size={40} color="rgba(139,92,246,0.8)" />
                                )}
                            </LinearGradient>
                        </Animated.View>
                    </View>
                </TouchableOpacity>

                {/* Instruction */}
                {isPlaying && (
                    <View style={styles.instructionBox}>
                        <Text style={styles.instructionText}>{phase.instruction}</Text>
                    </View>
                )}

                {/* Phase progress dots */}
                {isPlaying && (
                    <View style={styles.phaseDots}>
                        {BREATH_PHASES.map((p, i) => (
                            <View key={p.name} style={[styles.phaseDot, i === phaseIndex && styles.phaseDotActive, i === phaseIndex && { backgroundColor: phase.color }]} />
                        ))}
                    </View>
                )}
            </View>

            {/* Bottom panel */}
            <View style={styles.bottom}>
                {!isPlaying && !isFinished && (
                    <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>4-7-8 Breathing</Text>
                        <Text style={styles.infoDesc}>A natural tranquilizer for the nervous system. Helps reduce anxiety and induce calm.</Text>
                        <View style={styles.phaseList}>
                            {BREATH_PHASES.map(p => (
                                <View key={p.name} style={styles.phaseItem}>
                                    <View style={[styles.phaseDotBig, { backgroundColor: p.color }]} />
                                    <Text style={styles.phaseItemText}>{p.name} — {p.duration / 1000}s</Text>
                                </View>
                            ))}
                        </View>
                        <TouchableOpacity style={styles.startBtn} onPress={startSession}>
                            <LinearGradient colors={['#06B6D4', '#8B5CF6']} style={styles.startBtnGrad}>
                                <Ionicons name="leaf" size={20} color="white" />
                                <Text style={styles.startBtnText}>Begin Session (5 min)</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}

                {isFinished && (
                    <View style={styles.finishCard}>
                        <Text style={styles.finishTitle}>Session Complete ✨</Text>
                        <Text style={styles.finishSub}>You completed {cycles} breathing cycles. Your nervous system thanks you.</Text>
                        <TouchableOpacity style={styles.startBtn} onPress={startSession}>
                            <LinearGradient colors={['#06B6D4', '#8B5CF6']} style={styles.startBtnGrad}>
                                <Text style={styles.startBtnText}>Start Again</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const ORB_SIZE = Math.min(width - 80, 280);
const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
    closeBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    timerText: { color: '#06B6D4', fontSize: 14, fontWeight: '600' },
    cycleBox: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
    cycleNum: { color: 'white', fontWeight: 'bold', fontSize: 20 },
    cycleLabel: { color: '#6B7280', fontSize: 10 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    orbContainer: { width: ORB_SIZE, height: ORB_SIZE, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    orbRing: { position: 'absolute', borderRadius: ORB_SIZE / 2 },
    orbRing3: { width: ORB_SIZE, height: ORB_SIZE, backgroundColor: 'rgba(99,102,241,0.06)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.1)' },
    orbRing2: { width: ORB_SIZE * 0.85, height: ORB_SIZE * 0.85, backgroundColor: 'rgba(6,182,212,0.06)', borderWidth: 1, borderColor: 'rgba(6,182,212,0.1)' },
    orbMain: { width: ORB_SIZE * 0.7, height: ORB_SIZE * 0.7, borderRadius: ORB_SIZE * 0.35, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    orbGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    phaseName: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
    phaseCount: { fontSize: 32, fontWeight: 'bold', color: 'white' },
    finishEmoji: { fontSize: 48 },
    instructionBox: { marginTop: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    instructionText: { color: '#D1D5DB', fontSize: 15, textAlign: 'center', lineHeight: 22 },
    phaseDots: { flexDirection: 'row', gap: 8, marginTop: 16 },
    phaseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
    phaseDotActive: { width: 24, borderRadius: 4 },
    bottom: { paddingHorizontal: 24, paddingBottom: 40 },
    infoCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 22, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    infoTitle: { color: 'white', fontWeight: 'bold', fontSize: 18, marginBottom: 8 },
    infoDesc: { color: '#9CA3AF', fontSize: 14, lineHeight: 20, marginBottom: 16 },
    phaseList: { gap: 8, marginBottom: 16 },
    phaseItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    phaseDotBig: { width: 10, height: 10, borderRadius: 5 },
    phaseItemText: { color: '#D1D5DB', fontSize: 14 },
    startBtn: { borderRadius: 14, overflow: 'hidden' },
    startBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
    startBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    finishCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 22, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', gap: 12 },
    finishTitle: { color: 'white', fontWeight: 'bold', fontSize: 22 },
    finishSub: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
