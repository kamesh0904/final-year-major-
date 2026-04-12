import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BG_GRADIENT } from '../config/theme';

const { width } = Dimensions.get('window');
const GRID_COLS = 7;
const GRID_ROWS = 11;
const CELL_W = (width - 48) / GRID_COLS;
const CELL_H = 46;

// Maze-like path game
const PATH_COLORS = ['#60A5FA', '#818CF8', '#A78BFA', '#C4B5FD'];

const generateLevel = (levelNum: number) => {
    // Each level has a safe-path of cells the player must navigate
    const pathLength = Math.min(8 + levelNum * 2, 22);
    const path: { col: number; row: number }[] = [];

    let col = Math.floor(GRID_COLS / 2);
    let row = 0;
    path.push({ col, row });

    for (let i = 1; i < pathLength; i++) {
        const prevDir = i > 1 ? { dc: col - path[i - 2].col, dr: row - path[i - 2].row } : { dc: 0, dr: 1 };
        const moves = [
            { dc: 0, dr: 1 }, // down
            { dc: 1, dr: 0 }, // right
            { dc: -1, dr: 0 }, // left
        ].filter(m => {
            const nc = col + m.dc;
            const nr = row + m.dr;
            return nc >= 0 && nc < GRID_COLS && nr >= 0 && nr < GRID_ROWS;
        });
        const move = moves[Math.floor(Math.random() * moves.length)];
        col = Math.min(GRID_COLS - 1, Math.max(0, col + move.dc));
        row = Math.min(GRID_ROWS - 1, row + 1); // always go down
        if (!path.find(p => p.col === col && p.row === row)) {
            path.push({ col, row });
        }
    }

    return path;
};

