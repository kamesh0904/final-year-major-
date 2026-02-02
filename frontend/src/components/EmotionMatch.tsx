import { useState, useEffect } from "react";
import { ArrowLeft, Heart, CheckCircle, XCircle, RotateCw, Star, Zap, Target } from "lucide-react";
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

export default function EmotionMatch() {
  const navigate = useNavigate();

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [round, setRound] = useState(1);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    getPersonalBest("Emotion Match").then(best => {
      // EmotionMatch uses bestStreak, but we should probably track best score too?
      // The UI displays "Best" which is linked to bestStreak in state.
      // But the DB saves 'score'.
      // Let's assume 'Best' in UI should perhaps reflect best SCORE?
      // But existing code uses bestStreak.
      // I'll stick to not changing the UI logic too much, but if I load score, I can't put it in bestStreak directly if they are different scales.
      // But for "Personal Best" counting scores, we need to know the High Score.
    });
    // Actually, EmotionMatch displays 'Best' as bestStreak.
    // But GameSessionTracker saves 'score'.
    // If the user wants "Personal Best Score", we should track 'highScore' state.
  }, []);

  const [target, setTarget] = useState<Emotion | null>(null);
  const [options, setOptions] = useState<Emotion[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number, x: number, y: number, color: string }>>([]);
  const [showDescription, setShowDescription] = useState(false);

  const particleIdRef = useState(0);

  useEffect(() => {
    let timer: number;
    if (isPlaying && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setIsPlaying(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  useEffect(() => {
    if (isPlaying) {
      startRound();
    }
  }, [round, isPlaying]);

  const createParticles = (color: string) => {
    const newParticles = [];
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: particleIdRef[0]++,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color
      });
    }
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1000);
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setStreak(0);
    setLevel(1);
    setRound(1);
    setTimeLeft(120);
    setFeedback(null);
  };

  const startRound = () => {
    if (!isPlaying) return;

    setIsAnimating(false);
    setFeedback(null);
    setShowDescription(false);

    // Progressive difficulty
    const availableEmotions = EMOTIONS.slice(0, Math.min(EMOTIONS.length, 6 + level));
    const numOptions = Math.min(4, 2 + Math.floor(level / 2));

    // Pick random target
    const targetIdx = Math.floor(Math.random() * availableEmotions.length);
    const newTarget = availableEmotions[targetIdx];
    setTarget(newTarget);

    // Generate distractors
    const pool = availableEmotions.filter(e => e.id !== newTarget.id);
    const shuffledPool = pool.sort(() => 0.5 - Math.random());
    const distractors = shuffledPool.slice(0, numOptions - 1);

    // Combine and shuffle options
    const newOptions = [newTarget, ...distractors].sort(() => 0.5 - Math.random());
    setOptions(newOptions);
  };

  const handleChoice = (selectedId: string) => {
    if (isAnimating || !target || !isPlaying) return;

    if (selectedId === target.id) {
      // Correct
      const basePoints = 10;
      const streakBonus = streak * 3;
      const levelBonus = level * 5;
      const points = basePoints + streakBonus + levelBonus;

      setScore(s => s + points);
      setStreak(s => {
        const newStreak = s + 1;
        if (newStreak > bestStreak) setBestStreak(newStreak);
        return newStreak;
      });
      setFeedback("correct");
      createParticles(target.color.replace('text-', ''));

      // Level up every 100 points
      if (score + points >= level * 100) {
        setLevel(l => l + 1);
        setTimeLeft(t => t + 20); // Bonus time
      }
    } else {
      // Wrong
      setStreak(0);
      setFeedback("wrong");
      setShowDescription(true);
    }

    setIsAnimating(true);
    setTimeout(() => {
      if (isPlaying) {
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

  return (
    <GameSessionTracker gameName="Emotion Match" gameScore={score}>
      <div className="min-h-screen bg-gradient-to-br from-[#0b0616] via-[#1a0b2e] to-[#0b0616] flex items-center justify-center p-4">
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
              <div className="text-sm font-mono text-white">{timeLeft}s</div>
              <div className="text-xs text-gray-400">Time</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
            <div className="glass rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-white">{score}</div>
              <div className="text-xs text-gray-400">Score</div>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-yellow-400">{streak}</div>
              <div className="text-xs text-gray-400">Streak</div>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-green-400">{bestStreak}</div>
              <div className="text-xs text-gray-400">Best</div>
            </div>
          </div>

          {!isPlaying ? (
            /* Start Screen */
            <div className="text-center relative z-10">
              <div className="w-24 h-24 mx-auto mb-6 glass rounded-3xl flex items-center justify-center">
                <Heart className="text-pink-400" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Emotion Recognition</h3>
              <p className="text-gray-300 mb-8 leading-relaxed">
                Match the facial expression with the correct emotion.
                Build your emotional intelligence!
              </p>
              <button
                onClick={startGame}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold shadow-lg hover:scale-105 transition-all duration-300"
              >
                Start Matching
              </button>
            </div>
          ) : (
            <>
              {/* Game Area */}
              <div className="flex flex-col items-center mb-8 min-h-[180px] justify-center relative z-10">

                {/* Target Face */}
                <div className={`
                  text-[120px] transition-all duration-500 relative
                  ${isAnimating ? "scale-110" : "scale-100 animate-float"}
                  ${feedback === "wrong" ? "opacity-50 blur-sm" : ""}
                `}>
                  {target?.emoji}

                  {/* Emotion ring */}
                  {target && (
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${getEmotionGradient(target)} opacity-20 blur-xl animate-pulse`}></div>
                  )}
                </div>

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
                        <span className="text-xl font-bold text-red-100">Learn & Try Again</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Instruction */}
              <p className="text-center text-gray-400 mb-6 text-sm relative z-10">
                Which emotion does this face express?
              </p>

              {/* Options Grid */}
              <div className="grid grid-cols-2 gap-3 relative z-10">
                {options.map((opt) => {
                  const isCorrect = target?.id === opt.id;
                  const showCorrect = feedback && isCorrect;
                  const showWrong = feedback === "wrong" && !isCorrect;

                  return (
                    <button
                      key={opt.id}
                      disabled={isAnimating}
                      onClick={() => handleChoice(opt.id)}
                      className={`
                        py-4 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-300 hover-lift
                        ${showCorrect
                          ? "bg-green-500/20 border-green-500 text-green-300 scale-105"
                          : showWrong
                            ? "opacity-30 scale-95"
                            : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-pink-400/50"}
                        ${!isAnimating && !feedback ? "hover:scale-105" : ""}
                      `}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg">{opt.emoji}</span>
                        <span>{opt.label}</span>
                      </div>
                    </button>
                  );
                })}
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

          {/* Game Over Modal */}
          {!isPlaying && score > 0 && (
            <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in rounded-3xl">
              <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mb-4">
                <Target className="text-pink-400" size={24} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Emotional Intelligence!</h3>
              <p className="text-purple-300 mb-4">You've improved your emotion recognition skills</p>
              <div className="text-5xl font-black bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">{score}</div>
              <div className="text-sm text-gray-400 mb-6">Level {level} • {bestStreak} best streak</div>

              <button
                onClick={startGame}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold shadow-lg hover:scale-105 transition-all duration-300"
              >
                Practice Again
              </button>
            </div>
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
        `}</style>
      </div>
    </GameSessionTracker>
  );
}