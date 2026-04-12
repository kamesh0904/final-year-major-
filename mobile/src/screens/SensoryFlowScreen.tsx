import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated,
    Dimensions, PanResponder, GestureResponderEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// ─── Types ──────────────────────────────────────────────────────────────────────
type ShapeColor = 'blue' | 'purple' | 'teal';
type ShapeType = 'circle' | 'square';

interface FloatingShape {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    type: ShapeType;
    color: ShapeColor;
    size: number;
    isDragging: boolean;
    panX: Animated.Value;
    panY: Animated.Value;
}

// ─── Configuration ──────────────────────────────────────────────────────────────
const COLORS: Record<ShapeColor, { main: string; glow: string; label: string }> = {
    blue:   { main: '#60A5FA', glow: 'rgba(96,165,250,0.4)',   label: 'Calm'  },
    purple: { main: '#A78BFA', glow: 'rgba(167,139,250,0.4)', label: 'Focus' },
    teal:   { main: '#2DD4BF', glow: 'rgba(45,212,191,0.4)',  label: 'Flow'  },
};

// Zones placed near the bottom of the play area
const ZONE_Y = height * 0.78;
const ZONES: Array<{ color: ShapeColor; x: number }> = [
    { color: 'blue',   x: width * 0.2  },
    { color: 'purple', x: width * 0.5  },
    { color: 'teal',   x: width * 0.8  },
];
const ZONE_RADIUS = 50;
const MATCH_THRESHOLD = ZONE_RADIUS + 20;

