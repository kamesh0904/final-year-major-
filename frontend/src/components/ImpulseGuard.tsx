import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, Zap, Target, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GameSessionTracker from "./GameSessionTracker";

type GameState = "idle" | "waiting" | "cue" | "false-alarm" | "success" | "fail";

export default function ImpulseGuard() {
  const navigate = useNavigate();

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [bestReactionTime, setBestReactionTime] = useState<number | null>(null);

  const [gameState, setGameState] = useState<GameState>("idle");
  const [message, setMessage] = useState("Ready to test your impulse control?");
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [particles, setParticles] = useState<Array<{ id: number, x: number, y: number }>>([]);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const particleIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Create particle effect
  const createParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: Math.random() * 100,
        y: Math.random() * 100
      });
    }
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1000);
  };

  const startRound = () => {
    setGameState("waiting");
    setMessage("Wait for the signal... Stay focused!");
    setReactionTime(null);

    // Dynamic difficulty based on level
    const baseDelay = Math.max(1000, 3000 - (level * 200));
    const delay = Math.random() * baseDelay + 1500;

    timerRef.current = setTimeout(() => {
      triggerSignal();
    }, delay);
  };

  const triggerSignal = () => {
    // Increase false alarm chance with level
    const falseAlarmChance = Math.min(0.4, 0.2 + (level * 0.02));
    const isFalseAlarm = Math.random() < falseAlarmChance;

    if (isFalseAlarm) {
      setGameState("false-alarm");
      setMessage("🚫 RESIST! Don't tap!");
      timerRef.current = setTimeout(() => {
        startRound();
      }, 1500);
    } else {
      setGameState("cue");
      setMessage("⚡ TAP NOW!");
      startTimeRef.current = Date.now();

      // Auto-fail if too slow (gets faster with level)
      const timeLimit = Math.max(800, 1500 - (level * 50));
      timerRef.current = setTimeout(() => {
        if (gameState === "cue") {
          handleFail("Too slow! React faster!");
        }
      }, timeLimit);
    }
  };

  const handleTap = () => {
    if (gameState === "idle" || gameState === "success" || gameState === "fail") return;

    if (gameState === "waiting") {
      handleFail("Too early! Wait for the signal!");
      setCombo(0);
    } else if (gameState === "false-alarm") {
      handleFail("Caught by the trap! Stay focused!");
      setCombo(0);
    } else if (gameState === "cue") {
      const time = Date.now() - startTimeRef.current;
      handleSuccess(time);
    }
  };

  const handleFail = (reason: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setGameState("fail");
    setMessage(reason);
    setAttempts((p) => p + 1);
    setCombo(0);

    setTimeout(startRound, 2000);
  };

  const handleSuccess = (time: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setGameState("success");
    setReactionTime(time);

    // Update best reaction time
    if (!bestReactionTime || time < bestReactionTime) {
      setBestReactionTime(time);
    }

    // Calculate points based on speed and combo
    const speedBonus = Math.max(1, Math.floor((1000 - time) / 100));
    const comboBonus = combo * 2;
    const points = 10 + speedBonus + comboBonus;

    setScore((s) => {
      const newScore = s + points;
      if (newScore > highScore) setHighScore(newScore);
      return newScore;
    });

    setCombo(c => c + 1);
    setAttempts((p) => p + 1);

    // Level up every 10 successful taps
    if ((score + points) >= level * 100) {
      setLevel(l => l + 1);
      setMessage(`🎉 LEVEL UP! ${time}ms (+${points} pts)`);
    } else {
      setMessage(`⚡ PERFECT! ${time}ms (+${points} pts)`);
    }

    createParticles();
    setTimeout(startRound, 1800);
  };

  const getPerformanceRating = () => {
    if (!bestReactionTime) return "";
    if (bestReactionTime < 200) return "🏆 Lightning Fast";
    if (bestReactionTime < 300) return "⚡ Super Quick";
    if (bestReactionTime < 400) return "🎯 Sharp";
    if (bestReactionTime < 500) return "👍 Good";
    return "🔥 Keep Training";
  };

  return (
    <GameSessionTracker gameName="Impulse Guard">
      <div className="min-h-screen bg-gradient-to-br from-[#0b0616] via-[#1a0b2e] to-[#0b0616] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gradient-to-br from-[#120b22] to-[#1a0f2e] border border-purple-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">

          {/* Animated background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-blue-500 rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>

          {/* Particles */}
          {particles.map(particle => (
            <div
              key={particle.id}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
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
              <h2 className="font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Impulse Guard
              </h2>
              <div className="text-xs text-gray-400">Level {level}</div>
            </div>
            <div className="w-8" />
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
            <div className="glass rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-white">{score}</div>
              <div className="text-xs text-gray-400">Score</div>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-yellow-400">{combo}</div>
              <div className="text-xs text-gray-400">Combo</div>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-green-400">
                {bestReactionTime ? `${bestReactionTime}ms` : '--'}
              </div>
              <div className="text-xs text-gray-400">Best</div>
            </div>
          </div>

          {/* Performance Rating */}
          {bestReactionTime && (
            <div className="text-center mb-4 relative z-10">
              <div className="text-sm text-purple-300">{getPerformanceRating()}</div>
            </div>
          )}

          {/* Game Area */}
          <div
            onClick={handleTap}
            className={`
              relative h-80 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 border-4 relative z-10
              ${gameState === "idle" ? "bg-gradient-to-br from-white/5 to-white/10 border-white/20 hover:border-purple-400/50" : ""}
              ${gameState === "waiting" ? "bg-gradient-to-br from-gray-900 to-gray-800 border-gray-600 animate-pulse" : ""}
              ${gameState === "cue" ? "bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-green-400 shadow-[0_0_50px_rgba(34,197,94,0.6)] animate-bounce" : ""}
              ${gameState === "false-alarm" ? "bg-gradient-to-br from-red-500/30 to-pink-500/30 border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.6)]" : ""}
              ${gameState === "fail" ? "bg-gradient-to-br from-red-900/50 to-red-800/50 border-red-600 shake" : ""}
              ${gameState === "success" ? "bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.4)]" : ""}
            `}
          >
            <div className={`transition-all duration-300 ${gameState === "cue" ? "scale-125 animate-pulse" : "scale-100"}`}>
              {gameState === "idle" && <Shield size={64} className="text-purple-400" />}
              {gameState === "waiting" && <Target size={64} className="text-gray-400 animate-spin" />}
              {gameState === "cue" && <Zap size={80} className="text-green-400 animate-bounce" />}
              {gameState === "false-alarm" && <AlertTriangle size={80} className="text-red-400 animate-pulse" />}
              {gameState === "fail" && <AlertTriangle size={64} className="text-red-400" />}
              {gameState === "success" && <Star size={64} className="text-yellow-400 animate-spin" />}
            </div>

            <p className="mt-6 text-lg font-medium text-white/90 text-center animate-fade-in">
              {message}
            </p>

            {gameState === "idle" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startRound();
                }}
                className="mt-8 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-bold shadow-lg hover:scale-105 transition-all duration-300 hover:shadow-purple-500/25"
              >
                Start Training
              </button>
            )}

            {combo > 0 && gameState !== "idle" && (
              <div className="absolute top-4 right-4 bg-yellow-500/20 border border-yellow-400/50 rounded-lg px-3 py-1">
                <span className="text-yellow-300 text-sm font-bold">x{combo} Combo!</span>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 text-center relative z-10">
            <p className="text-xs text-gray-400 mb-2">
              Tap only when you see the ⚡ signal. Resist false alarms!
            </p>
            <div className="text-xs text-purple-300">
              Level {level} • {Math.max(0, (level * 100) - score)} pts to next level
            </div>
          </div>
        </div>

        <style>{`
          .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
          @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
          }
          .glass {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
        `}</style>
      </div>
    </GameSessionTracker>
  );
}