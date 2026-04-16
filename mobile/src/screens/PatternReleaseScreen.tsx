import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BG_GRADIENT } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

const { width } = Dimensions.get('window');
const COLS = 5;
const ROWS = 5;
const CELL_SIZE = (width - 48 - (COLS - 1) * 8) / COLS;

type Cell = { id: number; color: string; row: number; col: number; matched: boolean; highlighted: boolean };

const COLORS = ['#EF4444', '#06FFA5', '#8338EC', '#FFD60A', '#00B4D8', '#FF006E', '#FF9E00'];

const generateGrid = (): Cell[] => {
    const grid: Cell[] = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            grid.push({ id: r * COLS + c, color: COLORS[Math.floor(Math.random() * COLORS.length)], row: r, col: c, matched: false, highlighted: false });
        }
    }
    return grid;
};

const getPattern = (level: number): Set<number> => {
    const count = Math.min(3 + level, 10);
    const positions = new Set<number>();
    while (positions.size < count) positions.add(Math.floor(Math.random() * (ROWS * COLS)));
    return positions;
};

export default function PatternReleaseScreen({ navigation }: any) {
    const { user } = useAuth();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [grid, setGrid] = useState<Cell[]>([]);
    const [pattern, setPattern] = useState<Set<number>>(new Set());
    const [phase, setPhase] = useState<'memorize' | 'recall' | 'feedback'>('memorize');
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [mistakes, setMistakes] = useState(0);
    const [showTime, setShowTime] = useState(2.5);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const heroScale = useRef(new Animated.Value(0.8)).current;
    const heroOpacity = useRef(new Animated.Value(0)).current;
    const cellAnims = useRef(Array.from({ length: ROWS * COLS }, () => new Animated.Value(1))).current;

    useEffect(() => {
        if (!isPlaying && !isGameOver) {
            Animated.parallel([
                Animated.spring(heroScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
                Animated.timing(heroOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            ]).start();
        }
    }, [isPlaying, isGameOver]);

    const startLevel = useCallback((lvl: number) => {
        const newGrid = generateGrid();
        const newPattern = getPattern(lvl);
        setGrid(newGrid);
        setPattern(newPattern);
        setSelected(new Set());
        setPhase('memorize');
        setShowTime(Math.max(1.5, 3 - lvl * 0.2));
        fadeAnim.setValue(1);
        cellAnims.forEach(a => a.setValue(1));
    }, []);

    useEffect(() => {
        if (phase === 'memorize') {
            const timer = setTimeout(() => {
                Animated.timing(fadeAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => setPhase('recall'));
            }, showTime * 1000);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [phase, showTime]);

    const startGame = () => {
        setScore(0); setLevel(1); setMistakes(0);
        setIsPlaying(true); setIsGameOver(false);
        heroScale.setValue(0.8); heroOpacity.setValue(0);
        startLevel(1);
    };

    const handleCellPress = (id: number) => {
        if (phase !== 'recall') return;
        const newSelected = new Set(selected);
        if (newSelected.has(id)) {
            newSelected.delete(id);
            Animated.spring(cellAnims[id], { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }).start();
        } else {
            newSelected.add(id);
            Animated.spring(cellAnims[id], { toValue: 1.08, useNativeDriver: true, tension: 200, friction: 8 }).start();
        }
        setSelected(newSelected);
    };

    const handleSubmit = () => {
        let wrong = 0;
        selected.forEach(id => { if (!pattern.has(id)) wrong++; });
        pattern.forEach(id => { if (!selected.has(id)) wrong++; });
        const perfect = wrong === 0;
        setPhase('feedback');
        if (perfect) {
            const newLevel = level + 1;
            const newScore = score + 100 * level;
            setTimeout(() => { setLevel(newLevel); setScore(newScore); startLevel(newLevel); }, 1000);
        } else {
            const newMistakes = mistakes + 1;
            setMistakes(newMistakes);
            if (newMistakes >= 3) {
                setTimeout(async () => {
                    setIsGameOver(true);
                    setIsPlaying(false);
                    if (user?.id && score > 0) {
                        try {
                            await supabase.from('game_sessions').insert({
                                user_id: user.id,
                                game_name: 'Pattern Release',
                                score: score,
                                duration_seconds: 0,
                                created_at: new Date().toISOString(),
                            });
                        } catch (err) {
                            console.error('Failed to save score', err);
                        }
                    }
                }, 1000);
            } else {
                setTimeout(() => startLevel(level), 1000);
            }
        }
    };

    const isHighlighted = (id: number) => phase === 'memorize' && pattern.has(id);
    const isSelected = (id: number) => selected.has(id);
    const isFeedbackCorrect = (id: number) => phase === 'feedback' && selected.has(id) && pattern.has(id);
    const isFeedbackWrong = (id: number) => phase === 'feedback' && selected.has(id) && !pattern.has(id);
    const isFeedbackMissed = (id: number) => phase === 'feedback' && !selected.has(id) && pattern.has(id);

    const phaseColor = phase === 'memorize' ? '#10B981' : phase === 'recall' ? '#6366F1' : '#FBBF24';
    const phaseLabel = phase === 'memorize' ? '👀  Memorize' : phase === 'recall' ? '🧠  Recall' : '✅  Checking...';

    return (
        <View style={styles.container}>
            <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
            <View style={[styles.orb, { top: -60, left: -60, backgroundColor: 'rgba(16,185,129,0.07)', width: 220, height: 220 }]} />
            <View style={[styles.orb, { bottom: 80, right: -80, backgroundColor: 'rgba(20,184,166,0.06)', width: 260, height: 260 }]} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.title}>Pattern Release</Text>
                    {isPlaying && (
                        <View style={[styles.phasePill, { backgroundColor: phaseColor + '22', borderColor: phaseColor + '55' }]}>
                            <Text style={[styles.phaseText, { color: phaseColor }]}>{phaseLabel}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.scorePill}>
                    <Text style={styles.scoreLabel}>PTS</Text>
                    <Text style={styles.scoreText}>{score}</Text>
                </View>
            </View>

            {isPlaying && (
                <View style={styles.statsBar}>
                    <View style={styles.livesPill}>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <View key={i} style={[styles.heartWrap, i >= mistakes && styles.heartActive]}>
                                <Ionicons name={i < mistakes ? 'heart-dislike' : 'heart'} size={16} color={i < mistakes ? 'rgba(255,255,255,0.2)' : '#10B981'} />
                            </View>
                        ))}
                    </View>
                    <View style={styles.levelBadge}>
                        <Text style={styles.levelBadgeText}>LVL {level}</Text>
                    </View>
                    <View style={styles.patternPill}>
                        <Ionicons name="grid" size={12} color="#10B981" />
                        <Text style={styles.patternText}>{pattern.size} cells</Text>
                    </View>
                </View>
            )}

            {/* Grid */}
            {isPlaying && (
                <Animated.View style={[styles.grid, phase === 'memorize' && { opacity: fadeAnim }]}>
                    {grid.map(cell => {
                        const highlighted = isHighlighted(cell.id);
                        const sel = isSelected(cell.id);
                        const correct = isFeedbackCorrect(cell.id);
                        const wrong = isFeedbackWrong(cell.id);
                        const missed = isFeedbackMissed(cell.id);
                        return (
                            <Animated.View key={cell.id} style={{ transform: [{ scale: cellAnims[cell.id] }] }}>
                                <TouchableOpacity
                                    style={[
                                        styles.cell,
                                        highlighted && { backgroundColor: cell.color + '30', borderColor: cell.color, borderWidth: 2, shadowColor: cell.color, shadowOpacity: 0.6, shadowRadius: 8, elevation: 6 },
                                        sel && !correct && !wrong && styles.cellSelected,
                                        correct && styles.cellCorrect,
                                        wrong && styles.cellWrong,
                                        missed && { backgroundColor: cell.color + '25', borderColor: cell.color, borderWidth: 2 },
                                    ]}
                                    onPress={() => handleCellPress(cell.id)}
                                    disabled={phase !== 'recall'}
                                    activeOpacity={0.75}
                                >
                                    {highlighted && <View style={[styles.colorDot, { backgroundColor: cell.color, shadowColor: cell.color, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4 }]} />}
                                    {missed && <View style={[styles.colorDot, { backgroundColor: cell.color }]} />}
                                    {sel && !correct && !wrong && <Ionicons name="checkmark" size={16} color="#6366F1" />}
                                    {correct && <Ionicons name="checkmark-circle" size={18} color="#10B981" />}
                                    {wrong && <Ionicons name="close-circle" size={18} color="#EF4444" />}
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}
                </Animated.View>
            )}

            {/* Submit */}
            {isPlaying && phase === 'recall' && (
                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
                    <LinearGradient colors={['#10B981', '#14B8A6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtnGrad}>
                        <Ionicons name="checkmark-done" size={18} color="white" />
                        <Text style={styles.submitText}>Check Pattern</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {/* Start / Game Over */}
            {!isPlaying && (
                <View style={styles.centeredScreen}>
                    <Animated.View style={[styles.heroIconWrap, { transform: [{ scale: heroScale }], opacity: heroOpacity }]}>
                        <LinearGradient colors={['rgba(16,185,129,0.3)', 'rgba(20,184,166,0.15)']} style={styles.heroGlow} />
                        <Text style={styles.heroIcon}>{isGameOver ? '🧩' : '🟢'}</Text>
                    </Animated.View>
                    <Animated.View style={[styles.glassCard, { opacity: heroOpacity }]}>
                        {isGameOver ? (
                            <>
                                <Text style={styles.gameOverTitle}>Session Complete</Text>
                                <LinearGradient colors={['#10B981', '#14B8A6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.scoreGradientWrap}>
                                    <Text style={styles.scoreGradientText}>{score}</Text>
                                </LinearGradient>
                                <View style={styles.levelBadgeLarge}><Text style={styles.levelBadgeLargeText}>Level {level} reached</Text></View>
                                <Text style={styles.cardDesc}>Great focus — the pattern is always within you.</Text>
                            </>
                        ) : (
                            <>
                                <LinearGradient colors={['#10B981', '#14B8A6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientTitle}>
                                    <Text style={styles.gradientTitleText}>Pattern Release</Text>
                                </LinearGradient>
                                <Text style={styles.cardDesc}>Memorize the highlighted cells, then tap them from memory.{'\n\n'}Trains perfectionism exposure — it's okay to be imperfect.</Text>
                            </>
                        )}
                        <TouchableOpacity style={styles.ctaBtn} onPress={startGame} activeOpacity={0.85}>
                            <LinearGradient colors={['#10B981', '#14B8A6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaBtnGrad}>
                                <Ionicons name={isGameOver ? 'refresh' : 'grid'} size={18} color="white" />
                                <Text style={styles.ctaBtnText}>{isGameOver ? 'Play Again' : 'Begin Challenge'}</Text>
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
    orb: { position: 'absolute', borderRadius: 999 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 58, paddingBottom: 10 },
    closeBtn: { width: 38, height: 38, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    headerCenter: { alignItems: 'center', gap: 5 },
    title: { color: 'white', fontWeight: '700', fontSize: 17, letterSpacing: 0.3 },
    phasePill: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 3, borderWidth: 1 },
    phaseText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
    scorePill: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
    scoreLabel: { color: 'rgba(156,163,175,1)', fontSize: 9, fontWeight: '600', letterSpacing: 1 },
    scoreText: { color: 'white', fontWeight: '800', fontSize: 18 },
    statsBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 },
    livesPill: { flexDirection: 'row', gap: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    heartWrap: { opacity: 0.3 },
    heartActive: { opacity: 1 },
    levelBadge: { backgroundColor: 'rgba(16,185,129,0.2)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)' },
    levelBadgeText: { color: '#6EE7B7', fontSize: 12, fontWeight: '700' },
    patternPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    patternText: { color: '#6EE7B7', fontSize: 12, fontWeight: '700' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 8, justifyContent: 'center' },
    cell: { width: CELL_SIZE, height: CELL_SIZE, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    cellSelected: { backgroundColor: 'rgba(99,102,241,0.25)', borderColor: '#6366F1', borderWidth: 2, shadowColor: '#6366F1', shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },
    cellCorrect: { backgroundColor: 'rgba(16,185,129,0.25)', borderColor: '#10B981', borderWidth: 2, shadowColor: '#10B981', shadowOpacity: 0.5, shadowRadius: 6, elevation: 4 },
    cellWrong: { backgroundColor: 'rgba(239,68,68,0.2)', borderColor: '#EF4444', borderWidth: 2 },
    colorDot: { width: 14, height: 14, borderRadius: 7 },
    submitBtn: { marginHorizontal: 20, marginTop: 18, borderRadius: 16, overflow: 'hidden', shadowColor: '#10B981', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
    submitBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
    submitText: { color: 'white', fontWeight: '800', fontSize: 16 },
    centeredScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 20 },
    heroIconWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    heroGlow: { position: 'absolute', width: 140, height: 140, borderRadius: 70 },
    heroIcon: { fontSize: 72 },
    glassCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', width: '100%', gap: 14, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
    gradientTitle: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 6 },
    gradientTitleText: { color: 'white', fontWeight: '800', fontSize: 22, letterSpacing: 0.5 },
    cardDesc: { color: 'rgba(156,163,175,1)', fontSize: 14, textAlign: 'center', lineHeight: 22 },
    ctaBtn: { borderRadius: 16, overflow: 'hidden', width: '100%', shadowColor: '#10B981', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
    ctaBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
    ctaBtnText: { color: 'white', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
    gameOverTitle: { color: 'white', fontWeight: '700', fontSize: 20 },
    scoreGradientWrap: { borderRadius: 16, paddingHorizontal: 28, paddingVertical: 10 },
    scoreGradientText: { color: 'white', fontWeight: '900', fontSize: 52, letterSpacing: -1 },
    levelBadgeLarge: { backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
    levelBadgeLargeText: { color: '#6EE7B7', fontSize: 13, fontWeight: '700' },
});
