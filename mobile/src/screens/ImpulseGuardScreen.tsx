import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BG_GRADIENT } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

const { width } = Dimensions.get('window');

const TOTAL_ROUNDS = 18;
const START_RESPONSE_WINDOW = 1300;
const MIN_RESPONSE_WINDOW = 700;
const FEEDBACK_DELAY = 950;
const BEST_SCORE_KEY = 'neuronest_impulse_guard_best_v2';
const CONTENT_WIDTH = Math.min(width - 32, 380);
const METER_WIDTH = CONTENT_WIDTH - 48;

type Phase = 'intro' | 'ready' | 'cue' | 'feedback' | 'summary';
type CueKind = 'go' | 'hold';
type FeedbackTone = 'good' | 'bad' | 'neutral';

type SessionSummary = {
    score: number;
    accuracy: number;
    avgReactionMs: number | null;
    correctGo: number;
    correctHold: number;
    missedGo: number;
    impulseErrors: number;
    bestStreak: number;
    durationSeconds: number;
    coachNote: string;
};

const CUE_CONFIG: Record<CueKind, {
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    colors: [string, string];
    accent: string;
}> = {
    go: {
        title: 'GO',
        subtitle: 'Tap once, then release.',
        icon: 'play',
        colors: ['#10B981', '#06B6D4'],
        accent: '#34D399',
    },
    hold: {
        title: 'HOLD',
        subtitle: 'Keep your hands still.',
        icon: 'pause',
        colors: ['#EF4444', '#F97316'],
        accent: '#FB7185',
    },
};