export default function CalmPathScreen({ navigation }: any) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [path, setPath] = useState<{ col: number; row: number }[]>([]);
    const [playerPos, setPlayerPos] = useState({ col: 3, row: 0 });
    const [revealed, setRevealed] = useState<Set<string>>(new Set());
    const [stepIndex, setStepIndex] = useState(0);
    const [lives, setLives] = useState(3);
    const [mistakes, setMistakes] = useState<string[]>([]);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const pathSet = new Set(path.map(p => `${p.col},${p.row}`));

    const startLevel = (lvl: number) => {
        const newPath = generateLevel(lvl);
        setPath(newPath);
        setPlayerPos(newPath[0]);
        setRevealed(new Set([`${newPath[0].col},${newPath[0].row}`]));
        setStepIndex(0);
        setMistakes([]);
    };

    const startGame = () => {
        setScore(0); setLevel(1); setLives(3);
        setIsPlaying(true); setIsGameOver(false);
        startLevel(1);
    };

    const pulse = () => {
        Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
    };

    const handleCellPress = (col: number, row: number) => {
        if (!isPlaying || isGameOver) return;

        // Player can only move to adjacent cells from current position
        const { col: pc, row: pr } = playerPos;
        const isAdjacent = Math.abs(col - pc) <= 1 && Math.abs(row - pr) <= 1 && !(col === pc && row === pr);
        if (!isAdjacent) return;

        const key = `${col},${row}`;
        const newRevealed = new Set(revealed);
        newRevealed.add(key);

        if (pathSet.has(key)) {
            // Correct step
            setPlayerPos({ col, row });
            setRevealed(newRevealed);
            setScore(s => s + 5 * level);
            pulse();

            const nextStepIndex = path.findIndex(p => p.col === col && p.row === row);
            setStepIndex(nextStepIndex);

            // Check if reached end
            if (nextStepIndex >= path.length - 1) {
                const newLevel = level + 1;
                setLevel(newLevel);
                setScore(s => s + 50 * level);
                setTimeout(() => startLevel(newLevel), 800);
            }
        } else {
            // Wrong step
            const newMistakes = [...mistakes, key];
            setMistakes(newMistakes);
            newRevealed.add(key);
            setRevealed(newRevealed);

            setLives(l => {
                if (l - 1 <= 0) { setIsGameOver(true); setIsPlaying(false); return 0; }
                return l - 1;
            });
        }
    };

    const getCellStyle = (col: number, row: number) => {
        const key = `${col},${row}`;
        const isPlayer = playerPos.col === col && playerPos.row === row;
        const isPath = pathSet.has(key) && revealed.has(key);
        const isMiss = mistakes.includes(key);
        const isStart = path[0]?.col === col && path[0]?.row === row;
        const isEnd = path[path.length - 1]?.col === col && path[path.length - 1]?.row === row;

        return [
            styles.cell,
            isPath && styles.cellPath,
            isMiss && styles.cellMiss,
            isPlayer && styles.cellPlayer,
            isEnd && revealed.has(key) && styles.cellEnd,
        ];
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#060D1F', '#0D1B3E', '#091A30']} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.title}>Calm Path</Text>
                    {isPlaying && <Text style={styles.levelLabel}>Level {level}</Text>}
                </View>
                <View style={styles.scoreBox}><Text style={styles.scoreText}>{score}</Text></View>
            </View>

            {isPlaying && (
                <View style={styles.statsBar}>
                    <View style={styles.livesRow}>
                        {Array.from({ length: 3 }).map((_, i) => <Text key={i}>{i < lives ? '💙' : '🖤'}</Text>)}
                    </View>
                    <Text style={styles.hintText}>Find the calm path ✨</Text>
                    <Text style={styles.progressText}>{stepIndex}/{path.length - 1} steps</Text>
                </View>
            )}

            {isPlaying && (
                <View style={styles.grid}>
                    {Array.from({ length: GRID_ROWS }, (_, row) => (
                        <View key={row} style={styles.row}>
                            {Array.from({ length: GRID_COLS }, (_, col) => {
                                const isPlayer = playerPos.col === col && playerPos.row === row;
                                return (
                                    <TouchableOpacity
                                        key={col}
                                        style={getCellStyle(col, row)}
                                        onPress={() => handleCellPress(col, row)}
                                    >
                                        {isPlayer && (
                                            <Animated.View style={[styles.playerDot, { transform: [{ scale: pulseAnim }] }]} />
                                        )}
                                        {path[0]?.col === col && path[0]?.row === row && !isPlayer && (
                                            <Text style={{ fontSize: 10 }}>🟢</Text>
                                        )}
                                        {path[path.length - 1]?.col === col && path[path.length - 1]?.row === row && (
                                            <Text style={{ fontSize: 10 }}>🏁</Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))}
                </View>
            )}

            {!isPlaying && (
                <View style={styles.centeredScreen}>
                    <View style={styles.card}>
                        <Text style={styles.cardIcon}>{isGameOver ? '🌊' : '🛤️'}</Text>
                        <Text style={styles.cardTitle}>{isGameOver ? 'Journey Complete' : 'Calm Path'}</Text>
                        {isGameOver && <Text style={styles.cardScore}>{score}</Text>}
                        <Text style={styles.cardDesc}>
                            {isGameOver
                                ? `You reached level ${level}. The path is always within reach.`
                                : 'Find the hidden path through the grid. Tap adjacent cells to move. \nEvery wrong step costs a life. Slow down. Think. Breathe.'}
                        </Text>
                        <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                            <LinearGradient colors={['#3B82F6', '#6366F1']} style={styles.startBtnGrad}>
                                <Text style={styles.startBtnText}>{isGameOver ? 'Walk Again' : 'Find Your Path'}</Text>
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 8 },
    closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    title: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    levelLabel: { color: '#60A5FA', fontSize: 12, fontWeight: '600' },
    scoreBox: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
    scoreText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    statsBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 8 },
    livesRow: { flexDirection: 'row', gap: 2 },
    hintText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontStyle: 'italic' },
    progressText: { color: '#60A5FA', fontSize: 12, fontWeight: '600' },
    grid: { paddingHorizontal: 24 },
    row: { flexDirection: 'row', gap: 2, marginBottom: 2 },
    cell: { width: CELL_W - 2, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    cellPath: { backgroundColor: 'rgba(96,165,250,0.2)', borderColor: '#60A5FA' },
    cellMiss: { backgroundColor: 'rgba(239,68,68,0.25)', borderColor: '#EF4444' },
    cellPlayer: { backgroundColor: 'rgba(99,102,241,0.35)', borderColor: '#6366F1', borderWidth: 2 },
    cellEnd: { backgroundColor: 'rgba(16,185,129,0.25)', borderColor: '#10B981' },
    playerDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#818CF8' },
    centeredScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', width: '100%', gap: 12 },
    cardIcon: { fontSize: 48 },
    cardTitle: { color: 'white', fontWeight: 'bold', fontSize: 22 },
    cardScore: { fontSize: 48, fontWeight: 'bold', color: '#60A5FA' },
    cardDesc: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', lineHeight: 22 },
    startBtn: { borderRadius: 14, overflow: 'hidden', width: '100%' },
    startBtnGrad: { paddingVertical: 14, alignItems: 'center' },
    startBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