const newShape = (id: number): FloatingShape => {
    const types: ShapeType[] = ['circle', 'square'];
    const colors: ShapeColor[] = ['blue', 'purple', 'teal'];
    const bx = 40 + Math.random() * (width - 80);
    const by = 80 + Math.random() * (height * 0.38);
    return {
        id,
        x: bx, y: by,
        vx: (Math.random() - 0.5) * 0.6,
        vy: 0.25 + Math.random() * 0.4,
        type: types[Math.floor(Math.random() * types.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 28 + Math.floor(Math.random() * 14),
        isDragging: false,
        panX: new Animated.Value(bx),
        panY: new Animated.Value(by),
    };
};

// ─── Component ──────────────────────────────────────────────────────────────────
export default function SensoryFlowScreen({ navigation }: any) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [targetScore, setTargetScore] = useState(10);
    const [sessionTime, setSessionTime] = useState(0);
    const [shapes, setShapes] = useState<FloatingShape[]>([]);
    const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; anim: Animated.Value }[]>([]);

    const timerRef = useRef<any>(null);
    const driftRef = useRef<any>(null);
    const shapeIdRef = useRef(0);
    const activeRef = useRef<{ id: number; startX: number; startY: number } | null>(null);

    // ─── Session timer ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isPlaying || isComplete) return;
        timerRef.current = setInterval(() => setSessionTime(t => t + 1), 1000);
        return () => clearInterval(timerRef.current);
    }, [isPlaying, isComplete]);

    // ─── Drift loop: move non-dragged shapes slowly ─────────────────────────────
    useEffect(() => {
        if (!isPlaying) return;
        const TICK = 50;
        driftRef.current = setInterval(() => {
            setShapes(prev => prev.map(s => {
                if (s.isDragging) return s;
                const nextX = s.x + s.vx;
                const nextY = s.y + s.vy;
                let vx = s.vx;
                let vy = s.vy;
                if (nextX < s.size || nextX > width - s.size) vx *= -1;
                // Respawn if drifted below zone area
                if (nextY > ZONE_Y - 30) {
                    const ns = newShape(++shapeIdRef.current);
                    return ns;
                }
                const nx = s.x + vx;
                const ny = s.y + vy;
                s.panX.setValue(nx);
                s.panY.setValue(ny);
                return { ...s, x: nx, y: ny, vx, vy };
            }));
        }, TICK);
        return () => clearInterval(driftRef.current);
    }, [isPlaying]);

    // ─── Spawn initial shapes ───────────────────────────────────────────────────
    const startSession = () => {
        shapeIdRef.current = 0;
        const initial = Array.from({ length: 6 }, (_, i) => newShape(i));
        shapeIdRef.current = 5;
        setShapes(initial);
        setScore(0);
        setLevel(1);
        setTargetScore(10);
        setSessionTime(0);
        setIsComplete(false);
        setIsPlaying(true);
    };

    // ─── Check win ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (score >= targetScore && isPlaying) {
            setIsComplete(true);
            setIsPlaying(false);
        }
    }, [score, targetScore, isPlaying]);

    // ─── Spawn replacement shape ────────────────────────────────────────────────
    const spawnReplacement = useCallback(() => {
        setShapes(prev => {
            if (prev.length >= 8) return prev;
            return [...prev, newShape(++shapeIdRef.current)];
        });
    }, []);

    // ─── Handle match ──────────────────────────────────────────────────────────
    const tryMatch = useCallback((shapeId: number, dropX: number, dropY: number) => {
        setShapes(prev => {
            const shape = prev.find(s => s.id === shapeId);
            if (!shape) return prev;

            // Check if dropped near a zone row
            if (Math.abs(dropY - ZONE_Y) > MATCH_THRESHOLD + 40) {
                // Not near zone row — return to original float position
                shape.isDragging = false;
                return [...prev];
            }

            // Find nearest matching zone
            const zone = ZONES.find(z =>
                Math.abs(z.x - dropX) < MATCH_THRESHOLD &&
                z.color === shape.color
            );

            if (zone) {
                // Match! Burst particles
                const pId = Date.now();
                const pAnim = new Animated.Value(1);
                setParticles(pp => [...pp, { id: pId, x: dropX, y: dropY, color: COLORS[shape.color].main, anim: pAnim }]);
                Animated.timing(pAnim, { toValue: 0, duration: 700, useNativeDriver: true }).start(() => {
                    setParticles(pp => pp.filter(p => p.id !== pId));
                });

                setScore(s => {
                    const ns = s + 1;
                    if (ns % 10 === 0) {
                        setLevel(l => l + 1);
                        setTargetScore(t => t + 10);
                    }
                    return ns;
                });
                setTimeout(spawnReplacement, 300);
                return prev.filter(s => s.id !== shapeId);
            }

            // Wrong zone or missed — reset
            shape.isDragging = false;
            shape.panX.setValue(shape.x);
            shape.panY.setValue(shape.y);
            return [...prev];
        });
    }, [spawnReplacement]);

    // ─── Render each shape with its own PanResponder ─────────────────────────
    const ShapeItem = React.memo(({ shape }: { shape: FloatingShape }) => {
        const panResponder = useRef(
            PanResponder.create({
                onStartShouldSetPanResponder: () => isPlaying,
                onMoveShouldSetPanResponder: () => isPlaying,
                onPanResponderGrant: (e: GestureResponderEvent) => {
                    shape.isDragging = true;
                    activeRef.current = {
                        id: shape.id,
                        startX: e.nativeEvent.pageX - shape.x,
                        startY: e.nativeEvent.pageY - shape.y,
                    };
                },
                onPanResponderMove: (e: GestureResponderEvent) => {
                    if (!activeRef.current || activeRef.current.id !== shape.id) return;
                    const nx = e.nativeEvent.pageX - activeRef.current.startX;
                    const ny = e.nativeEvent.pageY - activeRef.current.startY;
                    shape.panX.setValue(nx);
                    shape.panY.setValue(ny);
                },
                onPanResponderRelease: (e: GestureResponderEvent) => {
                    if (!activeRef.current || activeRef.current.id !== shape.id) return;
                    const nx = e.nativeEvent.pageX - activeRef.current.startX;
                    const ny = e.nativeEvent.pageY - activeRef.current.startY;
                    shape.isDragging = false;
                    activeRef.current = null;
                    tryMatch(shape.id, nx, ny);
                },
            })
        ).current;

        const colorInfo = COLORS[shape.color];
        const isCircle = shape.type === 'circle';
        const s = shape.size;

        return (
            <Animated.View
                {...panResponder.panHandlers}
                style={[
                    styles.shape,
                    {
                        width: s * 2,
                        height: s * 2,
                        borderRadius: isCircle ? s : 12,
                        backgroundColor: colorInfo.main + 'CC',
                        borderColor: colorInfo.main,
                        shadowColor: colorInfo.main,
                        transform: [{ translateX: Animated.subtract(shape.panX, s) as any }, { translateY: Animated.subtract(shape.panY, s) as any }],
                    },
                ]}
            >
                {/* Inner highlight */}
                <View style={[
                    styles.shapeHighlight,
                    { borderRadius: isCircle ? s * 0.35 : 8 },
                ]} />
            </Animated.View>
        );
    });

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const progressPct = Math.min(100, (score / targetScore) * 100);

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#060d1f', '#0d1b3e', '#060d1f'] as const} style={StyleSheet.absoluteFill} />

            {/* ── Header ── */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                        <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.title}>🪶 Sensory Flow</Text>
                        <Text style={styles.subtitle}>
                            {isPlaying ? `Goal: ${targetScore} matches` : 'Drag shapes to matching zones'}
                        </Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Score</Text>
                        <Text style={styles.statVal}>{score}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Time</Text>
                        <Text style={styles.statVal}>{formatTime(sessionTime)}</Text>
                    </View>
                </View>
            </View>

            {/* Level / Progress bar */}
            {isPlaying && (
                <View style={styles.progressSection}>
                    <View style={styles.progressRow}>
                        <Text style={styles.levelText}>Level {level}</Text>
                        <Text style={styles.levelText}>{score}/{targetScore}</Text>
                    </View>
                    <View style={styles.progressTrack}>
                        <LinearGradient
                            colors={['#2DD4BF', '#60A5FA'] as const}
                            style={[styles.progressFill, { width: `${progressPct}%` }]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        />
                    </View>
                </View>
            )}

            {/* ── Play Area ── */}
            <View style={styles.playArea} pointerEvents={isPlaying ? 'box-none' : 'none'}>
                {/* Floating shapes */}
                {shapes.map(shape => <ShapeItem key={shape.id} shape={shape} />)}

                {/* Burst particles */}
                {particles.map(p => (
                    <Animated.View
                        key={p.id}
                        pointerEvents="none"
                        style={[styles.burst, { left: p.x - 20, top: p.y - 20, opacity: p.anim }]}
                    >
                        <View style={[styles.burstRing, { borderColor: p.color }]} />
                    </Animated.View>
                ))}

                {/* ── Zones ── */}
                <View style={[styles.zoneRow, { top: ZONE_Y - ZONE_RADIUS }]}>
                    {ZONES.map(z => {
                        const c = COLORS[z.color];
                        return (
                            <View key={z.color} style={[styles.zone, { borderColor: c.main, shadowColor: c.main, left: z.x - ZONE_RADIUS }]}>
                                <Text style={[styles.zoneLabel, { color: c.main }]}>{c.label}</Text>
                                <View style={[styles.zoneInner, { backgroundColor: c.glow }]} />
                            </View>
                        );
                    })}
                </View>

                {/* Zone hint line */}
                <View style={[styles.zoneLine, { top: ZONE_Y }]} />
            </View>

            {/* ── Start screen ── */}
            {!isPlaying && !isComplete && (
                <View style={styles.centeredOverlay}>
                    <View style={styles.infoCard}>
                        <Text style={styles.cardIcon}>🌊</Text>
                        <Text style={styles.cardTitle}>Sensory Flow</Text>
                        <Text style={styles.cardDesc}>
                            Drag each coloured shape into its matching zone at the bottom.{'\n\n'}
                            Match Calm → blue zone, Focus → purple zone, Flow → teal zone.{'\n\n'}
                            No pressure. Just breathe and flow.
                        </Text>
                        <TouchableOpacity style={styles.startBtn} onPress={startSession}>
                            <LinearGradient colors={['#14B8A6', '#06B6D4'] as const} style={styles.startBtnGrad}>
                                <Ionicons name="water" size={18} color="white" />
                                <Text style={styles.startBtnText}>Enter Flow State</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* ── Complete modal ── */}
            {isComplete && (
                <View style={styles.centeredOverlay}>
                    <View style={[styles.infoCard, { borderColor: 'rgba(45,212,191,0.3)' }]}>
                        <View style={styles.completeIcon}>
                            <Ionicons name="checkmark-circle" size={40} color="#2DD4BF" />
                        </View>
                        <Text style={styles.cardTitle}>Flow Complete!</Text>
                        <Text style={styles.completeSub}>You've achieved perfect sensory harmony</Text>
                        <View style={styles.completeStats}>
                            <View style={styles.completeStat}>
                                <Text style={styles.completeStatVal}>{score}</Text>
                                <Text style={styles.completeStatLabel}>Matches</Text>
                            </View>
                            <View style={styles.completeStat}>
                                <Text style={styles.completeStatVal}>{formatTime(sessionTime)}</Text>
                                <Text style={styles.completeStatLabel}>Duration</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.startBtn} onPress={startSession}>
                            <LinearGradient colors={['#14B8A6', '#06B6D4'] as const} style={styles.startBtnGrad}>
                                <Text style={styles.startBtnText}>Flow Again</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, zIndex: 20 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    closeBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    title: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    subtitle: { color: 'rgba(45,212,191,0.6)', fontSize: 12, marginTop: 2 },
    statsGrid: { flexDirection: 'row', gap: 8 },
    statBox: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 10, alignItems: 'center', minWidth: 60, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    statLabel: { color: '#6B7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
    statVal: { color: 'white', fontSize: 18, fontWeight: '300', marginTop: 2 },
    // Progress
    progressSection: { paddingHorizontal: 20, marginBottom: 8, zIndex: 20 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    levelText: { color: '#9CA3AF', fontSize: 11 },
    progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    // Play area (full screen canvas-like layer)
    playArea: { ...StyleSheet.absoluteFillObject, zIndex: 5 },
    shape: { position: 'absolute', borderWidth: 1.5, shadowOpacity: 0.7, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 8, justifyContent: 'center', alignItems: 'center' },
    shapeHighlight: { position: 'absolute', top: 5, left: 5, width: '30%', height: '30%', backgroundColor: 'rgba(255,255,255,0.3)' },
    burst: { position: 'absolute', width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    burstRing: { width: 40, height: 40, borderRadius: 20, borderWidth: 2 },
    // Zones
    zoneRow: { position: 'absolute', left: 0, right: 0 },
    zone: { position: 'absolute', width: ZONE_RADIUS * 2, height: ZONE_RADIUS * 2, borderRadius: ZONE_RADIUS, borderWidth: 2, shadowOpacity: 0.6, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 6, justifyContent: 'flex-end', alignItems: 'center', overflow: 'hidden' },
    zoneInner: { ...StyleSheet.absoluteFillObject, borderRadius: ZONE_RADIUS },
    zoneLabel: { fontSize: 11, fontWeight: 'bold', marginBottom: 6, zIndex: 2 },
    zoneLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
    // Overlays
    centeredOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 30, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(0,0,0,0.5)' },
    infoCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 28, padding: 28, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 12 },
    cardIcon: { fontSize: 52 },
    cardTitle: { color: 'white', fontWeight: 'bold', fontSize: 24 },
    cardDesc: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', lineHeight: 22 },
    startBtn: { borderRadius: 16, overflow: 'hidden', width: '100%' },
    startBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
    startBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    // Complete
    completeIcon: { width: 72, height: 72, backgroundColor: 'rgba(45,212,191,0.1)', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    completeSub: { color: '#2DD4BF', fontSize: 14 },
    completeStats: { flexDirection: 'row', gap: 16, width: '100%' },
    completeStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    completeStatVal: { color: 'white', fontWeight: 'bold', fontSize: 22 },
    completeStatLabel: { color: '#6B7280', fontSize: 11, marginTop: 2 },
});