export default function ImpulseGuardScreen({ navigation }: any) {
    const { user } = useAuth();
    const [phase, setPhase] = useState<Phase>('intro');
    const [round, setRound] = useState(0);
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [shields, setShields] = useState(3);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [currentCue, setCurrentCue] = useState<CueKind | null>(null);
    const [responseWindowMs, setResponseWindowMs] = useState(START_RESPONSE_WINDOW);
    const [statusTitle, setStatusTitle] = useState('Train your pause before you act');
    const [statusDescription, setStatusDescription] = useState(
        'Tap only when the cue says GO. On HOLD, let the urge pass.'
    );
    const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>('neutral');
    const [summary, setSummary] = useState<SessionSummary | null>(null);

    const prepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cueTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const responseHandledRef = useRef(false);
    const cueShownAtRef = useRef<number | null>(null);
    const sessionStartedAtRef = useRef<number | null>(null);
    const recentCuesRef = useRef<CueKind[]>([]);

    const roundRef = useRef(0);
    const scoreRef = useRef(0);
    const shieldsRef = useRef(3);
    const streakRef = useRef(0);
    const bestStreakRef = useRef(0);
    const correctGoRef = useRef(0);
    const correctHoldRef = useRef(0);
    const missedGoRef = useRef(0);
    const impulseErrorsRef = useRef(0);
    const reactionTimesRef = useRef<number[]>([]);

    const cueScale = useRef(new Animated.Value(0.96)).current;
    const meterAnim = useRef(new Animated.Value(0)).current;
    const padScale = useRef(new Animated.Value(1)).current;
    const padPulseRef = useRef<Animated.CompositeAnimation | null>(null);

    const clearTimers = useCallback(() => {
        if (prepTimeoutRef.current) {
            clearTimeout(prepTimeoutRef.current);
            prepTimeoutRef.current = null;
        }

        if (cueTimeoutRef.current) {
            clearTimeout(cueTimeoutRef.current);
            cueTimeoutRef.current = null;
        }
    }, []);

    const stopPadPulse = useCallback(() => {
        padPulseRef.current?.stop();
        padPulseRef.current = null;
        padScale.stopAnimation();
        padScale.setValue(1);
    }, [padScale]);

    const animateCueCard = useCallback(() => {
        cueScale.setValue(0.96);
        Animated.spring(cueScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 110,
            friction: 9,
        }).start();
    }, [cueScale]);

    const startPadPulse = useCallback(() => {
        stopPadPulse();
        padPulseRef.current = Animated.loop(
            Animated.sequence([
                Animated.timing(padScale, {
                    toValue: 1.04,
                    duration: 180,
                    useNativeDriver: true,
                }),
                Animated.timing(padScale, {
                    toValue: 1,
                    duration: 180,
                    useNativeDriver: true,
                }),
            ])
        );
        padPulseRef.current.start();
    }, [padScale, stopPadPulse]);

    const bumpScore = useCallback((delta: number) => {
        const next = Math.max(0, scoreRef.current + delta);
        scoreRef.current = next;
        setScore(next);
        return next;
    }, []);

    const resetStreak = useCallback(() => {
        streakRef.current = 0;
        setStreak(0);
    }, []);

    const advanceStreak = useCallback(() => {
        const next = streakRef.current + 1;
        streakRef.current = next;
        setStreak(next);

        if (next > bestStreakRef.current) {
            bestStreakRef.current = next;
            setBestStreak(next);
        }

        return next;
    }, []);

    const loseShield = useCallback(() => {
        const next = Math.max(0, shieldsRef.current - 1);
        shieldsRef.current = next;
        setShields(next);
        return next;
    }, []);

    const buildCoachNote = useCallback((
        correctHold: number,
        missedGo: number,
        impulseErrors: number,
        avgReactionMs: number | null
    ) => {
        if (impulseErrors <= 2 && correctHold >= 4) {
            return 'Strong inhibition. You were able to pause, wait for the real signal, and let the stop cues pass.';
        }

        if (impulseErrors > missedGo) {
            return 'The hardest part was acting too early. Before each round, soften your shoulders and wait for the full cue before moving.';
        }

        if (missedGo > impulseErrors) {
            return 'You resisted well, but sometimes held back too long. Aim for one calm, confident tap when the green cue appears.';
        }

        if (avgReactionMs !== null && avgReactionMs < 500) {
            return 'Fast and steady. Keep that same controlled speed while protecting against early taps.';
        }

        return 'Balanced session. Keep practicing one clean action on GO and relaxed stillness on HOLD.';
    }, []);

    const persistBestScore = useCallback(async (nextBest: number) => {
        try {
            await AsyncStorage.setItem(BEST_SCORE_KEY, String(nextBest));
        } catch (error) {
            console.error('Failed to store Impulse Guard best score:', error);
        }
    }, []);

    const saveGameSession = useCallback(async (finalScore: number, durationSeconds: number) => {
        if (!user?.id || durationSeconds <= 0) {
            return;
        }

        try {
            const { error } = await supabase.from('game_sessions').insert({
                user_id: user.id,
                game_name: 'Impulse Guard',
                score: finalScore,
                duration_seconds: durationSeconds,
                created_at: new Date().toISOString(),
            });

            if (error) {
                console.error('Impulse Guard session save warning:', error);
            }
        } catch (error) {
            console.error('Impulse Guard session save failed:', error);
        }
    }, [user?.id]);

    const finishSession = useCallback(async () => {
        clearTimers();
        stopPadPulse();
        meterAnim.stopAnimation();

        const durationSeconds = sessionStartedAtRef.current
            ? Math.max(1, Math.round((Date.now() - sessionStartedAtRef.current) / 1000))
            : 0;
        const totalTrials = correctGoRef.current + correctHoldRef.current + missedGoRef.current + impulseErrorsRef.current;
        const accuracy = totalTrials > 0
            ? Math.round(((correctGoRef.current + correctHoldRef.current) / totalTrials) * 100)
            : 0;
        const avgReactionMs = reactionTimesRef.current.length > 0
            ? Math.round(
                reactionTimesRef.current.reduce((sum, value) => sum + value, 0) / reactionTimesRef.current.length
            )
            : null;
        const nextBest = Math.max(bestScore, scoreRef.current);

        if (nextBest !== bestScore) {
            setBestScore(nextBest);
            await persistBestScore(nextBest);
        }

        await saveGameSession(avgReactionMs ?? 0, durationSeconds);

        setSummary({
            score: scoreRef.current,
            accuracy,
            avgReactionMs,
            correctGo: correctGoRef.current,
            correctHold: correctHoldRef.current,
            missedGo: missedGoRef.current,
            impulseErrors: impulseErrorsRef.current,
            bestStreak: bestStreakRef.current,
            durationSeconds,
            coachNote: buildCoachNote(
                correctHoldRef.current,
                missedGoRef.current,
                impulseErrorsRef.current,
                avgReactionMs
            ),
        });
        setCurrentCue(null);
        setPhase('summary');
        setFeedbackTone('neutral');
        setStatusTitle('Session complete');
        setStatusDescription('Review what happened, then train again.');
    }, [
        bestScore,
        buildCoachNote,
        clearTimers,
        meterAnim,
        persistBestScore,
        saveGameSession,
        stopPadPulse,
    ]);

    const scheduleNextRound = useCallback((nextRound: number) => {
        if (nextRound > TOTAL_ROUNDS || shieldsRef.current <= 0) {
            finishSession();
            return;
        }

        clearTimers();
        stopPadPulse();
        responseHandledRef.current = false;
        cueShownAtRef.current = null;
        setCurrentCue(null);
        roundRef.current = nextRound;
        setRound(nextRound);
        setPhase('ready');
        setFeedbackTone('neutral');
        setStatusTitle('Wait for the cue');
        setStatusDescription('Stay still until a clear signal appears.');

        animateCueCard();

        const prepDelay = 850 + Math.floor(Math.random() * 650);
        prepTimeoutRef.current = setTimeout(() => {
            const noTapChance = nextRound <= 6 ? 0.3 : nextRound <= 12 ? 0.38 : 0.45;
            let nextCue: CueKind = Math.random() < noTapChance ? 'hold' : 'go';

            const recent = recentCuesRef.current.slice(-2);
            if (recent.length === 2 && recent.every((cue) => cue === 'hold') && nextCue === 'hold') {
                nextCue = 'go';
            }

            recentCuesRef.current = [...recentCuesRef.current.slice(-2), nextCue];
            setCurrentCue(nextCue);
            setPhase('cue');
            setFeedbackTone('neutral');
            setStatusTitle(CUE_CONFIG[nextCue].title);
            setStatusDescription(CUE_CONFIG[nextCue].subtitle);

            const nextWindow = Math.max(
                MIN_RESPONSE_WINDOW,
                START_RESPONSE_WINDOW - (nextRound - 1) * 35
            );
            setResponseWindowMs(nextWindow);
            responseHandledRef.current = false;
            cueShownAtRef.current = Date.now();

            animateCueCard();
            meterAnim.stopAnimation();
            meterAnim.setValue(METER_WIDTH);
            Animated.timing(meterAnim, {
                toValue: 0,
                duration: nextWindow,
                useNativeDriver: false,
            }).start();

            if (nextCue === 'go') {
                startPadPulse();
            } else {
                stopPadPulse();
            }

            cueTimeoutRef.current = setTimeout(() => {
                if (responseHandledRef.current) {
                    return;
                }

                responseHandledRef.current = true;
                stopPadPulse();

                if (nextCue === 'go') {
                    missedGoRef.current += 1;
                    const remainingShields = loseShield();
                    resetStreak();
                    bumpScore(-4);
                    setPhase('feedback');
                    setFeedbackTone('bad');
                    setStatusTitle('Missed the moment');
                    setStatusDescription('That was a GO cue. One calm tap was enough.');
                    animateCueCard();

                    cueTimeoutRef.current = setTimeout(() => {
                        if (remainingShields <= 0 || nextRound >= TOTAL_ROUNDS) {
                            finishSession();
                            return;
                        }

                        scheduleNextRound(nextRound + 1);
                    }, FEEDBACK_DELAY);
                    return;
                }

                correctHoldRef.current += 1;
                advanceStreak();
                bumpScore(14);
                setPhase('feedback');
                setFeedbackTone('good');
                setStatusTitle('Good restraint');
                setStatusDescription('You let the red cue pass without reacting.');
                animateCueCard();

                cueTimeoutRef.current = setTimeout(() => {
                    if (nextRound >= TOTAL_ROUNDS) {
                        finishSession();
                        return;
                    }

                    scheduleNextRound(nextRound + 1);
                }, FEEDBACK_DELAY);
            }, nextWindow);
        }, prepDelay);
    }, [
        advanceStreak,
        animateCueCard,
        bumpScore,
        clearTimers,
        finishSession,
        loseShield,
        meterAnim,
        resetStreak,
        startPadPulse,
        stopPadPulse,
    ]);

    const startSession = useCallback(() => {
        clearTimers();
        stopPadPulse();
        meterAnim.stopAnimation();
        recentCuesRef.current = [];
        sessionStartedAtRef.current = Date.now();
        responseHandledRef.current = false;
        cueShownAtRef.current = null;

        scoreRef.current = 0;
        shieldsRef.current = 3;
        streakRef.current = 0;
        bestStreakRef.current = 0;
        correctGoRef.current = 0;
        correctHoldRef.current = 0;
        missedGoRef.current = 0;
        impulseErrorsRef.current = 0;
        reactionTimesRef.current = [];

        setScore(0);
        setShields(3);
        setStreak(0);
        setBestStreak(0);
        setRound(0);
        setCurrentCue(null);
        setSummary(null);
        setResponseWindowMs(START_RESPONSE_WINDOW);
        setFeedbackTone('neutral');
        setStatusTitle('Get ready');
        setStatusDescription('Wait for the signal, then respond with control.');
        setPhase('ready');

        scheduleNextRound(1);
    }, [clearTimers, meterAnim, scheduleNextRound, stopPadPulse]);

    const handleResponsePress = useCallback(() => {
        if (phase === 'intro' || phase === 'summary' || phase === 'feedback') {
            return;
        }

        clearTimers();
        stopPadPulse();

        if (phase === 'ready') {
            responseHandledRef.current = true;
            impulseErrorsRef.current += 1;
            const remainingShields = loseShield();
            resetStreak();
            bumpScore(-5);
            setPhase('feedback');
            setFeedbackTone('bad');
            setStatusTitle('Too early');
            setStatusDescription('The cue had not appeared yet. Let the signal come to you.');
            animateCueCard();

            cueTimeoutRef.current = setTimeout(() => {
                if (remainingShields <= 0 || roundRef.current >= TOTAL_ROUNDS) {
                    finishSession();
                    return;
                }

                scheduleNextRound(roundRef.current + 1);
            }, FEEDBACK_DELAY);
            return;
        }

        if (phase !== 'cue' || responseHandledRef.current || !currentCue) {
            return;
        }

        responseHandledRef.current = true;

        if (currentCue === 'hold') {
            impulseErrorsRef.current += 1;
            const remainingShields = loseShield();
            resetStreak();
            bumpScore(-5);
            setPhase('feedback');
            setFeedbackTone('bad');
            setStatusTitle('Caught by impulse');
            setStatusDescription('That was a HOLD cue. Let the urge rise and pass.');
            animateCueCard();

            cueTimeoutRef.current = setTimeout(() => {
                if (remainingShields <= 0 || roundRef.current >= TOTAL_ROUNDS) {
                    finishSession();
                    return;
                }

                scheduleNextRound(roundRef.current + 1);
            }, FEEDBACK_DELAY);
            return;
        }

        const reactionMs = cueShownAtRef.current
            ? Math.max(120, Date.now() - cueShownAtRef.current)
            : responseWindowMs;
        reactionTimesRef.current = [...reactionTimesRef.current, reactionMs];
        correctGoRef.current += 1;

        const nextStreak = advanceStreak();
        const speedBonus = Math.max(0, Math.round((responseWindowMs - reactionMs) / 90));
        const streakBonus = nextStreak >= 3 ? 4 : 0;
        bumpScore(12 + speedBonus + streakBonus);

        setPhase('feedback');
        setFeedbackTone('good');
        setStatusTitle('Clean response');
        setStatusDescription(`You waited for GO and responded in ${reactionMs}ms.`);
        animateCueCard();

        cueTimeoutRef.current = setTimeout(() => {
            if (roundRef.current >= TOTAL_ROUNDS) {
                finishSession();
                return;
            }

            scheduleNextRound(roundRef.current + 1);
        }, FEEDBACK_DELAY);
    }, [
        advanceStreak,
        animateCueCard,
        bumpScore,
        clearTimers,
        currentCue,
        finishSession,
        loseShield,
        phase,
        resetStreak,
        responseWindowMs,
        scheduleNextRound,
        stopPadPulse,
    ]);

    useEffect(() => {
        const loadBestScore = async () => {
            try {
                const raw = await AsyncStorage.getItem(BEST_SCORE_KEY);
                if (!raw) {
                    return;
                }

                const nextBest = Number.parseInt(raw, 10);
                if (Number.isFinite(nextBest)) {
                    setBestScore(nextBest);
                }
            } catch (error) {
                console.error('Failed to load Impulse Guard best score:', error);
            }
        };

        loadBestScore();

        return () => {
            clearTimers();
            stopPadPulse();
            meterAnim.stopAnimation();
        };
    }, [clearTimers, meterAnim, stopPadPulse]);

    const cueConfig = currentCue ? CUE_CONFIG[currentCue] : null;
    const cueColors: [string, string] =
        phase === 'cue' && cueConfig
            ? cueConfig.colors
            : feedbackTone === 'good'
                ? ['rgba(16,185,129,0.26)', 'rgba(6,182,212,0.12)']
                : feedbackTone === 'bad'
                    ? ['rgba(239,68,68,0.26)', 'rgba(249,115,22,0.12)']
                    : ['rgba(99,102,241,0.2)', 'rgba(139,92,246,0.1)'];
    const cueAccent =
        phase === 'cue' && cueConfig
            ? cueConfig.accent
            : feedbackTone === 'good'
                ? '#34D399'
                : feedbackTone === 'bad'
                    ? '#FB7185'
                    : '#A78BFA';
    const meterWidth = phase === 'cue'
        ? meterAnim
        : phase === 'ready'
            ? METER_WIDTH
            : 0;
    const responsePadColors: [string, string] =
        phase === 'cue' && currentCue === 'go'
            ? ['#10B981', '#06B6D4']
            : phase === 'cue' && currentCue === 'hold'
                ? ['rgba(239,68,68,0.55)', 'rgba(249,115,22,0.55)']
                : ['rgba(99,102,241,0.45)', 'rgba(139,92,246,0.45)'];
    const responsePadLabel =
        phase === 'cue' && currentCue === 'go'
            ? 'Tap Now'
            : phase === 'cue' && currentCue === 'hold'
                ? 'Stay Still'
                : 'Wait';
    const responsePadHint =
        phase === 'cue' && currentCue === 'go'
            ? 'One clean tap'
            : phase === 'cue' && currentCue === 'hold'
                ? 'Do not press'
                : 'Hold steady';

    return (
        <View style={styles.container}>
            <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
            <View style={[styles.orb, styles.orbTop]} />
            <View style={[styles.orb, styles.orbBottom]} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Ionicons name="close" size={20} color="rgba(255,255,255,0.78)" />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.title}>Impulse Guard</Text>
                    <Text style={styles.subtitle}>Pause first. Act on purpose.</Text>
                </View>

                <View style={styles.scorePill}>
                    <Text style={styles.scorePillLabel}>BEST</Text>
                    <Text style={styles.scorePillValue}>{bestScore}</Text>
                </View>
            </View>

            {phase === 'intro' && (
                <View style={styles.screenBody}>
                    <View style={styles.heroBadge}>
                        <LinearGradient colors={['rgba(239,68,68,0.28)', 'rgba(249,115,22,0.12)']} style={styles.heroBadgeGlow} />
                        <Ionicons name="shield" size={42} color="#FB7185" />
                    </View>

                    <View style={styles.mainCard}>
                        <Text style={styles.mainTitle}>A clearer impulse-control drill</Text>
                        <Text style={styles.mainCopy}>
                            You will see one cue at a time. Tap only on green <Text style={styles.boldCopy}>GO</Text>.
                            When the cue turns red and says <Text style={styles.boldCopy}>HOLD</Text>, keep your hands still until it disappears.
                        </Text>

                        <View style={styles.legendRow}>
                            <View style={[styles.legendCard, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.35)' }]}>
                                <Ionicons name="play" size={18} color="#34D399" />
                                <Text style={styles.legendTitle}>GO</Text>
                                <Text style={styles.legendText}>Tap once</Text>
                            </View>
                            <View style={[styles.legendCard, { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.35)' }]}>
                                <Ionicons name="pause" size={18} color="#FB7185" />
                                <Text style={styles.legendTitle}>HOLD</Text>
                                <Text style={styles.legendText}>Do not tap</Text>
                            </View>
                        </View>

                        <View style={styles.tipList}>
                            <Text style={styles.tipItem}>Keep your thumb resting, not hovering.</Text>
                            <Text style={styles.tipItem}>A fast wrong tap costs more than a calm delay.</Text>
                            <Text style={styles.tipItem}>Three shields means three mistakes before the session ends.</Text>
                        </View>

                        <TouchableOpacity style={styles.primaryButton} onPress={startSession} activeOpacity={0.85}>
                            <LinearGradient colors={['#EF4444', '#F97316']} style={styles.primaryButtonGradient}>
                                <Ionicons name="play" size={18} color="white" />
                                <Text style={styles.primaryButtonText}>Start Training</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {(phase === 'ready' || phase === 'cue' || phase === 'feedback') && (
                <View style={styles.screenBody}>
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Score</Text>
                            <Text style={styles.statValue}>{score}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Round</Text>
                            <Text style={styles.statValue}>{round}/{TOTAL_ROUNDS}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Streak</Text>
                            <Text style={styles.statValue}>{streak}</Text>
                        </View>
                    </View>

                    <View style={styles.shieldRow}>
                        {Array.from({ length: 3 }).map((_, index) => (
                            <View key={index} style={[styles.shieldBubble, index < shields && styles.shieldBubbleActive]}>
                                <Ionicons
                                    name={index < shields ? 'shield' : 'shield-outline'}
                                    size={18}
                                    color={index < shields ? '#FB7185' : 'rgba(255,255,255,0.25)'}
                                />
                            </View>
                        ))}
                    </View>

                    <Animated.View style={[styles.mainCard, { transform: [{ scale: cueScale }] }]}>
                        <LinearGradient colors={cueColors} style={styles.cueCard}>
                            <View style={styles.cueHeader}>
                                <View style={[styles.cueIcon, { borderColor: `${cueAccent}66` }]}>
                                    <Ionicons
                                        name={phase === 'cue' && cueConfig ? cueConfig.icon : 'timer-outline'}
                                        size={26}
                                        color={cueAccent}
                                    />
                                </View>
                                <View style={styles.cueTextWrap}>
                                    <Text style={[styles.cueTitle, { color: cueAccent }]}>{statusTitle}</Text>
                                    <Text style={styles.cueDescription}>{statusDescription}</Text>
                                </View>
                            </View>

                            <View style={styles.meterTrack}>
                                <Animated.View style={[styles.meterFill, { width: meterWidth, backgroundColor: cueAccent }]} />
                            </View>

                            <Text style={styles.helperText}>
                                {phase === 'ready'
                                    ? 'Do not tap during the waiting phase.'
                                    : phase === 'cue' && currentCue === 'go'
                                        ? 'Respond with one deliberate tap.'
                                        : phase === 'cue' && currentCue === 'hold'
                                            ? 'Notice the urge and let it pass.'
                                            : feedbackTone === 'good'
                                                ? 'That is the feeling we want: calm, then action.'
                                                : 'Reset with one breath and try the next cue.'}
                            </Text>
                        </LinearGradient>
                    </Animated.View>

                    <Animated.View style={{ width: '100%', transform: [{ scale: padScale }] }}>
                        <TouchableOpacity
                            style={styles.responseButton}
                            onPress={handleResponsePress}
                            disabled={phase === 'feedback'}
                            activeOpacity={0.88}
                        >
                            <LinearGradient colors={responsePadColors} style={styles.responseButtonGradient}>
                                <Ionicons name="flash" size={24} color="white" />
                                <View>
                                    <Text style={styles.responseButtonLabel}>{responsePadLabel}</Text>
                                    <Text style={styles.responseButtonHint}>{responsePadHint}</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            )}

            {phase === 'summary' && summary && (
                <View style={styles.screenBody}>
                    <View style={styles.heroBadge}>
                        <LinearGradient colors={['rgba(16,185,129,0.24)', 'rgba(99,102,241,0.12)']} style={styles.heroBadgeGlow} />
                        <Ionicons name="sparkles" size={42} color="#A78BFA" />
                    </View>

                    <View style={styles.mainCard}>
                        <Text style={styles.mainTitle}>Session complete</Text>
                        <Text style={styles.scoreHero}>{summary.score}</Text>
                        <Text style={styles.summarySub}>
                            Accuracy {summary.accuracy}% {summary.avgReactionMs ? `• Avg reaction ${summary.avgReactionMs}ms` : ''}
                        </Text>

                        <View style={styles.summaryGrid}>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryValue}>{summary.correctGo}</Text>
                                <Text style={styles.summaryLabel}>GO hits</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryValue}>{summary.correctHold}</Text>
                                <Text style={styles.summaryLabel}>HOLD resisted</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryValue}>{summary.impulseErrors}</Text>
                                <Text style={styles.summaryLabel}>Impulse taps</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryValue}>{summary.bestStreak}</Text>
                                <Text style={styles.summaryLabel}>Best streak</Text>
                            </View>
                        </View>

                        <View style={styles.coachNoteCard}>
                            <Text style={styles.coachNoteTitle}>Coach note</Text>
                            <Text style={styles.coachNoteText}>{summary.coachNote}</Text>
                        </View>

                        <TouchableOpacity style={styles.primaryButton} onPress={startSession} activeOpacity={0.85}>
                            <LinearGradient colors={['#EF4444', '#F97316']} style={styles.primaryButtonGradient}>
                                <Ionicons name="refresh" size={18} color="white" />
                                <Text style={styles.primaryButtonText}>Train Again</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    orb: {
        position: 'absolute',
        borderRadius: 999,
    },
    orbTop: {
        width: 240,
        height: 240,
        top: -70,
        right: -60,
        backgroundColor: 'rgba(239,68,68,0.08)',
    },
    orbBottom: {
        width: 300,
        height: 300,
        bottom: -110,
        left: -90,
        backgroundColor: 'rgba(249,115,22,0.08)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 12,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        alignItems: 'center',
        flex: 1,
    },
    title: {
        color: 'white',
        fontSize: 19,
        fontWeight: '800',
    },
    subtitle: {
        color: 'rgba(209,213,219,0.72)',
        fontSize: 12,
        marginTop: 2,
    },
    scorePill: {
        minWidth: 68,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
    },
    scorePillLabel: {
        color: 'rgba(156,163,175,1)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    scorePillValue: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
    },
    screenBody: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingBottom: 28,
        gap: 18,
    },
    heroBadge: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    heroBadgeGlow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 44,
    },
    mainCard: {
        width: '100%',
        maxWidth: CONTENT_WIDTH,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 26,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        gap: 18,
    },
    mainTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
    },
    mainCopy: {
        color: '#D1D5DB',
        fontSize: 15,
        lineHeight: 23,
        textAlign: 'center',
    },
    boldCopy: {
        color: 'white',
        fontWeight: '800',
    },
    legendRow: {
        flexDirection: 'row',
        gap: 12,
    },
    legendCard: {
        flex: 1,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        gap: 6,
    },
    legendTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
    legendText: {
        color: '#D1D5DB',
        fontSize: 13,
    },
    tipList: {
        gap: 8,
    },
    tipItem: {
        color: 'rgba(209,213,219,0.82)',
        fontSize: 13,
        lineHeight: 20,
    },
    primaryButton: {
        borderRadius: 18,
        overflow: 'hidden',
    },
    primaryButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
    statsRow: {
        width: '100%',
        maxWidth: CONTENT_WIDTH,
        flexDirection: 'row',
        gap: 10,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        gap: 4,
    },
    statLabel: {
        color: 'rgba(156,163,175,0.9)',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    statValue: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
    },
    shieldRow: {
        flexDirection: 'row',
        gap: 10,
    },
    shieldBubble: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    shieldBubbleActive: {
        backgroundColor: 'rgba(239,68,68,0.14)',
        borderColor: 'rgba(239,68,68,0.35)',
    },
    cueCard: {
        borderRadius: 22,
        padding: 20,
        gap: 16,
    },
    cueHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    cueIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(8, 12, 20, 0.22)',
        borderWidth: 1,
    },
    cueTextWrap: {
        flex: 1,
    },
    cueTitle: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    cueDescription: {
        color: 'rgba(241,245,249,0.86)',
        fontSize: 14,
        lineHeight: 20,
    },
    meterTrack: {
        width: METER_WIDTH,
        height: 8,
        borderRadius: 999,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.16)',
    },
    meterFill: {
        height: '100%',
        borderRadius: 999,
    },
    helperText: {
        color: 'rgba(226,232,240,0.86)',
        fontSize: 13,
        lineHeight: 20,
    },
    responseButton: {
        width: '100%',
        maxWidth: CONTENT_WIDTH,
        borderRadius: 22,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.22,
        shadowRadius: 14,
        elevation: 10,
    },
    responseButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 18,
        paddingHorizontal: 20,
    },
    responseButtonLabel: {
        color: 'white',
        fontSize: 20,
        fontWeight: '900',
    },
    responseButtonHint: {
        color: 'rgba(255,255,255,0.78)',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    scoreHero: {
        color: 'white',
        fontSize: 60,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: -2,
    },
    summarySub: {
        color: '#D1D5DB',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    summaryCard: {
        width: '48%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        gap: 4,
    },
    summaryValue: {
        color: 'white',
        fontSize: 24,
        fontWeight: '900',
    },
    summaryLabel: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
    coachNoteCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 8,
    },
    coachNoteTitle: {
        color: '#A78BFA',
        fontSize: 13,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    coachNoteText: {
        color: '#D1D5DB',
        fontSize: 14,
        lineHeight: 22,
    },
});
