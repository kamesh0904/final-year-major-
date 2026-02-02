import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Square, Circle, Triangle, Shuffle, Play, CheckCircle, XCircle, Zap, Star, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GameSessionTracker from "./GameSessionTracker";

type Shape = "square" | "circle" | "triangle";
type Color = "red" | "blue" | "green" | "purple";
type Rule = "color" | "shape";

interface GameItem {
  id: number;
  shape: Shape;
  color: Color;
}

export default function OrderShift() {
  const navigate = useNavigate();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(90);
  const [rule, setRule] = useState<Rule>("color");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [currentItem, setCurrentItem] = useState<GameItem | null>(null);
  const [ruleChanged, setRuleChanged] = useState(false);
  const [streak, setStreak] = useState(0);
  const [combo, setCombo] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number, x: number, y: number }>>([]);

  const timerRef = useRef<number | null>(null);
  const particleIdRef = useRef(0);

  // Dynamic targets that change with level
  const getTargets = () => {
    const baseTargets = [
      { shape: "square" as Shape, color: "red" as Color },
      { shape: "circle" as Shape, color: "blue" as Color },
    ];

    if (level >= 3) {
      baseTargets.push({ shape: "triangle" as Shape, color: "green" as Color });
    }
    if (level >= 5) {
      baseTargets.push({ shape: "square" as Shape, color: "purple" as Color });
    }

    return baseTargets;
  };

  const targets = getTargets();

  const createParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 6; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: Math.random() * 100,
        y: Math.random() * 100
      });
    }
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 800);
  };

  const generateItem = (): GameItem => {
    const shapes: Shape[] = ["square", "circle", "triangle"];
    const colors: Color[] = level >= 5 ? ["red", "blue", "green", "purple"] : ["red", "blue", "green"];

    return {
      id: Math.random(),
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  };

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setLevel(1);
    setTimeLeft(90);
    setStreak(0);
    setCombo(0);
    setRule(Math.random() > 0.5 ? "color" : "shape");
    setCurrentItem(generateItem());
  };

  const endGame = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            endGame();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying && !currentItem) {
      let newItem = generateItem();
      let attempts = 0;

      // Ensure the item can be sorted with current targets
      while (attempts < 10) {
        const canSort = targets.some(target =>
          (rule === "color" && newItem.color === target.color) ||
          (rule === "shape" && newItem.shape === target.shape)
        );

        if (canSort) break;
        newItem = generateItem();
        attempts++;
      }

      setCurrentItem(newItem);
    }
  }, [currentItem, isPlaying, rule, level]);

  const handleSort = (targetIndex: number) => {
    if (!isPlaying || !currentItem) return;

    const target = targets[targetIndex];
    let isCorrect = false;

    if (rule === "color") {
      isCorrect = currentItem.color === target.color;
    } else {
      isCorrect = currentItem.shape === target.shape;
    }

    if (isCorrect) {
      const basePoints = 10;
      const comboBonus = combo * 2;
      const levelBonus = level * 5;
      const points = basePoints + comboBonus + levelBonus;

      setScore(s => s + points);
      setStreak(s => s + 1);
      setCombo(c => c + 1);
      setFeedback("correct");
      createParticles();

      // Level up every 100 points
      if (score + points >= level * 100) {
        setLevel(l => l + 1);
        setTimeLeft(t => t + 15); // Bonus time for leveling up
      }

      // Rule switch logic - more frequent at higher levels
      const switchChance = Math.min(0.8, 0.3 + (level * 0.1));
      if (streak > 2 && Math.random() < switchChance) {
        switchRule();
        setStreak(0);
      }
    } else {
      setScore(s => Math.max(0, s - 5));
      setFeedback("wrong");
      setStreak(0);
      setCombo(0);
    }

    setTimeout(() => setFeedback(null), 600);
    setCurrentItem(null);
  };

  const switchRule = () => {
    const newRule = rule === "color" ? "shape" : "color";
    setRule(newRule);
    setRuleChanged(true);
    setTimeout(() => setRuleChanged(false), 2000);
  };

  const renderIcon = (shape: Shape, colorClass: string, size: number) => {
    const className = `${colorClass} transition-all duration-300 drop-shadow-lg`;
    if (shape === "square") return <Square size={size} className={className} fill="currentColor" fillOpacity={0.3} />;
    if (shape === "circle") return <Circle size={size} className={className} fill="currentColor" fillOpacity={0.3} />;
    if (shape === "triangle") return <Triangle size={size} className={className} fill="currentColor" fillOpacity={0.3} />;
  };

  const getColorClass = (c: Color) => {
    if (c === "red") return "text-red-400";
    if (c === "blue") return "text-blue-400";
    if (c === "green") return "text-green-400";
    if (c === "purple") return "text-purple-400";
    return "text-white";
  };

  const getRuleIcon = () => {
    if (rule === "color") return <div className="w-6 h-6 bg-gradient-to-r from-red-400 via-blue-400 to-green-400 rounded-full"></div>;
    return <Star className="text-yellow-400" size={24} />;
  };

  return (
    <GameSessionTracker gameName="Order Shift" gameScore={score}>
      <div className="min-h-screen bg-gradient-to-br from-[#0b0616] via-[#1a0b2e] to-[#0b0616] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-gradient-to-br from-[#120b22] to-[#1a0f2e] border border-purple-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">

          {/* Animated background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/3 left-1/3 w-40 h-40 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/3 right-1/3 w-32 h-32 bg-blue-500 rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>

          {/* Particles */}
          {particles.map(particle => (
            <div
              key={particle.id}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                animationDuration: '0.6s'
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
              <h2 className="font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2 justify-center">
                <Shuffle size={18} /> Order Shift
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
              <div className="text-lg font-bold text-yellow-400">{combo}</div>
              <div className="text-xs text-gray-400">Combo</div>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-green-400">{streak}</div>
              <div className="text-xs text-gray-400">Streak</div>
            </div>
          </div>

          {/* Rule Display */}
          <div className={`
            relative z-10 mb-6 p-4 rounded-xl text-center transition-all duration-500 border
            ${ruleChanged
              ? "bg-yellow-500/20 border-yellow-500 scale-105 shadow-lg shadow-yellow-500/25"
              : "bg-gradient-to-r from-white/5 to-white/10 border-white/20"
            }
          `}>
            <div className="flex items-center justify-center gap-3 mb-2">
              {getRuleIcon()}
              <p className="text-xs text-gray-300 uppercase tracking-widest">Current Rule</p>
            </div>
            <p className={`text-2xl font-black uppercase tracking-wider ${ruleChanged ? "text-yellow-400 animate-pulse" : "text-white"}`}>
              MATCH {rule}
            </p>
            {ruleChanged && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <Zap className="text-yellow-400 animate-bounce" size={16} />
                <p className="text-xs text-yellow-300">Rule Changed!</p>
                <Zap className="text-yellow-400 animate-bounce" size={16} />
              </div>
            )}
          </div>

          {/* Game Area */}
          <div className="relative h-32 flex items-center justify-center mb-6">
            {!isPlaying && !isGameOver && (
              <button onClick={startGame} className="flex flex-col items-center gap-3 text-white/50 hover:text-white transition-all duration-300 group">
                <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play size={24} className="text-purple-400" />
                </div>
                <span className="text-sm font-medium">Start Sorting</span>
              </button>
            )}

            {isPlaying && currentItem && (
              <div className="animate-in zoom-in duration-300 hover:scale-110 transition-transform">
                {renderIcon(currentItem.shape, getColorClass(currentItem.color), 80)}
              </div>
            )}

            {/* Feedback Overlay */}
            {feedback && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {feedback === "correct" ? (
                  <CheckCircle size={64} className="text-green-400 animate-bounce drop-shadow-lg" />
                ) : (
                  <XCircle size={64} className="text-red-400 animate-bounce drop-shadow-lg" />
                )}
              </div>
            )}
          </div>

          {/* Sorting Bins */}
          <div className={`grid gap-4 relative z-10 ${targets.length <= 2 ? 'grid-cols-2' : targets.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {targets.map((target, idx) => (
              <button
                key={idx}
                disabled={!isPlaying}
                onClick={() => handleSort(idx)}
                className={`
                  h-24 rounded-2xl border-2 border-dashed flex items-center justify-center
                  transition-all duration-300 hover-lift
                  ${!isPlaying
                    ? "opacity-50 border-white/10"
                    : "border-white/30 hover:border-purple-400/50 hover:bg-white/5 active:scale-95"
                  }
                `}
              >
                <div className="flex flex-col items-center gap-1">
                  {renderIcon(target.shape, getColorClass(target.color), 32)}
                  <div className="text-xs text-gray-400 capitalize">
                    {rule === "color" ? target.color : target.shape}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Progress to next level */}
          {isPlaying && (
            <div className="mt-4 relative z-10">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Level {level}</span>
                <span>{Math.max(0, (level * 100) - score)} pts to next level</span>
              </div>
              <div className="h-2 glass rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, (score % 100))}%` }}
                />
              </div>
            </div>
          )}

          {/* Game Over Modal */}
          {isGameOver && (
            <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in rounded-3xl">
              <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mb-4">
                <Target className="text-purple-400" size={24} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Excellent Adaptation!</h3>
              <p className="text-purple-300 mb-4">You successfully shifted between {rule === "color" ? "shape" : "color"} and {rule} sorting</p>
              <div className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">{score}</div>
              <div className="text-sm text-gray-400 mb-6">Level {level} • {combo} max combo</div>

              <button
                onClick={startGame}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg hover:scale-105 transition-all duration-300"
              >
                Sort Again
              </button>
            </div>
          )}

        </div>

        <style>{`
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