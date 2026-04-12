import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Heart, CheckCircle, XCircle, Clock, Lightbulb, Shield, Flame, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GameSessionTracker from "./GameSessionTracker";
import { getPersonalBest } from "../api/neuroNestApi";

type Emotion = {
  id: string;
  label: string;
  emoji: string;
  color: string;
  description: string;
};

type ChallengeType =
  | "classic"        // Emoji → Label
  | "reverse"        // Label → Emoji
  | "description"    // Description → Emoji
  | "pair"           // Find 2 emojis for emotion
  | "oddOneOut"      // Which doesn't belong
  | "memory"         // Flash emoji then recall
  | "scenario";      // Story → Emotion

type PowerUp = {
  id: string;
  name: string;
  icon: any;
  description: string;
  active: boolean;
};

type WildcardEvent = "bonusBlitz" | "gemRound" | "timeReverse" | null;

const EMOTIONS: Emotion[] = [
  { id: "happy", label: "Happy", emoji: "😊", color: "text-yellow-400", description: "Joyful and content" },
  { id: "sad", label: "Sad", emoji: "😢", color: "text-blue-400", description: "Feeling down or melancholy" },
  { id: "angry", label: "Angry", emoji: "😠", color: "text-red-400", description: "Frustrated or mad" },
  { id: "calm", label: "Calm", emoji: "😌", color: "text-green-400", description: "Peaceful and relaxed" },
  { id: "surprised", label: "Surprised", emoji: "😲", color: "text-purple-400", description: "Shocked or amazed" },
  { id: "afraid", label: "Afraid", emoji: "😨", color: "text-indigo-400", description: "Scared or worried" },
  { id: "excited", label: "Excited", emoji: "🤩", color: "text-pink-400", description: "Thrilled and energetic" },
  { id: "confused", label: "Confused", emoji: "😕", color: "text-orange-400", description: "Puzzled or uncertain" },
  { id: "proud", label: "Proud", emoji: "😤", color: "text-emerald-400", description: "Accomplished and confident" },
  { id: "shy", label: "Shy", emoji: "😳", color: "text-rose-400", description: "Bashful or timid" },
  { id: "disgusted", label: "Disgusted", emoji: "🤢", color: "text-lime-400", description: "Revolted or repulsed" },
  { id: "love", label: "In Love", emoji: "😍", color: "text-red-300", description: "Infatuated and adoring" },
];

const SCENARIOS = [
  { scenario: "Just won the lottery!", emotion: "excited" },
  { scenario: "Lost a beloved pet", emotion: "sad" },
  { scenario: "Someone cut in line", emotion: "angry" },
  { scenario: "Meditating by the ocean", emotion: "calm" },
  { scenario: "Friend threw a surprise party", emotion: "surprised" },
  { scenario: "Walking alone at night", emotion: "afraid" },
  { scenario: "Received a genuine compliment", emotion: "shy" },
  { scenario: "Saw someone litter", emotion: "disgusted" },
  { scenario: "Graduated with honors", emotion: "proud" },
];

