import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    ScrollView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Emotion = {
    id: string;
    label: string;
    emoji: string;
    color: string;
    description: string;
};

type ChallengeType =
    | 'classic'
    | 'reverse'
    | 'description'
    | 'pair'
    | 'oddOneOut'
    | 'memory'
    | 'scenario';

type WildcardEvent = 'bonusBlitz' | 'gemRound' | 'timeReverse' | null;

const EMOTIONS: Emotion[] = [
    { id: 'happy', label: 'Happy', emoji: '😊', color: '#FBBF24', description: 'Joyful and content' },
    { id: 'sad', label: 'Sad', emoji: '😢', color: '#60A5FA', description: 'Feeling down or melancholy' },
    { id: 'angry', label: 'Angry', emoji: '😠', color: '#F87171', description: 'Frustrated or mad' },
    { id: 'calm', label: 'Calm', emoji: '😌', color: '#34D399', description: 'Peaceful and relaxed' },
    { id: 'surprised', label: 'Surprised', emoji: '😲', color: '#A78BFA', description: 'Shocked or amazed' },
    { id: 'afraid', label: 'Afraid', emoji: '😨', color: '#818CF8', description: 'Scared or worried' },
    { id: 'excited', label: 'Excited', emoji: '🤩', color: '#F472B6', description: 'Thrilled and energetic' },
    { id: 'confused', label: 'Confused', emoji: '😕', color: '#FB923C', description: 'Puzzled or uncertain' },
    { id: 'proud', label: 'Proud', emoji: '😤', color: '#34D399', description: 'Accomplished and confident' },
    { id: 'shy', label: 'Shy', emoji: '😳', color: '#FB7185', description: 'Bashful or timid' },
    { id: 'disgusted', label: 'Disgusted', emoji: '🤢', color: '#A3E635', description: 'Revolted or repulsed' },
    { id: 'love', label: 'In Love', emoji: '😍', color: '#FCA5A5', description: 'Infatuated and adoring' },
];

const SCENARIOS = [
    { scenario: 'Just won the lottery!', emotion: 'excited' },
    { scenario: 'Lost a beloved pet', emotion: 'sad' },
    { scenario: 'Someone cut in line', emotion: 'angry' },
    { scenario: 'Meditating by the ocean', emotion: 'calm' },
    { scenario: 'Friend threw a surprise party', emotion: 'surprised' },
    { scenario: 'Walking alone at night', emotion: 'afraid' },
    { scenario: 'Received a genuine compliment', emotion: 'shy' },
    { scenario: 'Saw someone litter', emotion: 'disgusted' },
    { scenario: 'Graduated with honors', emotion: 'proud' },
];

