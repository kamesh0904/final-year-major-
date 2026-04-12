import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BG_GRADIENT } from '../config/theme';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48 - 12) / 3;

type Rule = { name: string; description: string; check: (val: number) => boolean };

const RULES: Rule[] = [
    { name: 'Even', description: 'Tap EVEN numbers', check: n => n % 2 === 0 },
    { name: 'Odd', description: 'Tap ODD numbers', check: n => n % 2 !== 0 },
    { name: '> 5', description: 'Tap numbers GREATER than 5', check: n => n > 5 },
    { name: '< 5', description: 'Tap numbers LESS than 5', check: n => n < 5 },
    { name: 'Prime', description: 'Tap PRIME numbers (2,3,5,7)', check: n => [2, 3, 5, 7].includes(n) },
    { name: '3×', description: 'Tap MULTIPLES of 3', check: n => n % 3 === 0 },
];

const generateNumbers = () =>
    Array.from({ length: 9 }, () => Math.floor(Math.random() * 9) + 1);

export default function OrderShiftScreen({ navigation }: any) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [rule, setRule] = useState<Rule>(RULES[0]);
    const [numbers, setNumbers] = useState<number[]>([]);
    const [tapped, setTapped] = useState<Set<number>>(new Set());
    const [feedback, setFeedback] = useState<{ [key: number]: 'good' | 'bad' }>({});
    const [lives, setLives] = useState(3);
    const [timeLeft, setTimeLeft] = useState(12);
    const [ruleFlash, setRuleFlash] = useState(false);
    const timerRef = useRef<any>(null);
    const flashAnim = useRef(new Animated.Value(1)).current;

    const pickNewRule = (currentRule?: Rule) => {
        const others = RULES.filter(r => r !== (currentRule ?? rule));
        return others[Math.floor(Math.random() * others.length)];
    };

    const initRound = useCallback((newRule: Rule, timeLimit: number) => {
        setNumbers(generateNumbers());
        setTapped(new Set());
        setFeedback({});
        setTimeLeft(timeLimit);
        setRule(newRule);
        setRuleFlash(true);
        // Flash the rule display
        Animated.sequence([
            Animated.timing(flashAnim, { toValue: 0.3, duration: 150, useNativeDriver: true }),
            Animated.timing(flashAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start(() => setRuleFlash(false));
    }, []);

    const startGame = () => {
        setScore(0); setLevel(1); setLives(3); setIsPlaying(true); setIsGameOver(false);
        const firstRule = RULES[Math.floor(Math.random() * RULES.length)];
        initRound(firstRule, 12);
    };

    useEffect(() => {
        if (!isPlaying || isGameOver) return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    // Check if all correct ones tapped before time
                    setLives(l => {
                        const newLives = l - 1;
                        if (newLives <= 0) { setIsGameOver(true); setIsPlaying(false); return 0; }
                        const newRule = pickNewRule();
                        const timeLimit = Math.max(6, 12 - level);
                        setTimeout(() => initRound(newRule, timeLimit), 400);
                        return newLives;
                    });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [isPlaying, isGameOver, level]);

    const handleTap = (index: number) => {
        if (!isPlaying || tapped.has(index)) return;
        const val = numbers[index];
        const correct = rule.check(val);

        const newTapped = new Set(tapped); newTapped.add(index);
        setTapped(newTapped);
        setFeedback(f => ({ ...f, [index]: correct ? 'good' : 'bad' }));

        if (correct) {
            setScore(s => s + 10 * level);
            // Check if all correct ones are tapped
            const allCorrect = numbers.every((n, i) => !rule.check(n) || newTapped.has(i));
            if (allCorrect) {
                clearInterval(timerRef.current);
                const newLevel = level + 1;
                setLevel(newLevel);
                const newRule = pickNewRule();
                const timeLimit = Math.max(6, 12 - newLevel);
                setTimeout(() => initRound(newRule, timeLimit), 600);
            }
        } else {
            setLives(l => {
                const newLives = l - 1;
                if (newLives <= 0) { setIsGameOver(true); setIsPlaying(false); clearInterval(timerRef.current); return 0; }
                return newLives;
            });
        }
    };

    const timePercent = timeLeft / Math.max(6, 12 - level + 1);

    return (
        <View style={styles.container}>
            <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Ionicons name="close" size={22} color="white" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.title}>Order Shift</Text>
                    {isPlaying && <Text style={styles.levelText}>Level {level}</Text>}
                </View>
                <View style={styles.scoreBox}><Text style={styles.scoreText}>{score}</Text></View>
            </View>

            {isPlaying && (
                <>
                    {/* Rule display */}
                    <Animated.View style={[styles.ruleCard, { opacity: flashAnim }]}>
                        <Text style={styles.ruleName}>RULE: {rule.name}</Text>
                        <Text style={styles.ruleDesc}>{rule.description}</Text>
                    </Animated.View>

                    {/* Stats */}
                    <View style={styles.statsBar}>
                        <View style={styles.livesRow}>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Text key={i}>{i < lives ? '❤️' : '🖤'}</Text>
                            ))}
                        </View>
                        <View style={styles.timerWrap}>
                            <View style={styles.timerBar}>
                                <View style={[styles.timerFill, { width: `${timePercent * 100}%`, backgroundColor: timeLeft <= 3 ? '#EF4444' : '#8338EC' }]} />
                            </View>
                            <Text style={[styles.timerNum, { color: timeLeft <= 3 ? '#EF4444' : '#8338EC' }]}>{timeLeft}s</Text>
                        </View>
                    </View>

                    {/* Grid */}
                    <View style={styles.grid}>
                        {numbers.map((num, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[
                                    styles.numCard,
                                    feedback[i] === 'good' && styles.numGood,
                                    feedback[i] === 'bad' && styles.numBad,
                                    tapped.has(i) && !feedback[i] && styles.numTapped,
                                ]}
                                onPress={() => handleTap(i)}
                                disabled={tapped.has(i)}
                            >
                                <Text style={styles.numText}>{num}</Text>
                                {feedback[i] === 'good' && <Text style={styles.feedIcon}>✓</Text>}
                                {feedback[i] === 'bad' && <Text style={styles.feedIcon}>✗</Text>}
                            </TouchableOpacity>
                        ))}
                    </View>
                </>
            )}

            {!isPlaying && (
                <View style={styles.centeredScreen}>
                    <View style={styles.card}>
                        <Text style={styles.cardIcon}>{isGameOver ? '🔀' : '🔀'}</Text>
                        <Text style={styles.cardTitle}>{isGameOver ? 'Session Complete' : 'Order Shift'}</Text>
                        {isGameOver && <Text style={styles.cardScore}>{score}</Text>}
                        <Text style={styles.cardDesc}>{isGameOver ? `Level ${level} reached!` : 'Rules change every round. Stay sharp and adapt quickly — trains cognitive flexibility!'}</Text>
                        <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                            <LinearGradient colors={['#8B5CF6', '#EC4899']} style={styles.startBtnGrad}>
                                <Text style={styles.startBtnText}>{isGameOver ? 'Play Again' : 'Start Shifting'}</Text>
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
    levelText: { color: '#8B5CF6', fontSize: 12, fontWeight: '600' },
    scoreBox: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
    scoreText: { color: 'white', fontWeight: 'bold', fontSize: 20 },
    ruleCard: { marginHorizontal: 24, backgroundColor: 'rgba(131,56,236,0.2)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(131,56,236,0.4)', alignItems: 'center', marginBottom: 12 },
    ruleName: { color: '#C084FC', fontWeight: 'bold', fontSize: 18, marginBottom: 4 },
    ruleDesc: { color: '#E9D5FF', fontSize: 13 },
    statsBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
    livesRow: { flexDirection: 'row', gap: 4 },
    timerWrap: { flex: 1, marginLeft: 16, gap: 4 },
    timerBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
    timerFill: { height: '100%', borderRadius: 3 },
    timerNum: { fontSize: 11, fontWeight: '700', textAlign: 'right' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 12, justifyContent: 'center' },
    numCard: { width: CARD_SIZE, height: CARD_SIZE, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    numGood: { backgroundColor: 'rgba(16,185,129,0.25)', borderColor: '#10B981' },
    numBad: { backgroundColor: 'rgba(239,68,68,0.25)', borderColor: '#EF4444' },
    numTapped: { opacity: 0.5 },
    numText: { fontSize: 36, fontWeight: 'bold', color: 'white' },
    feedIcon: { fontSize: 16, position: 'absolute', top: 6, right: 8 },
    centeredScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', width: '100%', gap: 12 },
    cardIcon: { fontSize: 48 },
    cardTitle: { color: 'white', fontWeight: 'bold', fontSize: 22 },
    cardScore: { fontSize: 48, fontWeight: 'bold', color: '#A855F7' },
    cardDesc: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', lineHeight: 22 },
    startBtn: { borderRadius: 14, overflow: 'hidden', width: '100%' },
    startBtnGrad: { paddingVertical: 14, alignItems: 'center' },
    startBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
