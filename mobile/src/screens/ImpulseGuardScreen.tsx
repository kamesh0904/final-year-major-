import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated,
    Dimensions, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BG_GRADIENT } from '../config/theme';

const { width } = Dimensions.get('window');
const GRID = 4;
const CELL = (width - 80) / GRID;

const TARGETS = ['🎯', '⭕', '🟢', '🔵', '🟡'];
const HAZARDS = ['❌', '💣', '🔴', '⛔', '🟥'];
const DISTRACTORS = ['🌀', '⬜', '🔲', '🟫', '⬛'];

const generateBoard = (level: number) => {
    const size = GRID * GRID;
    const targetCount = Math.max(1, 3 - Math.floor(level / 5));
    const hazardCount = Math.min(8, 2 + Math.floor(level / 3));

    const board: { symbol: string; type: 'target' | 'hazard' | 'distractor' }[] = [];
    const cells = Array.from({ length: size }, (_, i) => i);

    const shuffle = (arr: number[]) => arr.sort(() => Math.random() - 0.5);
    const shuffled = shuffle(cells);

    const targets = shuffled.slice(0, targetCount).map(i => ({ index: i, symbol: TARGETS[Math.floor(Math.random() * TARGETS.length)], type: 'target' as const }));
    const hazards = shuffled.slice(targetCount, targetCount + hazardCount).map(i => ({ index: i, symbol: HAZARDS[Math.floor(Math.random() * HAZARDS.length)], type: 'hazard' as const }));
    const rest = shuffled.slice(targetCount + hazardCount).map(i => ({ index: i, symbol: DISTRACTORS[Math.floor(Math.random() * DISTRACTORS.length)], type: 'distractor' as const }));

    const allItems = [...targets, ...hazards, ...rest];
    const sortedBoard = Array(size).fill(null);
    allItems.forEach(item => { sortedBoard[item.index] = item; });
    return { board: sortedBoard, targetCount };
};