export default function EmotionMatch() {
  const navigate = useNavigate();

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [round, setRound] = useState(1);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lives, setLives] = useState(3);

  const [challengeType, setChallengeType] = useState<ChallengeType>("classic");
  const [target, setTarget] = useState<Emotion | null>(null);
  const [options, setOptions] = useState<Emotion[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number, x: number, y: number, color: string }>>([]);
  const [showDescription, setShowDescription] = useState(false);
  const [memoryEmoji, setMemoryEmoji] = useState<string | null>(null);
  const [scenario, setScenario] = useState<string>("");
  const [screenShake, setScreenShake] = useState(false);
  const [comboMessage, setComboMessage] = useState("");
  const [wildcardEvent, setWildcardEvent] = useState<WildcardEvent>(null);
  const [wildcardProgress, setWildcardProgress] = useState(0);
  const [showAchievement, setShowAchievement] = useState("");
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

  useEffect(() => {
    getPersonalBest("Emotion Match").then(best => {
      // Initialize best score if needed
    });
  }, []);

  useEffect(() => {
    let timer: number;
    if (isPlaying && timeLeft > 0 && !timeFrozen) {
      timer = window.setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            if (lives > 0) {
              setIsPlaying(false);
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, timeFrozen, lives]);

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
        color
      });
    }
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1000);
  };

  const triggerScreenShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 500);
  };

  const triggerWildcard = () => {
    const events: WildcardEvent[] = ["bonusBlitz", "gemRound", "timeReverse"];
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    setWildcardEvent(randomEvent);
    setWildcardProgress(0);
  };

  const grantPowerUp = () => {
    const powerUpTypes = ["timeFreeze", "hint", "doublePoints", "skip", "shield"] as const;
    const randomPowerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    setPowerUps(prev => ({ ...prev, [randomPowerUp]: prev[randomPowerUp] + 1 }));

    // Show achievement notification
    setShowAchievement(`Power-up unlocked! 🎁`);
    setTimeout(() => setShowAchievement(""), 2000);
  };

  const usePowerUp = (type: keyof typeof powerUps) => {
    if (powerUps[type] <= 0 || isAnimating) return;

    setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));

    switch (type) {
      case "timeFreeze":
        setTimeFrozen(true);
        setTimeout(() => setTimeFrozen(false), 10000);
        break;
      case "hint":
        // Remove one wrong option
        const wrongOptions = options.filter(opt => opt.id !== target?.id);
        if (wrongOptions.length > 0) {
          const toRemove = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
          setOptions(prev => prev.filter(opt => opt.id !== toRemove.id));
        }
        break;
      case "doublePoints":
        setActiveDoublePoints(3);
        break;
      case "skip":
        setRound(r => r + 1);
        break;
      case "shield":
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
    const types: ChallengeType[] = ["classic", "reverse", "description", "oddOneOut", "memory", "scenario"];
    // Unlock more types as level increases
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

    if (newChallengeType === "memory") {
      // Flash emoji then hide it
      setMemoryEmoji(newTarget.emoji);
      setTimeout(() => setMemoryEmoji(null), 1500);
    } else {
      setMemoryEmoji(null);
    }

    if (newChallengeType === "scenario") {
      const availableScenarios = SCENARIOS.filter(s =>
        availableEmotions.some(e => e.id === s.emotion)
      );
      const randomScenario = availableScenarios[Math.floor(Math.random() * availableScenarios.length)];
      setScenario(randomScenario.scenario);
      const scenarioTarget = EMOTIONS.find(e => e.id === randomScenario.emotion)!;
      setTarget(scenarioTarget);
    }

    // Generate options based on challenge type
    let numOptions = 4;
    if (newChallengeType === "oddOneOut") numOptions = 5;

    const pool = availableEmotions.filter(e => e.id !== newTarget.id);
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
      // Calculate points
      let basePoints = 10;
      const comboBonus = combo * 3;
      const levelBonus = level * 5;
      let points = basePoints + comboBonus + levelBonus;

      // Double points power-up
      if (activeDoublePoints > 0) {
        points *= 2;
        setActiveDoublePoints(prev => prev - 1);
      }

      // Fast answer bonus
      if (responseTime < 2000) {
        points += 50;
        setShowAchievement("⚡ Lightning Fast! +50");
        setTimeout(() => setShowAchievement(""), 1500);
      }

      // Wildcard bonuses
      if (wildcardEvent === "gemRound") {
        if (Math.random() < 0.6) grantPowerUp();
      } else if (wildcardEvent === "timeReverse") {
        setTimeLeft(t => t + 5);
      }

      setScore(s => s + points);
      setCorrectAnswersCount(prev => prev + 1);

      // Combo system
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > bestCombo) setBestCombo(newCombo);

      // Combo messages and effects
      if (newCombo === 3) {
        setComboMessage("Nice! 🔥");
        createParticles(target.color.replace('text-', ''), 12);
      } else if (newCombo === 5) {
        setComboMessage("Amazing! ⚡");
        createParticles(target.color.replace('text-', ''), 16);
        triggerScreenShake();
      } else if (newCombo === 7) {
        setComboMessage("Unstoppable! 🌟");
        createParticles(target.color.replace('text-', ''), 20);
        triggerScreenShake();
      } else if (newCombo >= 10) {
        setComboMessage("LEGENDARY! 👑");
        createParticles(target.color.replace('text-', ''), 30);
        triggerScreenShake();
      } else {
        setComboMessage("");
      }

      setFeedback("correct");
      createParticles(target.color.replace('text-', ''), 10);

      // Grant power-up every 5 correct answers
      if (correctAnswersCount > 0 && (correctAnswersCount + 1) % 5 === 0) {
        grantPowerUp();
      }

      // Level up
      if (score + points >= level * 100) {
        setLevel(l => l + 1);
        setTimeLeft(t => t + 20);
        setShowAchievement("🎯 Level Up! +20s");
        setTimeout(() => setShowAchievement(""), 2000);
      }

      // Wildcard progress
      if (wildcardEvent === "bonusBlitz") {
        setWildcardProgress(prev => prev + 1);
        if (wildcardProgress + 1 >= 5) {
          setScore(s => s + 200);
          setShowAchievement("💎 Bonus Blitz Complete! +200");
          setTimeout(() => setShowAchievement(""), 2000);
          setWildcardEvent(null);
        }
      }

    } else {
      // Wrong answer
      if (activeShield) {
        // Shield protects combo
        setActiveShield(false);
        setShowAchievement("🛡️ Shield Protected Your Combo!");
        setTimeout(() => setShowAchievement(""), 2000);
      } else {
        setCombo(0);
        setComboMessage("");
        setLives(prev => Math.max(0, prev - 1));

        if (lives - 1 <= 0) {
          setIsPlaying(false);
        }
      }
      setFeedback("wrong");
      setShowDescription(true);
    }

    setIsAnimating(true);
    setTimeout(() => {
      if (isPlaying && lives > 0) {
        setRound(r => r + 1);
      }
    }, 1500);
  };

  const getEmotionGradient = (emotion: Emotion) => {
    const colorMap: Record<string, string> = {
      'text-yellow-400': 'from-yellow-400 to-orange-400',
      'text-blue-400': 'from-blue-400 to-cyan-400',
      'text-red-400': 'from-red-400 to-pink-400',
      'text-green-400': 'from-green-400 to-emerald-400',
      'text-purple-400': 'from-purple-400 to-violet-400',
      'text-indigo-400': 'from-indigo-400 to-blue-400',
      'text-pink-400': 'from-pink-400 to-rose-400',
      'text-orange-400': 'from-orange-400 to-yellow-400',
      'text-emerald-400': 'from-emerald-400 to-green-400',
      'text-rose-400': 'from-rose-400 to-pink-400',
      'text-lime-400': 'from-lime-400 to-green-400',
      'text-red-300': 'from-red-300 to-pink-300',
    };
    return colorMap[emotion.color] || 'from-gray-400 to-gray-500';
  };

  const renderQuestion = () => {
    if (!target) return null;

    switch (challengeType) {
      case "classic":
        return (
          <>
            <div className={`text-[120px] transition-all duration-500 relative ${isAnimating ? "scale-110" : "scale-100 animate-float"} ${feedback === "wrong" ? "opacity-50 blur-sm" : ""}`}>
              {target.emoji}
              {target && <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${getEmotionGradient(target)} opacity-20 blur-xl animate-pulse`}></div>}
            </div>
            <p className="text-center text-gray-400 mb-6 text-sm">Which emotion does this face express?</p>
          </>
        );

      case "reverse":
        return (
          <>
            <div className="text-center mb-8">
              <div className={`text-4xl font-bold bg-gradient-to-r ${getEmotionGradient(target)} bg-clip-text text-transparent mb-4`}>
                {target.label}
              </div>
              <div className="text-sm text-gray-400">{target.description}</div>
            </div>
            <p className="text-center text-gray-400 mb-6 text-sm">Which emoji represents this emotion?</p>
          </>
        );

      case "description":
        return (
          <>
            <div className="glass rounded-xl p-6 mb-8">
              <p className="text-lg text-white text-center italic">"{target.description}"</p>
            </div>
            <p className="text-center text-gray-400 mb-6 text-sm">Which emoji matches this description?</p>
          </>
        );

      case "oddOneOut":
        return (
          <>
            <div className="text-4xl font-bold text-white mb-4 text-center">Odd One Out</div>
            <p className="text-center text-gray-400 mb-6 text-sm">One doesn't belong with {target.label}. Which one?</p>
          </>
        );

      case "memory":
        return (
          <>
            {memoryEmoji ? (
              <div className="text-[120px] animate-pulse">{memoryEmoji}</div>
            ) : (
              <div className="text-6xl text-gray-600">❓</div>
            )}
            <p className="text-center text-gray-400 mb-6 text-sm">
              {memoryEmoji ? "Remember this emotion!" : "What emotion did you see?"}
            </p>
          </>
        );

      case "scenario":
        return (
          <>
            <div className="glass rounded-xl p-6 mb-8">
              <div className="text-2xl mb-2">📖</div>
              <p className="text-lg text-white text-center">"{scenario}"</p>
            </div>
            <p className="text-center text-gray-400 mb-6 text-sm">How would they feel?</p>
          </>
        );

      default:
        return null;
    }
  };

  const renderOptions = () => {
    if (challengeType === "reverse" || challengeType === "description" || challengeType === "memory" || challengeType === "scenario") {
      // Show emoji buttons
      return (
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => {
            const isCorrect = target?.id === opt.id;
            const showCorrect = feedback && isCorrect;
            const showWrong = feedback === "wrong" && !isCorrect;

            return (
              <button
                key={opt.id}
                disabled={isAnimating || (challengeType === "memory" && memoryEmoji !== null)}
                onClick={() => handleChoice(opt.id)}
                className={`py-6 px-4 rounded-xl border-2 text-4xl font-medium transition-all duration-300 hover-lift
                  ${showCorrect ? "bg-green-500/20 border-green-500 scale-105" : showWrong ? "opacity-30 scale-95" : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-pink-400/50"}
                  ${!isAnimating && !feedback ? "hover:scale-105" : ""}
                  ${challengeType === "memory" && memoryEmoji !== null ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {opt.emoji}
              </button>
            );
          })}
        </div>
      );
    } else {
      // Show label buttons (classic, oddOneOut)
      return (
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => {
            const isCorrect = target?.id === opt.id;
            const showCorrect = feedback && isCorrect;
            const showWrong = feedback === "wrong" && !isCorrect;

            return (
              <button
                key={opt.id}
                disabled={isAnimating}
                onClick={() => handleChoice(opt.id)}
                className={`py-4 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-300 hover-lift
                  ${showCorrect ? "bg-green-500/20 border-green-500 text-green-300 scale-105" : showWrong ? "opacity-30 scale-95" : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-pink-400/50"}
                  ${!isAnimating && !feedback ? "hover:scale-105" : ""}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg">{opt.emoji}</span>
                  <span>{opt.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      );
    }
  };

  return (
    <GameSessionTracker gameName="Emotion Match" gameScore={score}>
      <div className={`min-h-screen bg-gradient-to-br from-[#0b0616] via-[#1a0b2e] to-[#0b0616] flex items-center justify-center p-4 ${screenShake ? 'animate-shake' : ''}`}>
        <div className="w-full max-w-md bg-gradient-to-br from-[#120b22] to-[#1a0f2e] border border-purple-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">

          {/* Animated background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-pink-500 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-purple-500 rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>

          {/* Particles */}
          {particles.map(particle => (
            <div
              key={particle.id}
              className={`absolute w-2 h-2 bg-${particle.color}-400 rounded-full animate-ping`}
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                animationDuration: '0.8s'
              }}
            />
          ))}

          {/* Achievement notification */}
          {showAchievement && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
              <div className="glass rounded-xl px-6 py-3 border border-yellow-400/50 bg-yellow-500/20">
                <span className="text-yellow-300 font-bold">{showAchievement}</span>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex justify-between items-center mb-6 text-white relative z-10">
            <button
              onClick={() => navigate("/games")}
              className="p-2 rounded-full hover:bg-white/10 transition-all duration-300 hover:scale-110"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="text-center">
              <h2 className="font-bold text-xl bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2 justify-center">
                <Heart size={18} /> Emotion Match
              </h2>
              <div className="text-xs text-gray-400">Level {level}</div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-mono ${timeFrozen ? 'text-blue-400' : 'text-white'}`}>
                {timeFrozen && '❄️ '}{timeLeft}s
              </div>
              <div className="text-xs text-gray-400">Time</div>
            </div>
          </div>

          {/* Lives */}
          {isPlaying && (
            <div className="flex justify-center gap-2 mb-4 relative z-10">
              {[...Array(3)].map((_, i) => (
                <Heart
                  key={i}
                  size={20}
                  className={`${i < lives ? 'fill-red-500 text-red-500' : 'text-gray-600'} transition-all duration-300`}
                />
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
            <div className="glass rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-white">{score}</div>
              <div className="text-xs text-gray-400">Score</div>
            </div>
            <div className="glass rounded-xl p-3 text-center relative">
              <div className={`text-lg font-bold ${combo >= 3 ? 'text-orange-400' : 'text-yellow-400'}`}>
                {combo >= 3 && <Flame size={16} className="inline mb-1" />} {combo}
              </div>
              <div className="text-xs text-gray-400">Combo</div>
              {combo >= 3 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
              )}
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-green-400">{bestCombo}</div>
              <div className="text-xs text-gray-400">Best</div>
            </div>
          </div>

          {/* Combo Message */}
          {comboMessage && (
            <div className="text-center mb-4 relative z-10">
              <div className="text-2xl font-bold text-orange-400 animate-bounce">{comboMessage}</div>
            </div>
          )}

          {/* Wildcard Event Banner */}
          {wildcardEvent && (
            <div className="mb-6 glass rounded-xl p-4 border border-yellow-400/50 bg-yellow-500/10 relative z-10">
              <div className="text-center">
                <div className="text-yellow-300 font-bold mb-1">
                  {wildcardEvent === "bonusBlitz" && "💥 BONUS BLITZ! Answer 5 for +200!"}
                  {wildcardEvent === "gemRound" && "💎 GEM ROUND! High power-up chance!"}
                  {wildcardEvent === "timeReverse" && "⏰ TIME BONUS! Gaining time!"}
                </div>
                {wildcardEvent === "bonusBlitz" && (
                  <div className="text-xs text-gray-300">Progress: {wildcardProgress}/5</div>
                )}
              </div>
            </div>
          )}

          {/* Power-ups */}
          {isPlaying && (
            <div className="mb-6 relative z-10">
              <div className="text-xs text-gray-400 mb-2 text-center">Power-ups</div>
              <div className="flex justify-center gap-2 flex-wrap">
                <button
                  onClick={() => usePowerUp("timeFreeze")}
                  disabled={powerUps.timeFreeze === 0 || timeFrozen}
                  className="glass rounded-lg px-3 py-2 text-xs flex items-center gap-1 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Clock size={14} className="text-blue-400" />
                  <span className="text-white">{powerUps.timeFreeze}</span>
                </button>
                <button
                  onClick={() => usePowerUp("hint")}
                  disabled={powerUps.hint === 0}
                  className="glass rounded-lg px-3 py-2 text-xs flex items-center gap-1 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Lightbulb size={14} className="text-yellow-400" />
                  <span className="text-white">{powerUps.hint}</span>
                </button>
                <button
                  onClick={() => usePowerUp("doublePoints")}
                  disabled={powerUps.doublePoints === 0 || activeDoublePoints > 0}
                  className="glass rounded-lg px-3 py-2 text-xs flex items-center gap-1 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Zap size={14} className="text-purple-400" />
                  <span className="text-white">{powerUps.doublePoints}</span>
                  {activeDoublePoints > 0 && <span className="text-purple-400">({activeDoublePoints})</span>}
                </button>
                <button
                  onClick={() => usePowerUp("shield")}
                  disabled={powerUps.shield === 0 || activeShield}
                  className="glass rounded-lg px-3 py-2 text-xs flex items-center gap-1 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Shield size={14} className="text-green-400" />
                  <span className="text-white">{powerUps.shield}</span>
                  {activeShield && <span className="text-green-400">✓</span>}
                </button>
              </div>
            </div>
          )}

          {!isPlaying ? (
            /* Start Screen */
            <div className="text-center relative z-10">
              <div className="w-24 h-24 mx-auto mb-6 glass rounded-3xl flex items-center justify-center">
                <Heart className="text-pink-400" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Emotion Recognition</h3>
              <p className="text-gray-300 mb-8 leading-relaxed">
                Master multiple challenge types! Match emotions, solve scenarios, use power-ups, and build epic combos!
              </p>
              {score > 0 && (
                <div className="mb-6 glass rounded-xl p-4">
                  <div className="text-4xl font-black bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">{score}</div>
                  <div className="text-sm text-gray-400">Level {level} • {bestCombo} best combo</div>
                  {lives === 0 && <div className="text-red-400 mt-2">Out of lives!</div>}
                </div>
              )}
              <button
                onClick={startGame}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold shadow-lg hover:scale-105 transition-all duration-300"
              >
                {score > 0 ? 'Play Again' : 'Start Challenge'}
              </button>
            </div>
          ) : (
            <>
              {/* Game Area */}
              <div className="flex flex-col items-center mb-8 min-h-[180px] justify-center relative z-10">
                {renderQuestion()}

                {/* Description on wrong answer */}
                {showDescription && target && (
                  <div className="mt-4 glass rounded-xl p-3 border border-white/20 animate-fade-in">
                    <p className="text-sm text-gray-300 text-center">
                      <span className="font-semibold text-white">{target.label}:</span> {target.description}
                    </p>
                  </div>
                )}

                {/* Feedback Overlay */}
                {feedback && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in duration-300">
                    {feedback === "correct" ? (
                      <div className="bg-green-500/20 backdrop-blur-md border border-green-500 rounded-2xl px-6 py-3 flex items-center gap-2">
                        <CheckCircle className="text-green-400" size={32} />
                        <span className="text-xl font-bold text-green-100">Perfect!</span>
                      </div>
                    ) : (
                      <div className="bg-red-500/20 backdrop-blur-md border border-red-500 rounded-2xl px-6 py-3 flex items-center gap-2">
                        <XCircle className="text-red-400" size={32} />
                        <span className="text-xl font-bold text-red-100">Try Again</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Options Grid */}
              <div className="relative z-10">
                {renderOptions()}
              </div>

              {/* Progress to next level */}
              <div className="mt-6 relative z-10">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Level {level}</span>
                  <span>{Math.max(0, (level * 100) - score)} pts to next level</span>
                </div>
                <div className="h-2 glass rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, (score % 100))}%` }}
                  />
                </div>
              </div>
            </>
          )}

        </div>

        <style>{`
          .animate-float { animation: float 4s ease-in-out infinite; }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .glass {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .hover-lift:hover {
            transform: translateY(-2px);
          }
          .animate-shake {
            animation: shake 0.5s;
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
          }
        `}</style>
      </div>
    </GameSessionTracker>
  );
}