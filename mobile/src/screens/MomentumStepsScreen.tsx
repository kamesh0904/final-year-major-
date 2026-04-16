import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BG_GRADIENT } from '../config/theme';

const { width } = Dimensions.get('window');

const STEPS = [
    { id: 1, icon: 'water-outline' as const, title: 'Drink Water', desc: 'Take a sip of water right now', xp: 10, color: '#06B6D4', glow: 'rgba(6,182,212,0.12)' },
    { id: 2, icon: 'leaf-outline' as const, title: 'Take 3 Breaths', desc: 'Breathe in deeply, three times', xp: 15, color: '#8B5CF6', glow: 'rgba(139,92,246,0.12)' },
    { id: 3, icon: 'body-outline' as const, title: 'Stretch for 30s', desc: 'Roll your shoulders gently', xp: 20, color: '#10B981', glow: 'rgba(16,185,129,0.12)' },
    { id: 4, icon: 'sunny-outline' as const, title: 'Step Outside', desc: 'Look at natural light for a moment', xp: 25, color: '#F59E0B', glow: 'rgba(245,158,11,0.12)' },
    { id: 5, icon: 'pencil-outline' as const, title: 'Write One Thing', desc: 'Note anything you notice right now', xp: 30, color: '#EC4899', glow: 'rgba(236,72,153,0.12)' },
    { id: 6, icon: 'musical-notes-outline' as const, title: 'Play a Song', desc: 'Play your favourite calming song', xp: 20, color: '#6366F1', glow: 'rgba(99,102,241,0.12)' },
    { id: 7, icon: 'people-outline' as const, title: 'Reach Out', desc: 'Send a message to someone you care about', xp: 35, color: '#F97316', glow: 'rgba(249,115,22,0.12)' },
    { id: 8, icon: 'trophy-outline' as const, title: 'Celebrate', desc: 'You have done something today. That matters.', xp: 50, color: '#FBBF24', glow: 'rgba(251,191,36,0.12)' },
];