export default function ImpulseGuardScreen({ navigation }: any) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);
    const [board, setBoard] = useState<any[]>([]);
    const [targetCount, setTargetCount] = useState(3);
    const [targetsFound, setTargetsFound] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);
    const [revealed, setRevealed] = useState<boolean[]>([]);
    const [feedback, setFeedback] = useState<{ [key: number]: 'good' | 'bad' | null }>({});
    const timerRef = useRef<any>(null);
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const initBoard = useCallback((lvl: number) => {
        const { board: b, targetCount: tc } = generateBoard(lvl);
        setBoard(b);
        setTargetCount(tc);
        setTargetsFound(0);
        setRevealed(Array(GRID * GRID).fill(false));
        setFeedback({});
        setTimeLeft(Math.max(8, 15 - lvl));
    }, []);

    const startGame = () => {
        setScore(0);
        setLevel(1);
        setLives(3);
        setIsPlaying(true);
        setIsGameOver(false);
        initBoard(1);
    };

    const shakeScreen = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
    };

    useEffect(() => {
        if (!isPlaying || isGameOver) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    // Time's up — lose a life
                    setLives(l => {
                        if (l - 1 <= 0) {
                            setIsGameOver(true);
                            setIsPlaying(false);
                            return 0;
                        }
                        shakeScreen();
                        initBoard(level);
                        return l - 1;
                    });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [isPlaying, isGameOver, level]);

    const handleCellPress = (index: number) => {
        if (!isPlaying || revealed[index]) return;
        const cell = board[index];
        if (!cell) return;

        const newRevealed = [...revealed];
        newRevealed[index] = true;
        setRevealed(newRevealed);

        if (cell.type === 'target') {
            setFeedback(f => ({ ...f, [index]: 'good' }));
            const newFound = targetsFound + 1;
            setTargetsFound(newFound);
            setScore(s => s + 10 * level);

            if (newFound >= targetCount) {
                // Level up!
                clearInterval(timerRef.current);
                const newLevel = level + 1;
                setLevel(newLevel);
                setTimeout(() => initBoard(newLevel), 600);
            }
        } else if (cell.type === 'hazard') {
            setFeedback(f => ({ ...f, [index]: 'bad' }));
            shakeScreen();
            setLives(l => {
                if (l - 1 <= 0) {
                    setIsGameOver(true);
                    setIsPlaying(false);
                    clearInterval(timerRef.current);
                    return 0;
                }
                return l - 1;
            });
        }
        // distractor — no effect
    };

    const timePercent = timeLeft / Math.max(8, 15 - level + 1);

    return (
        <View style={styles.container}>
            <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Ionicons name="close" size={22} color="white" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.title}>Impulse Guard</Text>
                    <Text style={styles.levelText}>Level {level}</Text>
                </View>
                <View style={styles.scoreBox}>
                    <Text style={styles.scoreText}>{score}</Text>
                </View>
            </View>

            <Animated.View style={{ flex: 1, transform: [{ translateX: shakeAnim }] }}>

                {/* Stats Bar */}
                {isPlaying && (
                    <View style={styles.statsBar}>
                        {/* Lives */}
                        <View style={styles.livesRow}>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Text key={i} style={{ fontSize: 18 }}>{i < lives ? '❤️' : '🖤'}</Text>
                            ))}
                        </View>
                        {/* Timer */}
                        <View style={styles.timerContainer}>
                            <View style={styles.timerBar}>
                                <View style={[styles.timerFill, { width: `${timePercent * 100}%`, backgroundColor: timeLeft <= 3 ? '#EF4444' : '#06FFA5' }]} />
                            </View>
                            <Text style={[styles.timerNum, { color: timeLeft <= 3 ? '#EF4444' : '#06FFA5' }]}>{timeLeft}s</Text>
                        </View>
                        {/* Targets */}
                        <Text style={styles.targetInfo}>{targetsFound}/{targetCount} 🎯</Text>
                    </View>
                )}

                {/* Board */}
                {isPlaying && (
                    <View style={styles.board}>
                        {board.map((cell, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[
                                    styles.cell,
                                    revealed[i] && feedback[i] === 'good' && styles.cellGood,
                                    revealed[i] && feedback[i] === 'bad' && styles.cellBad,
                                    revealed[i] && !feedback[i] && styles.cellRevealed,
                                ]}
                                onPress={() => handleCellPress(i)}
                                disabled={revealed[i]}
                            >
                                <Text style={styles.cellText}>
                                    {revealed[i] ? (cell?.symbol || '·') : '❓'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Start Screen */}
                {!isPlaying && !isGameOver && (
                    <View style={styles.centeredScreen}>
                        <View style={styles.instructCard}>
                            <Text style={styles.instructIcon}>🛡️</Text>
                            <Text style={styles.instructTitle}>Impulse Guard</Text>
                            <Text style={styles.instructText}>
                                Reveal cells by tapping. Find the 🎯 targets while avoiding ❌ hazards.{'\n\n'}Training impulse control — think before you tap!
                            </Text>
                            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                                <LinearGradient colors={['#EF4444', '#F97316']} style={styles.startBtnGrad}>
                                    <Text style={styles.startBtnText}>Start Training</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Game Over */}
                {isGameOver && (
                    <View style={styles.centeredScreen}>
                        <View style={styles.instructCard}>
                            <Text style={styles.instructIcon}>💔</Text>
                            <Text style={styles.instructTitle}>Session Complete</Text>
                            <Text style={styles.scoreDisplay}>{score}</Text>
                            <Text style={styles.levelReached}>Level {level} reached</Text>
                            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                                <LinearGradient colors={['#EF4444', '#F97316']} style={styles.startBtnGrad}>
                                    <Text style={styles.startBtnText}>Train Again</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12 },
    closeBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    title: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    levelText: { color: '#F97316', fontSize: 12, fontWeight: '600' },
    scoreBox: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
    scoreText: { color: 'white', fontWeight: 'bold', fontSize: 20 },
    statsBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 12, gap: 12 },
    livesRow: { flexDirection: 'row', gap: 4 },
    timerContainer: { flex: 1, gap: 4 },
    timerBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
    timerFill: { height: '100%', borderRadius: 3 },
    timerNum: { fontSize: 11, fontWeight: '700' },
    targetInfo: { color: 'white', fontWeight: '700', fontSize: 14 },
    board: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 6 },
    cell: { width: CELL - 6, height: CELL - 6, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    cellGood: { backgroundColor: 'rgba(6,255,165,0.2)', borderColor: '#06FFA5' },
    cellBad: { backgroundColor: 'rgba(239,68,68,0.2)', borderColor: '#EF4444' },
    cellRevealed: { backgroundColor: 'rgba(255,255,255,0.04)' },
    cellText: { fontSize: CELL * 0.35 },
    centeredScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    instructCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', width: '100%' },
    instructIcon: { fontSize: 48, marginBottom: 12 },
    instructTitle: { color: 'white', fontWeight: 'bold', fontSize: 22, marginBottom: 12 },
    instructText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    scoreDisplay: { fontSize: 48, fontWeight: 'bold', color: '#F97316', marginBottom: 4 },
    levelReached: { color: '#9CA3AF', fontSize: 14, marginBottom: 20 },
    startBtn: { borderRadius: 14, overflow: 'hidden', width: '100%' },
    startBtnGrad: { paddingVertical: 14, alignItems: 'center', borderRadius: 14 },
    startBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
