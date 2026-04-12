import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BG_GRADIENT } from '../config/theme';

const { width } = Dimensions.get('window');
const COLS = 5;
const ROWS = 5;
const CELL_SIZE = (width - 48 - (COLS - 1) * 6) / COLS;

type Cell = { id: number; color: string; row: number; col: number; matched: boolean; highlighted: boolean };

const COLORS = ['#EF4444', '#06FFA5', '#8338EC', '#FFD60A', '#00B4D8', '#FF006E', '#FF9E00'];

const generateGrid = (): Cell[] => {
    const grid: Cell[] = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            grid.push({
                id: r * COLS + c,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                row: r, col: c,
                matched: false,
                highlighted: false,
            });
        }
    }
    return grid;
};

const getPattern = (level: number): Set<number> => {
    const count = Math.min(3 + level, 10);
    const positions = new Set<number>();
    while (positions.size < count) {
        positions.add(Math.floor(Math.random() * (ROWS * COLS)));
    }
    return positions;
};

export default function PatternReleaseScreen({ navigation }: any) {
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
    const timerRef = useRef<any>(null);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const startLevel = useCallback((lvl: number) => {
        const newGrid = generateGrid();
        const newPattern = getPattern(lvl);
        setGrid(newGrid);
        setPattern(newPattern);
        setSelected(new Set());
        setPhase('memorize');
        setShowTime(Math.max(1.5, 3 - lvl * 0.2));
        fadeAnim.setValue(1);
    }, []);

    useEffect(() => {
        if (phase === 'memorize') {
            // Show pattern then hide
            const timer = setTimeout(() => {
                Animated.timing(fadeAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => {
                    setPhase('recall');
                });
            }, showTime * 1000);
            return () => clearTimeout(timer);
        }
    }, [phase, showTime]);

    const startGame = () => {
        setScore(0);
        setLevel(1);
        setMistakes(0);
        setIsPlaying(true);
        setIsGameOver(false);
        startLevel(1);
    };

    const handleCellPress = (id: number) => {
        if (phase !== 'recall') return;

        const newSelected = new Set(selected);

        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelected(newSelected);
    };

    const handleSubmit = () => {
        // Check accuracy
        let correct = 0;
        let wrong = 0;
        selected.forEach(id => {
            if (pattern.has(id)) correct++;
            else wrong++;
        });
        pattern.forEach(id => {
            if (!selected.has(id)) wrong++;
        });

        const perfect = wrong === 0;
        setPhase('feedback');

        if (perfect) {
            const newLevel = level + 1;
            const newScore = score + 100 * level;
            setTimeout(() => {
                setLevel(newLevel);
                setScore(newScore);
                startLevel(newLevel);
            }, 1000);
        } else {
            // Count mistake
            const newMistakes = mistakes + 1;
            setMistakes(newMistakes);
            if (newMistakes >= 3) {
                setTimeout(() => {
                    setIsGameOver(true);
                    setIsPlaying(false);
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

    return (
        <View style={styles.container}>
            <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Ionicons name="close" size={22} color="white" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.title}>Pattern Release</Text>
                    {isPlaying && <Text style={styles.phaseLabel}>{phase === 'memorize' ? '👀 Memorize' : phase === 'recall' ? '🧠 Recall' : '✅ Checking...'}</Text>}
                </View>
                <View style={styles.scoreBox}>
                    <Text style={styles.scoreText}>{score}</Text>
                </View>
            </View>

            {isPlaying && (
                <View style={styles.statsBar}>
                    <Text style={styles.statText}>Level {level}</Text>
                    <View style={styles.mistakesRow}>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Text key={i}>{i < mistakes ? '💔' : '❤️'}</Text>
                        ))}
                    </View>
                    <Text style={styles.statText}>Pattern: {pattern.size} cells</Text>
                </View>
            )}

            {/* Grid */}
            {isPlaying && (
                <Animated.View style={[styles.grid, phase === 'memorize' && { opacity: fadeAnim }]}>
                    {grid.map(cell => (
                        <TouchableOpacity
                            key={cell.id}
                            style={[
                                styles.cell,
                                isHighlighted(cell.id) && [styles.cellHighlighted, { borderColor: cell.color, backgroundColor: cell.color + '40' }],
                                isSelected(cell.id) && !isFeedbackCorrect(cell.id) && !isFeedbackWrong(cell.id) && styles.cellSelected,
                                isFeedbackCorrect(cell.id) && styles.cellCorrect,
                                isFeedbackWrong(cell.id) && styles.cellWrong,
                                isFeedbackMissed(cell.id) && styles.cellMissed,
                            ]}
                            onPress={() => handleCellPress(cell.id)}
                            disabled={phase !== 'recall'}
                        >
                            {(isHighlighted(cell.id) || isFeedbackMissed(cell.id)) && (
                                <View style={[styles.colorDot, { backgroundColor: cell.color }]} />
                            )}
                            {isSelected(cell.id) && <Ionicons name="checkmark" size={14} color="white" />}
                        </TouchableOpacity>
                    ))}
                </Animated.View>
            )}

            {/* Submit button */}
            {isPlaying && phase === 'recall' && (
                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                    <LinearGradient colors={['#10B981', '#14B8A6']} style={styles.submitBtnGrad}>
                        <Text style={styles.submitText}>Check Pattern</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {/* Start / Game Over */}
            {(!isPlaying) && (
                <View style={styles.centeredScreen}>
                    <View style={styles.card}>
                        <Text style={styles.cardIcon}>{isGameOver ? '🧩' : '🟢'}</Text>
                        <Text style={styles.cardTitle}>{isGameOver ? 'Session Complete' : 'Pattern Release'}</Text>
                        {isGameOver && <Text style={styles.cardScore}>{score}</Text>}
                        <Text style={styles.cardDesc}>
                            {isGameOver
                                ? `Level ${level} reached — great focus!`
                                : 'Memorize the highlighted pattern, then tap the same cells from memory. Trains perfectionism exposure.'}
                        </Text>
                        <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                            <LinearGradient colors={['#10B981', '#14B8A6']} style={styles.startBtnGrad}>
                                <Text style={styles.startBtnText}>{isGameOver ? 'Play Again' : 'Begin Challenge'}</Text>
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12 },
    closeBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    title: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    phaseLabel: { color: '#10B981', fontSize: 12, fontWeight: '600' },
    scoreBox: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
    scoreText: { color: 'white', fontWeight: 'bold', fontSize: 20 },
    statsBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 12 },
    statText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
    mistakesRow: { flexDirection: 'row', gap: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 6 },
    cell: { width: CELL_SIZE, height: CELL_SIZE, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    cellHighlighted: { borderWidth: 2 },
    cellSelected: { backgroundColor: 'rgba(99,102,241,0.3)', borderColor: '#6366F1', borderWidth: 2 },
    cellCorrect: { backgroundColor: 'rgba(16,185,129,0.3)', borderColor: '#10B981', borderWidth: 2 },
    cellWrong: { backgroundColor: 'rgba(239,68,68,0.3)', borderColor: '#EF4444', borderWidth: 2 },
    cellMissed: { backgroundColor: 'rgba(251,191,36,0.3)', borderColor: '#FBBF24', borderWidth: 2 },
    colorDot: { width: 12, height: 12, borderRadius: 6 },
    submitBtn: { marginHorizontal: 24, marginTop: 16, borderRadius: 14, overflow: 'hidden' },
    submitBtnGrad: { paddingVertical: 14, alignItems: 'center' },
    submitText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    centeredScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', width: '100%', gap: 12 },
    cardIcon: { fontSize: 48 },
    cardTitle: { color: 'white', fontWeight: 'bold', fontSize: 22 },
    cardScore: { fontSize: 48, fontWeight: 'bold', color: '#10B981' },
    cardDesc: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', lineHeight: 22 },
    startBtn: { borderRadius: 14, overflow: 'hidden', width: '100%' },
    startBtnGrad: { paddingVertical: 14, alignItems: 'center' },
    startBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
