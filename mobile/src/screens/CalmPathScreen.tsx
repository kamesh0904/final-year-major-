/**
 * Calm Path — Flow State Game
 *
 * A glowing orb drifts along a smooth Lissajous curve.
 * The player traces it with their finger. The closer they stay,
 * the higher the "flow score". No penalties, no lives — just rhythm.
 *
 * Therapeutic goal: induce flow state through rhythmic, low-pressure
 * movement tracking. Helps with anxiety and grounding.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated,
    Dimensions, PanResponder, GestureResponderEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

const { width, height } = Dimensions.get('window');

// ─── Play area ────────────────────────────────────────────────────────────────
const PLAY_TOP = 160;
const PLAY_H = height * 0.52;
const CX = width / 2;
const CY = PLAY_TOP + PLAY_H / 2;

// Lissajous parameters — creates a figure-8 / infinity-like path
const AX = width * 0.34;
const AY = PLAY_H * 0.36;
const FREQ_A = 1;
const FREQ_B = 2;
const PHASE = Math.PI / 2;

// Orb position at time t (0..2π)
const orbAt = (t: number) => ({
    x: CX + AX * Math.sin(FREQ_A * t + PHASE),
    y: CY + AY * Math.sin(FREQ_B * t),
});

// How close the finger needs to be to count as "on path" (px)
const HIT_RADIUS = 48;

// Speed levels — seconds per full loop
const SPEEDS = [18, 14, 11, 9, 7.5];

// ─── Colour themes per level ──────────────────────────────────────────────────
const THEMES: Array<{ orb: string; trail: string; glow: string; bg: [string, string, string] }> = [
    { orb: '#60A5FA', trail: 'rgba(96,165,250,0.35)', glow: 'rgba(96,165,250,0.5)', bg: ['#060d1f', '#0d1b3e', '#060d1f'] },
    { orb: '#A78BFA', trail: 'rgba(167,139,250,0.35)', glow: 'rgba(167,139,250,0.5)', bg: ['#0d0620', '#1a0b3e', '#0d0620'] },
    { orb: '#34D399', trail: 'rgba(52,211,153,0.35)', glow: 'rgba(52,211,153,0.5)', bg: ['#061a14', '#0d3028', '#061a14'] },
    { orb: '#F472B6', trail: 'rgba(244,114,182,0.35)', glow: 'rgba(244,114,182,0.5)', bg: ['#1a0620', '#2d0a38', '#1a0620'] },
    { orb: '#FBBF24', trail: 'rgba(251,191,36,0.35)', glow: 'rgba(251,191,36,0.5)', bg: ['#1a1206', '#2d1e08', '#1a1206'] },
];

// ─── Trail dot ────────────────────────────────────────────────────────────────
interface TrailDot { x: number; y: number; opacity: Animated.Value }

export default function CalmPathScreen({ navigation }: any) {
    const { user } = useAuth();
    const [isPlaying, setIsPlaying] = useState(false);
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [flowPct, setFlowPct] = useState(0);   // 0-100 live flow meter
    const [sessionTime, setSessionTime] = useState(0);
    const [trail, setTrail] = useState<TrailDot[]>([]);
    const [fingerPos, setFingerPos] = useState<{ x: number; y: number } | null>(null);
    const [isFingerDown, setIsFingerDown] = useState(false);
    const [orbPos, setOrbPos] = useState(orbAt(0));
    const [heroScale] = useState(new Animated.Value(0.8));
    const [heroOpacity] = useState(new Animated.Value(0));
    const orbGlow = useRef(new Animated.Value(1)).current;

    const tRef = useRef(0);
    const rafRef = useRef<any>(null);
    const timerRef = useRef<any>(null);
    const trailIdRef = useRef(0);
    const onPathRef = useRef(false);
    const onPathTicksRef = useRef(0);
    const totalTicksRef = useRef(0);

    const theme = THEMES[(level - 1) % THEMES.length];
    const speed = SPEEDS[Math.min(level - 1, SPEEDS.length - 1)];

    // ─── Entrance animation ───────────────────────────────────────────────────
    useEffect(() => {
        if (!isPlaying) {
            Animated.parallel([
                Animated.spring(heroScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
                Animated.timing(heroOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            ]).start();
        }
    }, [isPlaying]);

    // ─── Orb pulse loop ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!isPlaying) return;
        const pulse = Animated.loop(Animated.sequence([
            Animated.timing(orbGlow, { toValue: 1.4, duration: 800, useNativeDriver: true }),
            Animated.timing(orbGlow, { toValue: 1.0, duration: 800, useNativeDriver: true }),
        ]));
        pulse.start();
        return () => pulse.stop();
    }, [isPlaying]);

    // ─── Main game loop ───────────────────────────────────────────────────────
    const gameLoop = useCallback(() => {
        const dt = 16 / 1000; // ~60fps
        tRef.current += (dt / speed) * 2 * Math.PI;
        const pos = orbAt(tRef.current);
        setOrbPos(pos);

        // Check if finger is on path
        if (isFingerDown && fingerPos) {
            const dx = fingerPos.x - pos.x;
            const dy = fingerPos.y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const onPath = dist < HIT_RADIUS;
            onPathRef.current = onPath;
            totalTicksRef.current++;
            if (onPath) {
                onPathTicksRef.current++;
                setScore(s => s + 1);
            }
            const pct = totalTicksRef.current > 0
                ? Math.round((onPathTicksRef.current / totalTicksRef.current) * 100)
                : 0;
            setFlowPct(pct);
        }

        // Spawn trail dot
        const id = trailIdRef.current++;
        const opacityAnim = new Animated.Value(0.7);
        setTrail(prev => {
            const next = [...prev.slice(-18), { x: pos.x, y: pos.y, opacity: opacityAnim }];
            return next;
        });
        Animated.timing(opacityAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start();

        rafRef.current = setTimeout(gameLoop, 16);
    }, [speed, isFingerDown, fingerPos]);

    // ─── Session timer ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isPlaying) return;
        timerRef.current = setInterval(() => {
            setSessionTime(t => {
                const next = t + 1;
                // Level up every 30 seconds
                if (next > 0 && next % 30 === 0) {
                    setLevel(l => Math.min(l + 1, 5));
                }
                return next;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [isPlaying]);

    // ─── Start / stop game loop ───────────────────────────────────────────────
    useEffect(() => {
        if (isPlaying) {
            rafRef.current = setTimeout(gameLoop, 16);
        } else {
            clearTimeout(rafRef.current);
        }
        return () => clearTimeout(rafRef.current);
    }, [isPlaying, gameLoop]);

    const startSession = () => {
        tRef.current = 0;
        onPathTicksRef.current = 0;
        totalTicksRef.current = 0;
        setScore(0);
        setFlowPct(0);
        setSessionTime(0);
        setLevel(1);
        setTrail([]);
        setIsPlaying(true);
        heroScale.setValue(0.8);
        heroOpacity.setValue(0);
    };

    const endSession = async () => {
        setIsPlaying(false);
        clearTimeout(rafRef.current);
        clearInterval(timerRef.current);

        if (user?.id && flowPct > 0) {
            try {
                await supabase.from('game_sessions').insert({
                    user_id: user.id,
                    game_name: 'Calm Path',
                    score: flowPct,
                    duration_seconds: sessionTime,
                    created_at: new Date().toISOString(),
                });
            } catch (err) {
                console.error('Failed to save score', err);
            }
        }
    };

    // ─── PanResponder for finger tracking ────────────────────────────────────
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (e: GestureResponderEvent) => {
                setIsFingerDown(true);
                setFingerPos({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
            },
            onPanResponderMove: (e: GestureResponderEvent) => {
                setFingerPos({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
            },
            onPanResponderRelease: () => {
                setIsFingerDown(false);
                setFingerPos(null);
            },
            onPanResponderTerminate: () => {
                setIsFingerDown(false);
                setFingerPos(null);
            },
        })
    ).current;

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    const flowLabel = flowPct >= 80 ? '🌊 Deep Flow' : flowPct >= 60 ? '✨ In Flow' : flowPct >= 40 ? '🌀 Finding Flow' : '💫 Warming Up';

    return (
        <View style={styles.container}>
            <LinearGradient colors={theme.bg} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => { endSession(); navigation.goBack(); }} style={styles.closeBtn}>
                    <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.title}>Calm Path</Text>
                    {isPlaying && <Text style={styles.levelBadge}>Level {level}</Text>}
                </View>
                <View style={styles.scorePill}>
                    <Text style={styles.scoreLabel}>FLOW</Text>
                    <Text style={[styles.scoreText, { color: theme.orb }]}>{flowPct}%</Text>
                </View>
            </View>

            {isPlaying ? (
                <>
                    {/* Stats row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statPill}>
                            <Ionicons name="time-outline" size={13} color="rgba(156,163,175,1)" />
                            <Text style={styles.statText}>{formatTime(sessionTime)}</Text>
                        </View>
                        <View style={[styles.flowMeter, { borderColor: theme.orb + '55' }]}>
                            <View style={[styles.flowFill, { width: `${flowPct}%`, backgroundColor: theme.orb }]} />
                        </View>
                        <View style={styles.statPill}>
                            <Text style={[styles.flowLabel, { color: theme.orb }]}>{flowLabel}</Text>
                        </View>
                    </View>

                    {/* Instruction */}
                    <Text style={styles.instruction}>
                        {isFingerDown ? (onPathRef.current ? '✨ Perfect — stay with it' : 'Follow the orb...') : 'Touch and trace the glowing orb'}
                    </Text>

                    {/* Play area */}
                    <View
                        style={styles.playArea}
                        {...panResponder.panHandlers}
                    >
                        {/* Trail dots */}
                        {trail.map((dot, i) => (
                            <Animated.View
                                key={i}
                                pointerEvents="none"
                                style={[
                                    styles.trailDot,
                                    {
                                        left: dot.x - 6,
                                        top: dot.y - 6,
                                        backgroundColor: theme.trail,
                                        opacity: dot.opacity,
                                    },
                                ]}
                            />
                        ))}

                        {/* Orb glow ring */}
                        <Animated.View
                            pointerEvents="none"
                            style={[
                                styles.orbGlowRing,
                                {
                                    left: orbPos.x - 36,
                                    top: orbPos.y - 36,
                                    borderColor: theme.glow,
                                    transform: [{ scale: orbGlow }],
                                    opacity: orbGlow.interpolate({ inputRange: [1, 1.4], outputRange: [0.5, 0] }),
                                },
                            ]}
                        />

                        {/* Orb */}
                        <Animated.View
                            pointerEvents="none"
                            style={[
                                styles.orb,
                                {
                                    left: orbPos.x - 20,
                                    top: orbPos.y - 20,
                                    backgroundColor: theme.orb,
                                    shadowColor: theme.orb,
                                    transform: [{ scale: orbGlow.interpolate({ inputRange: [1, 1.4], outputRange: [1, 1.1] }) }],
                                },
                            ]}
                        />

                        {/* Finger indicator */}
                        {isFingerDown && fingerPos && (
                            <View
                                pointerEvents="none"
                                style={[
                                    styles.finger,
                                    {
                                        left: fingerPos.x - 22,
                                        top: fingerPos.y - 22,
                                        borderColor: onPathRef.current ? theme.orb : 'rgba(255,255,255,0.3)',
                                    },
                                ]}
                            />
                        )}
                    </View>

                    {/* End session */}
                    <TouchableOpacity style={styles.endBtn} onPress={endSession} activeOpacity={0.8}>
                        <Text style={styles.endBtnText}>End Session</Text>
                    </TouchableOpacity>
                </>
            ) : (
                /* Start / Results screen */
                <View style={styles.centeredScreen}>
                    <Animated.View style={[styles.heroIconWrap, { transform: [{ scale: heroScale }], opacity: heroOpacity }]}>
                        <LinearGradient colors={[theme.glow, 'transparent']} style={styles.heroGlow} />
                        <Text style={styles.heroEmoji}>{score > 0 ? '🌊' : '🛤️'}</Text>
                    </Animated.View>
                    <Animated.View style={[styles.glassCard, { opacity: heroOpacity }]}>
                        {score > 0 ? (
                            <>
                                <Text style={styles.gameOverTitle}>Session Complete</Text>
                                <View style={[styles.flowResultPill, { backgroundColor: theme.orb + '22', borderColor: theme.orb + '55' }]}>
                                    <Text style={[styles.flowResultText, { color: theme.orb }]}>{flowPct}% Flow Score</Text>
                                </View>
                                <Text style={styles.cardDesc}>
                                    {flowPct >= 80
                                        ? 'You reached deep flow. Your mind and body were in perfect sync.'
                                        : flowPct >= 60
                                            ? 'You found your flow. Keep practising to go deeper.'
                                            : 'A good start. Flow deepens with each session.'}
                                </Text>
                                <View style={styles.resultStats}>
                                    <View style={styles.resultStat}>
                                        <Text style={[styles.resultStatVal, { color: theme.orb }]}>{formatTime(sessionTime)}</Text>
                                        <Text style={styles.resultStatLabel}>Duration</Text>
                                    </View>
                                    <View style={styles.resultStat}>
                                        <Text style={[styles.resultStatVal, { color: theme.orb }]}>Lvl {level}</Text>
                                        <Text style={styles.resultStatLabel}>Reached</Text>
                                    </View>
                                </View>
                            </>
                        ) : (
                            <>
                                <LinearGradient colors={[theme.orb, theme.orb + 'AA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientTitle}>
                                    <Text style={styles.gradientTitleText}>Calm Path</Text>
                                </LinearGradient>
                                <Text style={styles.cardDesc}>
                                    A glowing orb drifts along a flowing path.{'\n\n'}
                                    Touch the screen and trace it with your finger. Stay close to build flow.{'\n\n'}
                                    No pressure. No penalties. Just rhythm.
                                </Text>
                            </>
                        )}
                        <TouchableOpacity style={[styles.ctaBtn, { shadowColor: theme.orb }]} onPress={startSession} activeOpacity={0.85}>
                            <LinearGradient colors={[theme.orb, theme.orb + 'BB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaBtnGrad}>
                                <Ionicons name={score > 0 ? 'refresh' : 'water'} size={18} color="white" />
                                <Text style={styles.ctaBtnText}>{score > 0 ? 'Flow Again' : 'Enter Flow State'}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 58, paddingBottom: 10, zIndex: 20 },
    closeBtn: { width: 38, height: 38, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    headerCenter: { alignItems: 'center', gap: 4 },
    title: { color: 'white', fontWeight: '700', fontSize: 17, letterSpacing: 0.3 },
    levelBadge: { color: 'rgba(156,163,175,1)', fontSize: 11, fontWeight: '600' },
    scorePill: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
    scoreLabel: { color: 'rgba(156,163,175,1)', fontSize: 9, fontWeight: '600', letterSpacing: 1 },
    scoreText: { fontWeight: '800', fontSize: 18 },
    statsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10, marginBottom: 8, zIndex: 20 },
    statPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    statText: { color: 'rgba(156,163,175,1)', fontSize: 12, fontWeight: '600' },
    flowMeter: { flex: 1, height: 7, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', borderWidth: 1 },
    flowFill: { height: '100%', borderRadius: 4 },
    flowLabel: { fontSize: 11, fontWeight: '700' },
    instruction: { color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', marginBottom: 6, paddingHorizontal: 20, fontStyle: 'italic' },
    playArea: { flex: 1, zIndex: 10 },
    trailDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6 },
    orbGlowRing: { position: 'absolute', width: 72, height: 72, borderRadius: 36, borderWidth: 2 },
    orb: { position: 'absolute', width: 40, height: 40, borderRadius: 20, shadowOpacity: 0.9, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
    finger: { position: 'absolute', width: 44, height: 44, borderRadius: 22, borderWidth: 2, backgroundColor: 'rgba(255,255,255,0.08)' },
    endBtn: { marginHorizontal: 20, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', zIndex: 20 },
    endBtnText: { color: 'rgba(156,163,175,1)', fontSize: 14, fontWeight: '600' },
    centeredScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 20 },
    heroIconWrap: { alignItems: 'center', justifyContent: 'center' },
    heroGlow: { position: 'absolute', width: 140, height: 140, borderRadius: 70 },
    heroEmoji: { fontSize: 72 },
    glassCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', width: '100%', gap: 14, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
    gradientTitle: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 6 },
    gradientTitleText: { color: 'white', fontWeight: '800', fontSize: 22, letterSpacing: 0.5 },
    cardDesc: { color: 'rgba(156,163,175,1)', fontSize: 14, textAlign: 'center', lineHeight: 22 },
    ctaBtn: { borderRadius: 16, overflow: 'hidden', width: '100%', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
    ctaBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
    ctaBtnText: { color: 'white', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
    gameOverTitle: { color: 'white', fontWeight: '700', fontSize: 20 },
    flowResultPill: { borderRadius: 12, paddingHorizontal: 18, paddingVertical: 6, borderWidth: 1 },
    flowResultText: { fontWeight: '800', fontSize: 16 },
    resultStats: { flexDirection: 'row', gap: 12, width: '100%' },
    resultStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    resultStatVal: { fontWeight: '800', fontSize: 22 },
    resultStatLabel: { color: 'rgba(156,163,175,1)', fontSize: 11, marginTop: 3 },
});
