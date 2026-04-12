import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const STEPS = [
    { id: 1, icon: '💧', title: 'Drink Water', desc: 'Take a sip of water right now', xp: 10, color: '#06B6D4' },
    { id: 2, icon: '🌬️', title: 'Take 3 Breaths', desc: 'Breathe in deeply, three times', xp: 15, color: '#8B5CF6' },
    { id: 3, icon: '🧘', title: 'Stretch for 30s', desc: 'Roll your shoulders gently', xp: 20, color: '#10B981' },
    { id: 4, icon: '☀️', title: 'Step Outside', desc: 'Look at natural light for a moment', xp: 25, color: '#F59E0B' },
    { id: 5, icon: '📝', title: 'Write One Thing', desc: 'Note anything you notice right now', xp: 30, color: '#EC4899' },
    { id: 6, icon: '🎵', title: 'Play a Song', desc: 'Play your favourite calming song', xp: 20, color: '#6366F1' },
    { id: 7, icon: '🤝', title: 'Reach Out', desc: 'Send a message to someone you care about', xp: 35, color: '#F97316' },
    { id: 8, icon: '🏆', title: 'Celebrate', desc: 'You have done something today. That matters.', xp: 50, color: '#FBBF24' },
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

        // Animate checkmark
        Animated.spring(checkAnims[STEPS.indexOf(step)], {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 7,
        }).start();

        // After all complete — celebrate
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
    };

    const progressPercent = completedSteps.size / STEPS.length;

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0A0514', '#1A0835', '#0F0814']} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.title}>Momentum Steps</Text>
                    {isStarted && <Text style={styles.xpText}>+{totalXP} XP ⚡</Text>}
                </View>
                {streak > 0 ? <View style={styles.streakBox}><Text style={styles.streakNum}>{streak}</Text><Text style={styles.streakLabel}>streak</Text></View> : <View style={{ width: 50 }} />}
            </View>

            {!isStarted ? (
                <View style={styles.centeredScreen}>
                    <View style={styles.card}>
                        <Text style={styles.cardIcon}>🚶</Text>
                        <Text style={styles.cardTitle}>Momentum Steps</Text>
                        <Text style={styles.cardDesc}>
                            Small wins build momentum.{'\n\n'}
                            Each step is designed to gently activate your motivation and fight depression inertia.{'\n\n'}
                            You don't need to do everything. Just start.
                        </Text>
                        <TouchableOpacity style={styles.startBtn} onPress={() => setIsStarted(true)}>
                            <LinearGradient colors={['#6366F1', '#A855F7']} style={styles.startBtnGrad}>
                                <Ionicons name="walk" size={18} color="white" />
                                <Text style={styles.startBtnText}>Take the First Step</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <>
                    {/* Progress */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressBar}>
                            <LinearGradient colors={['#6366F1', '#A855F7', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: `${progressPercent * 100}%` }]} />
                        </View>
                        <Text style={styles.progressLabel}>{completedSteps.size}/{STEPS.length} steps</Text>
                    </View>

                    {celebrating && (
                        <Animated.View style={[styles.celebBox, { transform: [{ scale: celebAnim }] }]}>
                            <Text style={styles.celebText}>🎉 You did it! +{totalXP} XP earned!</Text>
                        </Animated.View>
                    )}

                    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                        {STEPS.map((step, i) => {
                            const done = completedSteps.has(step.id);
                            const active = activeStep === step.id;
                            return (
                                <TouchableOpacity
                                    key={step.id}
                                    style={[styles.stepCard, done && styles.stepDone, active && styles.stepActive]}
                                    onPress={() => !done && handleStepPress(step)}
                                >
                                    <View style={[styles.stepIcon, { backgroundColor: step.color + '20' }]}>
                                        <Text style={styles.stepEmoji}>{step.icon}</Text>
                                    </View>
                                    <View style={styles.stepInfo}>
                                        <Text style={[styles.stepTitle, done && styles.stepTitleDone]}>{step.title}</Text>
                                        <Text style={styles.stepDesc}>{step.desc}</Text>
                                        <Text style={[styles.stepXP, { color: step.color }]}>+{step.xp} XP</Text>
                                    </View>
                                    <Animated.View style={[styles.checkCircle, { backgroundColor: step.color, transform: [{ scale: checkAnims[i] }] }]}>
                                        <Ionicons name="checkmark" size={16} color="white" />
                                    </Animated.View>

                                    {active && (
                                        <View style={styles.confirmOverlay}>
                                            <Text style={styles.confirmText}>Did you do it?</Text>
                                            <TouchableOpacity style={[styles.confirmYes, { backgroundColor: step.color }]} onPress={() => handleComplete(step)}>
                                                <Text style={styles.confirmYesText}>Yes! ✓</Text>
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
                            <TouchableOpacity style={styles.resetBtn} onPress={resetSession}>
                                <Text style={styles.resetText}>Start Fresh Session</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12 },
    closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    title: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    xpText: { color: '#A855F7', fontSize: 12, fontWeight: '600' },
    streakBox: { backgroundColor: 'rgba(255,165,0,0.15)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
    streakNum: { color: '#FBBF24', fontWeight: 'bold', fontSize: 18 },
    streakLabel: { color: '#9CA3AF', fontSize: 10 },
    centeredScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', width: '100%', gap: 12 },
    cardIcon: { fontSize: 48 },
    cardTitle: { color: 'white', fontWeight: 'bold', fontSize: 22 },
    cardDesc: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', lineHeight: 22 },
    startBtn: { borderRadius: 14, overflow: 'hidden', width: '100%' },
    startBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
    startBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    progressSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 10, marginBottom: 8 },
    progressBar: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    progressLabel: { color: '#9CA3AF', fontSize: 12 },
    celebBox: { marginHorizontal: 24, backgroundColor: 'rgba(168,85,247,0.2)', borderRadius: 14, padding: 12, alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: 'rgba(168,85,247,0.4)' },
    celebText: { color: '#C084FC', fontWeight: 'bold', fontSize: 16 },
    scroll: { paddingHorizontal: 24, paddingBottom: 100, gap: 10 },
    stepCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 12, position: 'relative', overflow: 'hidden' },
    stepDone: { opacity: 0.6, backgroundColor: 'rgba(255,255,255,0.02)' },
    stepActive: { borderColor: 'rgba(139,92,246,0.5)', backgroundColor: 'rgba(139,92,246,0.08)' },
    stepIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    stepEmoji: { fontSize: 24 },
    stepInfo: { flex: 1 },
    stepTitle: { color: 'white', fontWeight: '700', fontSize: 15, marginBottom: 2 },
    stepTitleDone: { textDecorationLine: 'line-through', color: '#6B7280' },
    stepDesc: { color: '#9CA3AF', fontSize: 13, marginBottom: 4 },
    stepXP: { fontSize: 12, fontWeight: '700' },
    checkCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    confirmOverlay: { position: 'absolute', right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(10,5,20,0.95)', width: 160, justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
    confirmText: { color: 'white', fontSize: 12, fontWeight: '600' },
    confirmYes: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
    confirmYesText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    confirmNo: { color: '#6B7280', fontSize: 12 },
    resetBtn: { alignItems: 'center', padding: 16 },
    resetText: { color: '#6B7280', fontSize: 14, textDecorationLine: 'underline' },
});