export default function EmotionMatchScreen({ navigation }: any) {
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [bestCombo, setBestCombo] = useState(0);
    const [round, setRound] = useState(1);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(120);
    const [isPlaying, setIsPlaying] = useState(false);
    const [lives, setLives] = useState(3);

    const [challengeType, setChallengeType] = useState<ChallengeType>('classic');
    const [target, setTarget] = useState<Emotion | null>(null);
    const [options, setOptions] = useState<Emotion[]>([]);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);
    const [showDescription, setShowDescription] = useState(false);
    const [memoryEmoji, setMemoryEmoji] = useState<string | null>(null);
    const [scenario, setScenario] = useState<string>('');
    const [comboMessage, setComboMessage] = useState('');
    const [wildcardEvent, setWildcardEvent] = useState<WildcardEvent>(null);
    const [wildcardProgress, setWildcardProgress] = useState(0);
    const [showAchievement, setShowAchievement] = useState('');
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

    // Power-ups
    const [powerUps, setPowerUps] = useState({
        timeFreeze: 0,
        hint: 0,
        doublePoints: 0,
        skip: 0,
        shield: 0,
    });
    const [activeDoublePoints, setActiveDoublePoints] = useState(0);
    const [activeShield, setActiveShield] = useState(false);
    const [timeFrozen, setTimeFrozen] = useState(false);

    const particleIdRef = useRef(0);
    const questionStartTime = useRef(Date.now());
    const shakeAnimation = useRef(new Animated.Value(0)).current;

    // Timer effect
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isPlaying && timeLeft > 0 && !timeFrozen) {
            timer = setInterval(() => {
                setTimeLeft((t) => {
                    if (t <= 1) {
                        setIsPlaying(false);
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isPlaying, timeLeft, timeFrozen]);

    // Round start effect
    useEffect(() => {
        if (isPlaying) {
            startRound();
        }
    }, [round, isPlaying]);

    // Wildcard event trigger
    useEffect(() => {
        if (isPlaying && round > 0 && round % 10 === 0 && !wildcardEvent) {
            triggerWildcard();
        }
    }, [round]);

    const createParticles = (color: string, count: number = 8) => {
        const newParticles = [];
        for (let i = 0; i < count; i++) {
            newParticles.push({
                id: particleIdRef.current++,
                x: Math.random() * 100,
                y: Math.random() * 100,
                color,
            });
        }
        setParticles(newParticles);
        setTimeout(() => setParticles([]), 1000);
    };

    const triggerScreenShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const triggerWildcard = () => {
        const events: WildcardEvent[] = ['bonusBlitz', 'gemRound', 'timeReverse'];
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        setWildcardEvent(randomEvent);
        setWildcardProgress(0);
    };

    const grantPowerUp = () => {
        const powerUpTypes = ['timeFreeze', 'hint', 'doublePoints', 'skip', 'shield'] as const;
        const randomPowerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        setPowerUps((prev) => ({ ...prev, [randomPowerUp]: prev[randomPowerUp] + 1 }));

        setShowAchievement('Power-up unlocked! 🎁');
        setTimeout(() => setShowAchievement(''), 2000);
    };

    const usePowerUp = (type: keyof typeof powerUps) => {
        if (powerUps[type] <= 0 || isAnimating) return;

        setPowerUps((prev) => ({ ...prev, [type]: prev[type] - 1 }));

        switch (type) {
            case 'timeFreeze':
                setTimeFrozen(true);
                setTimeout(() => setTimeFrozen(false), 10000);
                break;
            case 'hint':
                const wrongOptions = options.filter((opt) => opt.id !== target?.id);
                if (wrongOptions.length > 0) {
                    const toRemove = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
                    setOptions((prev) => prev.filter((opt) => opt.id !== toRemove.id));
                }
                break;
            case 'doublePoints':
                setActiveDoublePoints(3);
                break;
            case 'skip':
                setRound((r) => r + 1);
                break;
            case 'shield':
                setActiveShield(true);
                break;
        }
    };

    const startGame = () => {
        setIsPlaying(true);
        setScore(0);
        setCombo(0);
        setLevel(1);
        setRound(1);
        setTimeLeft(120);
        setLives(3);
        setFeedback(null);
        setPowerUps({
            timeFreeze: 1,
            hint: 1,
            doublePoints: 1,
            skip: 0,
            shield: 1,
        });
        setActiveDoublePoints(0);
        setActiveShield(false);
        setTimeFrozen(false);
        setWildcardEvent(null);
        setCorrectAnswersCount(0);
    };

    const getRandomChallengeType = (): ChallengeType => {
        const types: ChallengeType[] = ['classic', 'reverse', 'description', 'oddOneOut', 'memory', 'scenario'];
        const availableTypes = types.slice(0, Math.min(types.length, 3 + Math.floor(level / 2)));
        return availableTypes[Math.floor(Math.random() * availableTypes.length)];
    };

    const startRound = () => {
        if (!isPlaying) return;

        setIsAnimating(false);
        setFeedback(null);
        setShowDescription(false);
        questionStartTime.current = Date.now();

        const newChallengeType = getRandomChallengeType();
        setChallengeType(newChallengeType);

        const availableEmotions = EMOTIONS.slice(0, Math.min(EMOTIONS.length, 6 + level));
        const targetIdx = Math.floor(Math.random() * availableEmotions.length);
        const newTarget = availableEmotions[targetIdx];
        setTarget(newTarget);

        if (newChallengeType === 'memory') {
            setMemoryEmoji(newTarget.emoji);
            setTimeout(() => setMemoryEmoji(null), 1500);
        } else {
            setMemoryEmoji(null);
        }

        if (newChallengeType === 'scenario') {
            const availableScenarios = SCENARIOS.filter((s) => availableEmotions.some((e) => e.id === s.emotion));
            const randomScenario = availableScenarios[Math.floor(Math.random() * availableScenarios.length)];
            setScenario(randomScenario.scenario);
            const scenarioTarget = EMOTIONS.find((e) => e.id === randomScenario.emotion)!;
            setTarget(scenarioTarget);
        }

        let numOptions = 4;
        if (newChallengeType === 'oddOneOut') numOptions = 5;

        const pool = availableEmotions.filter((e) => e.id !== newTarget.id);
        const shuffledPool = pool.sort(() => 0.5 - Math.random());
        const distractors = shuffledPool.slice(0, numOptions - 1);

        const newOptions = [newTarget, ...distractors].sort(() => 0.5 - Math.random());
        setOptions(newOptions);
    };

    const handleChoice = (selectedId: string) => {
        if (isAnimating || !target || !isPlaying) return;

        const isCorrect = selectedId === target.id;
        const responseTime = Date.now() - questionStartTime.current;

        if (isCorrect) {
            let basePoints = 10;
            const comboBonus = combo * 3;
            const levelBonus = level * 5;
            let points = basePoints + comboBonus + levelBonus;

            if (activeDoublePoints > 0) {
                points *= 2;
                setActiveDoublePoints((prev) => prev - 1);
            }

            if (responseTime < 2000) {
                points += 50;
                setShowAchievement('⚡ Lightning Fast! +50');
                setTimeout(() => setShowAchievement(''), 1500);
            }

            if (wildcardEvent === 'gemRound') {
                if (Math.random() < 0.6) grantPowerUp();
            } else if (wildcardEvent === 'timeReverse') {
                setTimeLeft((t) => t + 5);
            }

            setScore((s) => s + points);
            setCorrectAnswersCount((prev) => prev + 1);

            const newCombo = combo + 1;
            setCombo(newCombo);
            if (newCombo > bestCombo) setBestCombo(newCombo);

            if (newCombo === 3) {
                setComboMessage('Nice! 🔥');
                createParticles(target.color, 12);
            } else if (newCombo === 5) {
                setComboMessage('Amazing! ⚡');
                createParticles(target.color, 16);
                triggerScreenShake();
            } else if (newCombo === 7) {
                setComboMessage('Unstoppable! 🌟');
                createParticles(target.color, 20);
                triggerScreenShake();
            } else if (newCombo >= 10) {
                setComboMessage('LEGENDARY! 👑');
                createParticles(target.color, 30);
                triggerScreenShake();
            } else {
                setComboMessage('');
            }

            setFeedback('correct');
            createParticles(target.color, 10);

            if (correctAnswersCount > 0 && (correctAnswersCount + 1) % 5 === 0) {
                grantPowerUp();
            }

            if (score + points >= level * 100) {
                setLevel((l) => l + 1);
                setTimeLeft((t) => t + 20);
                setShowAchievement('🎯 Level Up! +20s');
                setTimeout(() => setShowAchievement(''), 2000);
            }

            if (wildcardEvent === 'bonusBlitz') {
                setWildcardProgress((prev) => prev + 1);
                if (wildcardProgress + 1 >= 5) {
                    setScore((s) => s + 200);
                    setShowAchievement('💎 Bonus Blitz Complete! +200');
                    setTimeout(() => setShowAchievement(''), 2000);
                    setWildcardEvent(null);
                }
            }
        } else {
            if (activeShield) {
                setActiveShield(false);
                setShowAchievement('🛡️ Shield Protected Your Combo!');
                setTimeout(() => setShowAchievement(''), 2000);
            } else {
                setCombo(0);
                setComboMessage('');
                setLives((prev) => Math.max(0, prev - 1));

                if (lives - 1 <= 0) {
                    setIsPlaying(false);
                }
            }
            setFeedback('wrong');
            setShowDescription(true);
        }

        setIsAnimating(true);
        setTimeout(() => {
            setIsPlaying((playing) => {
                setLives((currentLives) => {
                    if (playing && currentLives > 0) {
                        setRound((r) => r + 1);
                    }
                    return currentLives;
                });
                return playing;
            });
        }, 1500);
    };

    const renderQuestion = () => {
        if (!target) return null;

        switch (challengeType) {
            case 'classic':
                return (
                    <View style={styles.questionContainer}>
                        <Text style={styles.emojiLarge}>{target.emoji}</Text>
                        <Text style={styles.questionText}>Which emotion does this face express?</Text>
                    </View>
                );

            case 'reverse':
                return (
                    <View style={styles.questionContainer}>
                        <Text style={[styles.emotionLabel, { color: target.color }]}>{target.label}</Text>
                        <Text style={styles.descriptionText}>{target.description}</Text>
                        <Text style={styles.questionText}>Which emoji represents this emotion?</Text>
                    </View>
                );

            case 'description':
                return (
                    <View style={styles.questionContainer}>
                        <View style={styles.glassCard}>
                            <Text style={styles.descriptionLarge}>"{target.description}"</Text>
                        </View>
                        <Text style={styles.questionText}>Which emoji matches this description?</Text>
                    </View>
                );

            case 'oddOneOut':
                return (
                    <View style={styles.questionContainer}>
                        <Text style={styles.titleText}>Odd One Out</Text>
                        <Text style={styles.questionText}>One doesn't belong with {target.label}. Which one?</Text>
                    </View>
                );

            case 'memory':
                return (
                    <View style={styles.questionContainer}>
                        {memoryEmoji ? (
                            <Text style={styles.emojiLarge}>{memoryEmoji}</Text>
                        ) : (
                            <Text style={styles.emojiLarge}>❓</Text>
                        )}
                        <Text style={styles.questionText}>
                            {memoryEmoji ? 'Remember this emotion!' : 'What emotion did you see?'}
                        </Text>
                    </View>
                );

            case 'scenario':
                return (
                    <View style={styles.questionContainer}>
                        <View style={styles.glassCard}>
                            <Text style={styles.scenarioEmoji}>📖</Text>
                            <Text style={styles.scenarioText}>"{scenario}"</Text>
                        </View>
                        <Text style={styles.questionText}>How would they feel?</Text>
                    </View>
                );

            default:
                return null;
        }
    };

    const renderOptions = () => {
        const isEmojiType = challengeType === 'reverse' || challengeType === 'description' || challengeType === 'memory' || challengeType === 'scenario';

        return (
            <View style={styles.optionsGrid}>
                {options.map((opt) => {
                    const isCorrect = target?.id === opt.id;
                    const showCorrect = feedback && isCorrect;
                    const showWrong = feedback === 'wrong' && !isCorrect;

                    return (
                        <TouchableOpacity
                            key={opt.id}
                            disabled={isAnimating || (challengeType === 'memory' && memoryEmoji !== null)}
                            onPress={() => handleChoice(opt.id)}
                            style={[
                                styles.optionButton,
                                showCorrect && styles.optionCorrect,
                                showWrong && styles.optionWrong,
                                challengeType === 'memory' && memoryEmoji !== null && styles.optionDisabled,
                            ]}
                        >
                            {isEmojiType ? (
                                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                            ) : (
                                <View style={styles.optionContent}>
                                    <Text style={styles.optionEmojiSmall}>{opt.emoji}</Text>
                                    <Text style={styles.optionLabel}>{opt.label}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient colors={['#0b0616', '#1a0b2e', '#0b0616']} style={styles.backgroundGradient} />

            {/* Particles */}
            {particles.map((particle) => (
                <Animated.View
                    key={particle.id}
                    style={[
                        styles.particle,
                        {
                            left: `${particle.x}%`,
                            top: `${particle.y}%`,
                            backgroundColor: particle.color,
                        },
                    ]}
                />
            ))}

            {/* Achievement Notification */}
            {showAchievement !== '' && (
                <View style={styles.achievementBanner}>
                    <View style={styles.achievementContent}>
                        <Text style={styles.achievementText}>{showAchievement}</Text>
                    </View>
                </View>
            )}

            <Animated.ScrollView
                style={[styles.scrollView, { transform: [{ translateX: shakeAnimation }] }]}
                contentContainerStyle={styles.contentContainer}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <View style={styles.headerTitle}>
                            <Ionicons name="heart" size={18} color="#F472B6" />
                            <Text style={styles.titleText}>Emotion Match</Text>
                        </View>
                        <Text style={styles.levelText}>Level {level}</Text>
                    </View>
                    <View style={styles.timerContainer}>
                        <Text style={[styles.timerText, timeFrozen && styles.timerFrozen]}>
                            {timeFrozen && '❄️ '}
                            {timeLeft}s
                        </Text>
                        <Text style={styles.timerLabel}>Time</Text>
                    </View>
                </View>

                {/* Lives */}
                {isPlaying && (
                    <View style={styles.livesContainer}>
                        {[...Array(3)].map((_, i) => (
                            <Ionicons key={i} name="heart" size={20} color={i < lives ? '#EF4444' : '#4B5563'} />
                        ))}
                    </View>
                )}

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{score}</Text>
                        <Text style={styles.statLabel}>Score</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, combo >= 3 && styles.statValueCombo]}>
                            {combo >= 3 && '🔥 '}
                            {combo}
                        </Text>
                        <Text style={styles.statLabel}>Combo</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#34D399' }]}>{bestCombo}</Text>
                        <Text style={styles.statLabel}>Best</Text>
                    </View>
                </View>

                {/* Combo Message */}
                {comboMessage !== '' && (
                    <View style={styles.comboMessageContainer}>
                        <Text style={styles.comboMessage}>{comboMessage}</Text>
                    </View>
                )}

                {/* Wildcard Event Banner */}
                {wildcardEvent && (
                    <View style={styles.wildcardBanner}>
                        <Text style={styles.wildcardText}>
                            {wildcardEvent === 'bonusBlitz' && '💥 BONUS BLITZ! Answer 5 for +200!'}
                            {wildcardEvent === 'gemRound' && '💎 GEM ROUND! High power-up chance!'}
                            {wildcardEvent === 'timeReverse' && '⏰ TIME BONUS! Gaining time!'}
                        </Text>
                        {wildcardEvent === 'bonusBlitz' && (
                            <Text style={styles.wildcardProgress}>Progress: {wildcardProgress}/5</Text>
                        )}
                    </View>
                )}

                {/* Power-ups */}
                {isPlaying && (
                    <View style={styles.powerUpsSection}>
                        <Text style={styles.powerUpsLabel}>Power-ups</Text>
                        <View style={styles.powerUpsContainer}>
                            <TouchableOpacity
                                onPress={() => usePowerUp('timeFreeze')}
                                disabled={powerUps.timeFreeze === 0 || timeFrozen}
                                style={[styles.powerUpButton, (powerUps.timeFreeze === 0 || timeFrozen) && styles.powerUpDisabled]}
                            >
                                <Ionicons name="time" size={14} color="#60A5FA" />
                                <Text style={styles.powerUpCount}>{powerUps.timeFreeze}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => usePowerUp('hint')}
                                disabled={powerUps.hint === 0}
                                style={[styles.powerUpButton, powerUps.hint === 0 && styles.powerUpDisabled]}
                            >
                                <Ionicons name="bulb" size={14} color="#FBBF24" />
                                <Text style={styles.powerUpCount}>{powerUps.hint}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => usePowerUp('doublePoints')}
                                disabled={powerUps.doublePoints === 0 || activeDoublePoints > 0}
                                style={[styles.powerUpButton, (powerUps.doublePoints === 0 || activeDoublePoints > 0) && styles.powerUpDisabled]}
                            >
                                <Ionicons name="flash" size={14} color="#A78BFA" />
                                <Text style={styles.powerUpCount}>{powerUps.doublePoints}</Text>
                                {activeDoublePoints > 0 && <Text style={styles.powerUpActive}>({activeDoublePoints})</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => usePowerUp('shield')}
                                disabled={powerUps.shield === 0 || activeShield}
                                style={[styles.powerUpButton, (powerUps.shield === 0 || activeShield) && styles.powerUpDisabled]}
                            >
                                <Ionicons name="shield" size={14} color="#34D399" />
                                <Text style={styles.powerUpCount}>{powerUps.shield}</Text>
                                {activeShield && <Text style={styles.powerUpActive}>✓</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {!isPlaying ? (
                    /* Start Screen */
                    <View style={styles.startScreen}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="heart" size={32} color="#F472B6" />
                        </View>
                        <Text style={styles.startTitle}>Emotion Recognition</Text>
                        <Text style={styles.startSubtitle}>
                            Master multiple challenge types! Match emotions, solve scenarios, use power-ups, and build epic combos!
                        </Text>
                        {score > 0 && (
                            <View style={styles.gameOverCard}>
                                <Text style={styles.finalScore}>{score}</Text>
                                <Text style={styles.finalStats}>
                                    Level {level} • {bestCombo} best combo
                                </Text>
                                {lives === 0 && <Text style={styles.outOfLives}>Out of lives!</Text>}
                            </View>
                        )}
                        <TouchableOpacity onPress={startGame} style={styles.startButton}>
                            <LinearGradient colors={['#F43F5E', '#A855F7']} style={styles.startButtonGradient}>
                                <Text style={styles.startButtonText}>{score > 0 ? 'Play Again' : 'Start Challenge'}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Game Area */}
                        <View style={styles.gameArea}>
                            {renderQuestion()}

                            {/* Description on wrong answer */}
                            {showDescription && target && (
                                <View style={styles.descriptionCard}>
                                    <Text style={styles.descriptionCardText}>
                                        <Text style={styles.descriptionCardLabel}>{target.label}:</Text> {target.description}
                                    </Text>
                                </View>
                            )}

                            {/* Feedback Overlay */}
                            {feedback && (
                                <View style={styles.feedbackOverlay}>
                                    {feedback === 'correct' ? (
                                        <View style={styles.feedbackCorrect}>
                                            <Ionicons name="checkmark-circle" size={32} color="#34D399" />
                                            <Text style={styles.feedbackText}>Perfect!</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.feedbackWrong}>
                                            <Ionicons name="close-circle" size={32} color="#EF4444" />
                                            <Text style={styles.feedbackText}>Try Again</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Options Grid */}
                        {renderOptions()}

                        {/* Progress Bar */}
                        <View style={styles.progressContainer}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressLabel}>Level {level}</Text>
                                <Text style={styles.progressLabel}>{Math.max(0, level * 100 - score)} pts to next level</Text>
                            </View>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${Math.min(100, (score % (level * 100)) / (level * 100) * 100)}%` }]} />
                            </View>
                        </View>
                    </>
                )}
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    particle: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        opacity: 0.6,
    },
    achievementBanner: {
        position: 'absolute',
        top: 80,
        left: 0,
        right: 0,
        zIndex: 50,
        alignItems: 'center',
    },
    achievementContent: {
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.5)',
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    achievementText: {
        color: '#FCD34D',
        fontWeight: 'bold',
        fontSize: 14,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        padding: 8,
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    titleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    levelText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    timerContainer: {
        alignItems: 'flex-end',
    },
    timerText: {
        fontSize: 14,
        color: 'white',
        fontWeight: '600',
    },
    timerFrozen: {
        color: '#60A5FA',
    },
    timerLabel: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    livesContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    statValueCombo: {
        color: '#FB923C',
    },
    statLabel: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    comboMessageContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    comboMessage: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FB923C',
    },
    wildcardBanner: {
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.5)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    wildcardText: {
        color: '#FCD34D',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    wildcardProgress: {
        color: '#D1D5DB',
        fontSize: 12,
        textAlign: 'center',
    },
    powerUpsSection: {
        marginBottom: 20,
    },
    powerUpsLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 8,
    },
    powerUpsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    powerUpButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    powerUpDisabled: {
        opacity: 0.3,
    },
    powerUpCount: {
        color: 'white',
        fontSize: 12,
    },
    powerUpActive: {
        color: '#34D399',
        fontSize: 12,
    },
    startScreen: {
        alignItems: 'center',
        paddingTop: 40,
    },
    iconContainer: {
        width: 96,
        height: 96,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    startTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 16,
    },
    startSubtitle: {
        fontSize: 14,
        color: '#D1D5DB',
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    gameOverCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    finalScore: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#F472B6',
        textAlign: 'center',
        marginBottom: 8,
    },
    finalStats: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    outOfLives: {
        color: '#EF4444',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    startButton: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    startButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    startButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    gameArea: {
        minHeight: 180,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    questionContainer: {
        alignItems: 'center',
    },
    emojiLarge: {
        fontSize: 120,
        marginBottom: 16,
    },
    emotionLabel: {
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 16,
    },
    questionText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    glassCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    descriptionLarge: {
        fontSize: 18,
        color: 'white',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    scenarioEmoji: {
        fontSize: 32,
        textAlign: 'center',
        marginBottom: 8,
    },
    scenarioText: {
        fontSize: 18,
        color: 'white',
        textAlign: 'center',
    },
    descriptionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 12,
        marginTop: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    descriptionCardText: {
        fontSize: 14,
        color: '#D1D5DB',
        textAlign: 'center',
    },
    descriptionCardLabel: {
        fontWeight: '600',
        color: 'white',
    },
    feedbackOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
    },
    feedbackCorrect: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderWidth: 1,
        borderColor: '#10B981',
        borderRadius: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    feedbackWrong: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderWidth: 1,
        borderColor: '#EF4444',
        borderRadius: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    feedbackText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    optionButton: {
        width: (SCREEN_WIDTH - 52) / 2,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionCorrect: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10B981',
    },
    optionWrong: {
        opacity: 0.3,
    },
    optionDisabled: {
        opacity: 0.5,
    },
    optionEmoji: {
        fontSize: 64,
    },
    optionContent: {
        alignItems: 'center',
        gap: 4,
    },
    optionEmojiSmall: {
        fontSize: 18,
    },
    optionLabel: {
        color: '#D1D5DB',
        fontSize: 14,
    },
    progressContainer: {
        marginTop: 24,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    progressLabel: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    progressBar: {
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#F472B6',
    },
});