export default function MomentumStepsScreen({ navigation }: any) {
    const [isStarted, setIsStarted] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [totalXP, setTotalXP] = useState(0);
    const [streak, setStreak] = useState(0);
    const [activeStep, setActiveStep] = useState<number | null>(null);
    const [celebrating, setCelebrating] = useState(false);
    const checkAnims = useRef(STEPS.map(() => new Animated.Value(0))).current;
    const celebAnim = useRef(new Animated.Value(0)).current;
    const heroScale = useRef(new Animated.Value(0.8)).current;
    const heroOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!isStarted) {
            Animated.parallel([
                Animated.spring(heroScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
                Animated.timing(heroOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            ]).start();
        }
    }, [isStarted]);

    const handleStepPress = (step: typeof STEPS[0]) => {
        if (completedSteps.has(step.id)) return;
        setActiveStep(step.id);
    };

    const handleComplete = (step: typeof STEPS[0]) => {
        if (completedSteps.has(step.id)) return;
        const newCompleted = new Set(completedSteps);
        newCompleted.add(step.id);
        setCompletedSteps(newCompleted);
        setTotalXP(x => x + step.xp);
        setActiveStep(null);
        Animated.spring(checkAnims[STEPS.indexOf(step)], { toValue: 1, useNativeDriver: true, tension: 100, friction: 7 }).start();
        if (newCompleted.size === STEPS.length) {
            setCelebrating(true);
            Animated.spring(celebAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }).start();
            setStreak(s => s + 1);
        }
    };

    const resetSession = () => {
        setIsStarted(false);
        setCompletedSteps(new Set());
        setTotalXP(0);
        setActiveStep(null);
        setCelebrating(false);
        checkAnims.forEach(a => a.setValue(0));
        celebAnim.setValue(0);
        heroScale.setValue(0.8);
        heroOpacity.setValue(0);
    };

    const progressPercent = completedSteps.size / STEPS.length;

    return (
        <View style={styles.container}>
            <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
            <View style={[styles.orb, { top: -80, right: -60, backgroundColor: 'rgba(99,102,241,0.07)', width: 240, height: 240 }]} />
            <View style={[styles.orb, { bottom: 100, left: -80, backgroundColor: 'rgba(168,85,247,0.06)', width: 280, height: 280 }]} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.title}>Momentum Steps</Text>
                    {isStarted && (
                        <View style={styles.xpPill}>
                            <Ionicons name="flash" size={11} color="#FBBF24" />
                            <Text style={styles.xpPillText}>{totalXP} XP</Text>
                        </View>
                    )}
                </View>
                {streak > 0 ? (
                    <View style={styles.streakBox}>
                        <Text style={styles.streakNum}>{streak}</Text>
                        <Text style={styles.streakLabel}>streak</Text>
                    </View>
                ) : <View style={{ width: 50 }} />}
            </View>

            {!isStarted ? (
                <View style={styles.centeredScreen}>
                    <Animated.View style={[styles.heroIconWrap, { transform: [{ scale: heroScale }], opacity: heroOpacity }]}>
                        <LinearGradient colors={['rgba(99,102,241,0.3)', 'rgba(168,85,247,0.15)']} style={styles.heroGlow} />
                        <Text style={styles.heroIcon}>🚶</Text>
                    </Animated.View>
                    <Animated.View style={[styles.glassCard, { opacity: heroOpacity }]}>
                        <LinearGradient colors={['#6366F1', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientTitle}>
                            <Text style={styles.gradientTitleText}>Momentum Steps</Text>
                        </LinearGradient>
                        <Text style={styles.cardDesc}>Small wins build momentum.{'\n\n'}Each step is designed to gently activate your motivation and fight depression inertia.{'\n\n'}You don't need to do everything. Just start.</Text>
                        <TouchableOpacity style={styles.ctaBtn} onPress={() => setIsStarted(true)} activeOpacity={0.85}>
                            <LinearGradient colors={['#6366F1', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaBtnGrad}>
                                <Ionicons name="walk" size={18} color="white" />
                                <Text style={styles.ctaBtnText}>Take the First Step</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            ) : (
                <>
                    <View style={styles.progressSection}>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${progressPercent * 100}%` }]}>
                                <LinearGradient colors={['#6366F1', '#A855F7', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                            </View>
                        </View>
                        <Text style={styles.progressLabel}>{completedSteps.size}/{STEPS.length}</Text>
                    </View>

                    {celebrating && (
                        <Animated.View style={[styles.celebBanner, { transform: [{ scale: celebAnim }], opacity: celebAnim }]}>
                            <LinearGradient colors={['rgba(99,102,241,0.3)', 'rgba(168,85,247,0.3)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} />
                            <Text style={styles.celebEmoji}>🎉</Text>
                            <View>
                                <Text style={styles.celebTitle}>You did it!</Text>
                                <Text style={styles.celebSub}>+{totalXP} XP earned today</Text>
                            </View>
                        </Animated.View>
                    )}

                    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                        {STEPS.map((step, i) => {
                            const done = completedSteps.has(step.id);
                            const active = activeStep === step.id;
                            return (
                                <TouchableOpacity
                                    key={step.id}
                                    style={[styles.stepCard, done && styles.stepDone, active && { borderColor: step.color + '60', backgroundColor: step.glow }, { borderLeftColor: step.color, borderLeftWidth: 3 }]}
                                    onPress={() => !done && handleStepPress(step)}
                                    activeOpacity={done ? 1 : 0.8}
                                >
                                    <View style={[styles.stepIconCircle, { backgroundColor: step.color + '22', borderColor: step.color + '44' }]}>
                                        <Ionicons name={step.icon} size={22} color={step.color} />
                                    </View>
                                    <View style={styles.stepInfo}>
                                        <Text style={[styles.stepTitle, done && styles.stepTitleDone]}>{step.title}</Text>
                                        <Text style={styles.stepDesc}>{step.desc}</Text>
                                        <View style={[styles.xpBadge, { backgroundColor: step.color + '22', borderColor: step.color + '44' }]}>
                                            <Ionicons name="flash" size={10} color={step.color} />
                                            <Text style={[styles.xpBadgeText, { color: step.color }]}>+{step.xp} XP</Text>
                                        </View>
                                    </View>
                                    <Animated.View style={[styles.checkCircle, { backgroundColor: done ? step.color : 'rgba(255,255,255,0.06)', borderColor: done ? step.color : 'rgba(255,255,255,0.15)', transform: [{ scale: checkAnims[i] }] }]}>
                                        {done && <Ionicons name="checkmark" size={16} color="white" />}
                                    </Animated.View>

                                    {active && (
                                        <View style={styles.confirmOverlay}>
                                            <LinearGradient colors={['rgba(10,5,20,0.97)', 'rgba(15,8,30,0.97)']} style={StyleSheet.absoluteFill} />
                                            <Text style={styles.confirmText}>Did you do it?</Text>
                                            <TouchableOpacity style={styles.confirmYesBtn} onPress={() => handleComplete(step)} activeOpacity={0.85}>
                                                <LinearGradient colors={[step.color, step.color + 'CC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmYesGrad}>
                                                    <Ionicons name="checkmark" size={14} color="white" />
                                                    <Text style={styles.confirmYesText}>Yes!</Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setActiveStep(null)}>
                                                <Text style={styles.confirmNo}>Not yet</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                        {celebrating && (
                            <TouchableOpacity style={styles.resetBtn} onPress={resetSession} activeOpacity={0.7}>
                                <Text style={styles.resetText}>Start Fresh Session</Text>
                            </TouchableOpacity>
                        )}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                </>
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
    title: { color: 'white', fontWeight: '700', fontSize: 17, letterSpacing: 0.3 },
    xpPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251,191,36,0.15)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)' },
    xpPillText: { color: '#FBBF24', fontSize: 11, fontWeight: '700' },
    streakBox: { backgroundColor: 'rgba(251,191,36,0.12)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(251,191,36,0.25)' },
    streakNum: { color: '#FBBF24', fontWeight: '800', fontSize: 18 },
    streakLabel: { color: 'rgba(156,163,175,1)', fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },
    centeredScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 20 },
    heroIconWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    heroGlow: { position: 'absolute', width: 140, height: 140, borderRadius: 70 },
    heroIcon: { fontSize: 72 },
    glassCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', width: '100%', gap: 14, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
    gradientTitle: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 6 },
    gradientTitleText: { color: 'white', fontWeight: '800', fontSize: 22, letterSpacing: 0.5 },
    cardDesc: { color: 'rgba(156,163,175,1)', fontSize: 14, textAlign: 'center', lineHeight: 22 },
    ctaBtn: { borderRadius: 16, overflow: 'hidden', width: '100%', shadowColor: '#6366F1', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
    ctaBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
    ctaBtnText: { color: 'white', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
    progressSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10, marginBottom: 10 },
    progressTrack: { flex: 1, height: 7, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4, overflow: 'hidden' },
    progressLabel: { color: 'rgba(156,163,175,1)', fontSize: 12, fontWeight: '600', minWidth: 32, textAlign: 'right' },
    celebBanner: { marginHorizontal: 20, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(139,92,246,0.35)', overflow: 'hidden' },
    celebEmoji: { fontSize: 28 },
    celebTitle: { color: 'white', fontWeight: '800', fontSize: 15 },
    celebSub: { color: '#C084FC', fontSize: 12, fontWeight: '600' },
    scroll: { paddingHorizontal: 20, gap: 10 },
    stepCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 12, position: 'relative', overflow: 'hidden' },
    stepDone: { opacity: 0.55 },
    stepIconCircle: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    stepInfo: { flex: 1, gap: 3 },
    stepTitle: { color: 'white', fontWeight: '700', fontSize: 15 },
    stepTitleDone: { textDecorationLine: 'line-through', color: '#6B7280' },
    stepDesc: { color: 'rgba(156,163,175,1)', fontSize: 12, lineHeight: 17 },
    xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, alignSelf: 'flex-start' },
    xpBadgeText: { fontSize: 11, fontWeight: '700' },
    checkCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
    confirmOverlay: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 155, justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 12, overflow: 'hidden' },
    confirmText: { color: 'white', fontSize: 12, fontWeight: '700' },
    confirmYesBtn: { borderRadius: 10, overflow: 'hidden', width: '100%' },
    confirmYesGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8 },
    confirmYesText: { color: 'white', fontWeight: '800', fontSize: 13 },
    confirmNo: { color: 'rgba(156,163,175,1)', fontSize: 12, fontWeight: '500' },
    resetBtn: { alignItems: 'center', padding: 16 },
    resetText: { color: 'rgba(156,163,175,1)', fontSize: 13, textDecorationLine: 'underline' },
});
