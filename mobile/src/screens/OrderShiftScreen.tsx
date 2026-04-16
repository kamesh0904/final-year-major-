import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BG_GRADIENT } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48 - 12) / 3;

type Rule = { name: string; description: string; check: (val: number) => boolean };

const RULES: Rule[] = [
    { name: 'Even', description: 'Tap EVEN numbers', check: n => n % 2 === 0 },
    { name: 'Odd', description: 'Tap ODD numbers', check: n => n % 2 !== 0 },
    { name: '> 5', description: 'Tap numbers GREATER than 5', check: n => n > 5 },
    { name: '< 5', description: 'Tap numbers LESS than 5', check: n => n < 5 },
    { name: 'Prime', description: 'Tap PRIME numbers (2,3,5,7)', check: n => [2, 3, 5, 7].includes(n) },
    { name: '3x', description: 'Tap MULTIPLES of 3', check: n => n % 3 === 0 },
];

const generateNumbers = () => Array.from({ length: 9 }, () => Math.floor(Math.random() * 9) + 1);

export default function OrderShiftScreen({ navigation }: any) {
    const { user } = useAuth();
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
    const timerRef = useRef<any>(null);
    const flashAnim = useRef(new Animated.Value(1)).current;
    const ruleScaleAnim = useRef(new Animated.Value(1)).current;
    const cardAnims = useRef(Array.from({ length: 9 }, () => new Animated.Value(1))).current;
    const heroScale = useRef(new Animated.Value(0.8)).current;
    const heroOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!isPlaying && !isGameOver) {
            Animated.parallel([
                Animated.spring(heroScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
                Animated.timing(heroOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            ]).start();
        }
    }, [isPlaying, isGameOver]);

    useEffect(() => {
        if (isGameOver && score > 0 && user?.id) {
            const saveScore = async () => {
                try {
                    await supabase.from('game_sessions').insert({
                        user_id: user.id,
                        game_name: 'Order Shift',
                        score: score,
                        duration_seconds: 0,
                        created_at: new Date().toISOString(),
                    });
                } catch (err) {
                    console.error('Failed to save score', err);
                }
            };
            saveScore();
        }
    }, [isGameOver, score, user?.id]);

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
        cardAnims.forEach(a => a.setValue(1));
        Animated.sequence([
            Animated.timing(ruleScaleAnim, { toValue: 1.08, duration: 120, useNativeDriver: true }),
            Animated.spring(ruleScaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
        ]).start();
        Animated.sequence([
            Animated.timing(flashAnim, { toValue: 0.4, duration: 120, useNativeDriver: true }),
            Animated.timing(flashAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start();
    }, []);

    const startGame = () => {
        setScore(0); setLevel(1); setLives(3);
        setIsPlaying(true); setIsGameOver(false);
        heroScale.setValue(0.8); heroOpacity.setValue(0);
        const firstRule = RULES[Math.floor(Math.random() * RULES.length)];
        initRound(firstRule, 12);
    };

    useEffect(() => {
        if (!isPlaying || isGameOver) return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
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
            Animated.spring(cardAnims[index], { toValue: 1.12, useNativeDriver: true, tension: 200, friction: 5 }).start(() =>
                Animated.spring(cardAnims[index], { toValue: 1, useNativeDriver: true, tension: 200, friction: 5 }).start()
            );
            setScore(s => s + 10 * level);
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
            Animated.sequence([
                Animated.timing(cardAnims[index], { toValue: 0.88, duration: 70, useNativeDriver: true }),
                Animated.timing(cardAnims[index], { toValue: 1, duration: 70, useNativeDriver: true }),
            ]).start();
            setLives(l => {
                const newLives = l - 1;
                if (newLives <= 0) { setIsGameOver(true); setIsPlaying(false); clearInterval(timerRef.current); return 0; }
                return newLives;
            });
        }
    };

    const timePercent = timeLeft / Math.max(6, 12 - level + 1);
    const timerGradient: [string, string] = timeLeft <= 3 ? ['#EF4444', '#DC2626'] : timeLeft <= 6 ? ['#F59E0B', '#D97706'] : ['#8B5CF6', '#EC4899'];
    const timerColor = timeLeft <= 3 ? '#EF4444' : timeLeft <= 6 ? '#F59E0B' : '#C084FC';

    return (
        <View style={styles.container}>
            <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
            <View style={[styles.orb, { top: -60, right: -60, backgroundColor: 'rgba(139,92,246,0.08)', width: 240, height: 240 }]} />
            <View style={[styles.orb, { bottom: 80, left: -80, backgroundColor: 'rgba(236,72,153,0.06)', width: 260, height: 260 }]} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.title}>Order Shift</Text>
                    {isPlaying && <View style={styles.levelBadge}><Text style={styles.levelBadgeText}>LVL {level}</Text></View>}
                </View>
                <View style={styles.scorePill}>
                    <Text style={styles.scoreLabel}>PTS</Text>
                    <Text style={styles.scoreText}>{score}</Text>
                </View>
            </View>
            {isPlaying && (
                <>
                    <Animated.View style={[styles.ruleCard, { opacity: flashAnim, transform: [{ scale: ruleScaleAnim }] }]}>
                        <LinearGradient colors={['rgba(139,92,246,0.25)', 'rgba(236,72,153,0.15)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
                        <View style={styles.ruleInner}>
                            <View style={styles.ruleBadge}><Text style={styles.ruleBadgeText}>RULE</Text></View>
                            <Text style={styles.ruleName}>{rule.name}</Text>
                        </View>
                        <Text style={styles.ruleDesc}>{rule.description}</Text>
                    </Animated.View>
                    <View style={styles.statsBar}>
                        <View style={styles.livesPill}>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <View key={i} style={[styles.heartWrap, i < lives && styles.heartActive]}>
                                    <Ionicons name={i < lives ? 'heart' : 'heart-outline'} size={16} color={i < lives ? '#A78BFA' : 'rgba(255,255,255,0.2)'} />
                                </View>
                            ))}
                        </View>
                        <View style={styles.timerWrap}>
                            <View style={styles.timerTrack}>
                                <View style={[styles.timerFill, { width: `${timePercent * 100}%` }]}>
                                    <LinearGradient colors={timerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                                </View>
                            </View>
                            <Text style={[styles.timerNum, { color: timerColor }]}>{timeLeft}s</Text>
                        </View>
                    </View>
                    <View style={styles.grid}>
                        {numbers.map((num, i) => (
                            <Animated.View key={i} style={{ transform: [{ scale: cardAnims[i] }] }}>
                                <TouchableOpacity
                                    style={[styles.numCard, feedback[i] === 'good' && styles.numGood, feedback[i] === 'bad' && styles.numBad, tapped.has(i) && !feedback[i] && styles.numTapped]}
                                    onPress={() => handleTap(i)} disabled={tapped.has(i)} activeOpacity={0.75}
                                >
                                    <Text style={[styles.numText, feedback[i] === 'good' && { color: '#A78BFA' }, feedback[i] === 'bad' && { color: '#EF4444' }]}>{num}</Text>
                                    {feedback[i] === 'good' && <View style={styles.feedBadgeGood}><Ionicons name="checkmark" size={12} color="#A78BFA" /></View>}
                                    {feedback[i] === 'bad' && <View style={styles.feedBadgeBad}><Ionicons name="close" size={12} color="#EF4444" /></View>}
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </View>
                </>
            )}
            {!isPlaying && (
                <View style={styles.centeredScreen}>
                    <Animated.View style={[styles.heroIconWrap, { transform: [{ scale: heroScale }], opacity: heroOpacity }]}>
                        <LinearGradient colors={['rgba(139,92,246,0.3)', 'rgba(236,72,153,0.15)']} style={styles.heroGlow} />
                        <Text style={styles.heroIcon}>🔀</Text>
                    </Animated.View>
                    <Animated.View style={[styles.glassCard, { opacity: heroOpacity }]}>
                        {isGameOver ? (
                            <>
                                <Text style={styles.gameOverTitle}>Session Complete</Text>
                                <LinearGradient colors={['#8B5CF6', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.scoreGradientWrap}>
                                    <Text style={styles.scoreGradientText}>{score}</Text>
                                </LinearGradient>
                                <View style={styles.levelBadgeLarge}><Text style={styles.levelBadgeLargeText}>Level {level} reached</Text></View>
                            </>
                        ) : (
                            <>
                                <LinearGradient colors={['#8B5CF6', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientTitle}>
                                    <Text style={styles.gradientTitleText}>Order Shift</Text>
                                </LinearGradient>
                                <Text style={styles.cardDesc}>Rules change every round. Stay sharp and adapt quickly.</Text>
                            </>
                        )}
                        <TouchableOpacity style={styles.ctaBtn} onPress={startGame} activeOpacity={0.85}>
                            <LinearGradient colors={['#8B5CF6', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaBtnGrad}>
                                <Ionicons name={isGameOver ? 'refresh' : 'shuffle'} size={18} color="white" />
                                <Text style={styles.ctaBtnText}>{isGameOver ? 'Play Again' : 'Start Shifting'}</Text>
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
    headerCenter: { alignItems: 'center', gap: 4 },
    title: { color: 'white', fontWeight: '700', fontSize: 17 },
    levelBadge: { backgroundColor: 'rgba(139,92,246,0.2)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)' },
    levelBadgeText: { color: '#C084FC', fontSize: 11, fontWeight: '700' },
    scorePill: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
    scoreLabel: { color: 'rgba(156,163,175,1)', fontSize: 9, fontWeight: '600', letterSpacing: 1 },
    scoreText: { color: 'white', fontWeight: '800', fontSize: 18 },
    ruleCard: { marginHorizontal: 20, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(139,92,246,0.35)', alignItems: 'center', marginBottom: 14, overflow: 'hidden', gap: 6 },
    ruleInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    ruleBadge: { backgroundColor: 'rgba(139,92,246,0.3)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(139,92,246,0.5)' },
    ruleBadgeText: { color: '#C084FC', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    ruleName: { color: 'white', fontWeight: '900', fontSize: 28 },
    ruleDesc: { color: 'rgba(196,181,253,0.8)', fontSize: 13, fontWeight: '500' },
    statsBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16, gap: 12 },
    livesPill: { flexDirection: 'row', gap: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    heartWrap: { opacity: 0.3 },
    heartActive: { opacity: 1 },
    timerWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    timerTrack: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
    timerFill: { height: '100%', borderRadius: 4, overflow: 'hidden' },
    timerNum: { fontSize: 12, fontWeight: '800', minWidth: 28, textAlign: 'right' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 12, justifyContent: 'center' },
    numCard: { width: CARD_SIZE, height: CARD_SIZE, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    numGood: { backgroundColor: 'rgba(167,139,250,0.2)', borderColor: '#A78BFA', borderWidth: 2, shadowColor: '#A78BFA', shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 },
    numBad: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#EF4444', borderWidth: 2 },
    numTapped: { opacity: 0.4 },
    numText: { fontSize: 36, fontWeight: '900', color: 'white' },
    feedBadgeGood: { position: 'absolute', top: 6, right: 8, backgroundColor: 'rgba(167,139,250,0.3)', borderRadius: 8, padding: 2 },
    feedBadgeBad: { position: 'absolute', top: 6, right: 8, backgroundColor: 'rgba(239,68,68,0.3)', borderRadius: 8, padding: 2 },
    centeredScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 20 },
    heroIconWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    heroGlow: { position: 'absolute', width: 140, height: 140, borderRadius: 70 },
    heroIcon: { fontSize: 72 },
    glassCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', width: '100%', gap: 14 },
    gradientTitle: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 6 },
    gradientTitleText: { color: 'white', fontWeight: '800', fontSize: 22 },
    cardDesc: { color: 'rgba(156,163,175,1)', fontSize: 14, textAlign: 'center', lineHeight: 22 },
    ctaBtn: { borderRadius: 16, overflow: 'hidden', width: '100%' },
    ctaBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
    ctaBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },
    gameOverTitle: { color: 'white', fontWeight: '700', fontSize: 20 },
    scoreGradientWrap: { borderRadius: 16, paddingHorizontal: 28, paddingVertical: 10 },
    scoreGradientText: { color: 'white', fontWeight: '900', fontSize: 52 },
    levelBadgeLarge: { backgroundColor: 'rgba(139,92,246,0.15)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
    levelBadgeLargeText: { color: '#C084FC', fontSize: 13, fontWeight: '700' },
});
