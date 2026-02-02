import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Trophy, Play, RotateCcw, Zap, ArrowUp, Layers, Heart, Sparkles } from "lucide-react";
import { submitGameSession, getPersonalBest } from "../api/neuroNestApi";
import { supabase } from "../lib/supabase";
import GameSessionTracker from "./GameSessionTracker";

// --- Game Constants ---
const INITIAL_WIDTH = 200;
const BLOCK_HEIGHT = 24;
const MOVEMENT_SPEED = 3;
const GAME_AREA_HEIGHT = 400;
const PERFECT_TOLERANCE = 5;

// --- MOTIVATIONAL QUOTES ---
const PERFECT_QUOTES = [
  "Flow state achieved.",
  "You are in control.",
  "Steady and strong.",
  "Rising higher.",
  "Perfect alignment.",
  "Building momentum!"
];

const RECOVERY_QUOTES = [
  "Mistakes shrink us, but we persist.",
  "Adapt and continue.",
  "Focus on the next step.",
  "You're still rising.",
  "Small adjustment, keep going.",
  "Imperfection is okay."
];

const GAMEOVER_QUOTE = "It's okay. You can always rise again.";

type Block = {
  id: number;
  width: number;
  left: number;
  color: string;
};

const COLORS = [
  "bg-indigo-500", "bg-blue-500", "bg-cyan-500", "bg-teal-500",
  "bg-emerald-500", "bg-green-500", "bg-lime-500", "bg-yellow-500",
  "bg-amber-500", "bg-orange-500", "bg-red-500", "bg-rose-500",
  "bg-pink-500", "bg-fuchsia-500", "bg-purple-500", "bg-violet-500"
];

export default function MomentumSteps() {
  const navigate = useNavigate();

  // --- State ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [stack, setStack] = useState<Block[]>([]);
  const [currentBlock, setCurrentBlock] = useState<{ width: number; left: number; direction: 1 | -1 }>({
    width: INITIAL_WIDTH,
    left: 0,
    direction: 1,
  });

  useEffect(() => {
    getPersonalBest("Momentum Steps").then(setHighScore);
  }, []);

  // Feedback State
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"success" | "neutral" | "danger">("neutral");
  const [momentumStreak, setMomentumStreak] = useState(0);

  // --- Refs ---
  // FIXED: Added (0) as initial value to satisfy TypeScript
  const requestRef = useRef<number>(0);
  const gameRef = useRef<HTMLDivElement>(null);
  const currentBlockRef = useRef(currentBlock);

  useEffect(() => {
    currentBlockRef.current = currentBlock;
  }, [currentBlock]);

  // --- 1. GAME LOOP ---
  const animate = () => {
    if (!isPlaying || isGameOver) return;

    setCurrentBlock((prev) => {
      const containerWidth = gameRef.current?.clientWidth || 320;
      let newLeft = prev.left + (MOVEMENT_SPEED + Math.floor(score / 5)) * prev.direction;

      if (newLeft + prev.width >= containerWidth) {
        newLeft = containerWidth - prev.width;
        return { ...prev, left: newLeft, direction: -1 };
      } else if (newLeft <= 0) {
        newLeft = 0;
        return { ...prev, left: newLeft, direction: 1 };
      }

      return { ...prev, left: newLeft };
    });

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, isGameOver, score]);

  // --- 2. LOGIC HELPERS ---

  const getRandomQuote = (type: "perfect" | "recovery") => {
    const list = type === "perfect" ? PERFECT_QUOTES : RECOVERY_QUOTES;
    return list[Math.floor(Math.random() * list.length)];
  };

  const showFeedback = (text: string, type: "success" | "neutral" | "danger") => {
    setFeedback(text);
    setFeedbackType(type);
    setTimeout(() => setFeedback(null), 2000);
  };

  const startGame = () => {
    setScore(0);
    setLives(3);
    setMomentumStreak(0);
    setStack([{ id: 0, width: INITIAL_WIDTH, left: 60, color: COLORS[0] }]);
    setCurrentBlock({ width: INITIAL_WIDTH, left: 0, direction: 1 });
    setIsPlaying(true);
    setIsGameOver(false);
    setFeedback(null);
  };

  const endGame = async () => {
    setIsPlaying(false);
    setIsGameOver(true);
    cancelAnimationFrame(requestRef.current);
    // GameSessionTracker will handle saving the session
  };

  // --- 3. CLICK HANDLER ---
  const handleStep = () => {
    if (!isPlaying) return;

    const previousBlock = stack[stack.length - 1];
    const current = currentBlockRef.current;

    // Calculate Overlap
    const distance = current.left - previousBlock.left;
    const overlap = current.width - Math.abs(distance);

    if (overlap <= 0) {
      // --- MISS ---
      const newLives = lives - 1;
      setLives(newLives);
      playSound("fail");

      if (newLives <= 0) {
        endGame();
      } else {
        showFeedback("Hold steady. Try again.", "danger");
        setCurrentBlock({
          width: previousBlock.width,
          left: 0,
          direction: 1
        });
      }
      return;
    }

    // --- HIT ---
    let newWidth = overlap;
    let newLeft = current.left;
    let isPerfect = false;

    if (Math.abs(distance) <= PERFECT_TOLERANCE) {
      // --- PERFECT ---
      isPerfect = true;
      newLeft = previousBlock.left;
      newWidth = Math.min(INITIAL_WIDTH, previousBlock.width + 10);

      setMomentumStreak(prev => prev + 1);
      showFeedback(getRandomQuote("perfect"), "success");
      playSound("perfect");
    } else {
      // --- IMPERFECT ---
      if (distance < 0) newLeft = previousBlock.left;

      setMomentumStreak(0);
      showFeedback(getRandomQuote("recovery"), "neutral");
      playSound("step");
    }

    // Add to stack
    const newBlock: Block = {
      id: stack.length,
      width: newWidth,
      left: newLeft,
      color: COLORS[stack.length % COLORS.length]
    };

    setStack(prev => [...prev, newBlock]);
    setScore(prev => {
      const newScore = prev + 1;
      if (newScore > highScore) setHighScore(newScore); // Update high score locally
      return newScore;
    });

    // Spawn next block
    setCurrentBlock({
      width: newWidth,
      left: Math.random() > 0.5 ? 0 : (gameRef.current?.clientWidth || 300) - newWidth,
      direction: Math.random() > 0.5 ? 1 : -1
    });
  };

  const playSound = (type: "step" | "perfect" | "fail") => {
    // Audio placeholder
  };

  const getStackOffset = () => {
    const stackHeight = stack.length * BLOCK_HEIGHT;
    if (stackHeight < GAME_AREA_HEIGHT / 2) return 0;
    return stackHeight - GAME_AREA_HEIGHT / 2;
  };

  return (
    <GameSessionTracker gameName="Momentum Steps" gameScore={score}>
      <div className="min-h-screen bg-[#0b0616] text-white flex flex-col items-center justify-center p-4">

        {/* Header */}
        <div className="w-full max-w-md flex justify-between items-center mb-6">
          <button onClick={() => navigate("/dashboard")} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
            <X size={24} />
          </button>

          {/* Lives Display */}
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <Heart
                key={i}
                size={24}
                className={`${i < lives ? "fill-rose-500 text-rose-500" : "fill-gray-800 text-gray-800"} transition-colors duration-300`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
            <Trophy size={18} className="text-yellow-400" />
            <span className="font-mono text-xl">{score}</span>
          </div>
        </div>

        {/* GAME CONTAINER */}
        <div
          className="relative w-full max-w-md h-[500px] bg-[#120b22] rounded-3xl border border-white/10 overflow-hidden shadow-2xl cursor-pointer group"
          onClick={handleStep}
          ref={gameRef}
        >
          {/* Dynamic Background */}
          <div className="absolute inset-0 opacity-10 transition-colors duration-500"
            style={{
              backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              backgroundColor: feedbackType === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
            }}>
          </div>

          {/* --- START SCREEN --- */}
          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0b0616]/80 backdrop-blur-sm p-8 text-center">
              <Layers size={64} className="text-indigo-400 mb-6 animate-pulse" />
              <h2 className="text-3xl font-bold text-white mb-4">Neon Rise</h2>
              <p className="text-gray-300 mb-8 leading-relaxed">
                Tap to stack. <span className="text-emerald-400 font-bold">Perfect</span> moves heal you.
                <br /><br />
                <span className="text-rose-400 font-bold flex items-center justify-center gap-2">
                  <Heart size={16} className="fill-rose-500" /> 3 LIVES
                </span>
                Don't let the block fall.
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); startGame(); }}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(79,70,229,0.5)] flex items-center gap-2"
              >
                <Play size={20} /> Start Building
              </button>
            </div>
          )}

          {/* --- GAME OVER SCREEN --- */}
          {isGameOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0b0616]/90 rounded-3xl backdrop-blur-sm p-8 text-center animate-fade-in">
              <Sparkles size={64} className="text-yellow-400 mb-6" />

              <h2 className="text-3xl font-bold text-white mb-2">Rest for now.</h2>
              <p className="text-indigo-300 text-lg mb-6 italic">"{GAMEOVER_QUOTE}"</p>

              <div className="bg-white/5 p-6 rounded-2xl w-full mb-8 border border-white/10">
                <p className="text-sm text-gray-400 mb-1">Final Height</p>
                <div className="text-3xl font-bold text-white flex justify-center items-center gap-2">
                  <Trophy size={24} className="text-yellow-400" /> {score} steps
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={(e) => { e.stopPropagation(); startGame(); }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition flex items-center gap-2"
                >
                  <RotateCcw size={18} /> Rise Again
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate("/dashboard"); }}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold transition shadow-glow"
                >
                  Complete
                </button>
              </div>
            </div>
          )}

          {/* --- GAMEPLAY STACK --- */}
          <div className="absolute bottom-0 w-full transition-transform duration-500 ease-out"
            style={{ transform: `translateY(${getStackOffset()}px)` }}>

            {stack.map((block, index) => (
              <div
                key={block.id}
                className={`absolute ${block.color} shadow-[0_0_15px_rgba(0,0,0,0.5)] border-t border-white/20`}
                style={{
                  width: `${block.width}px`,
                  height: `${BLOCK_HEIGHT}px`,
                  left: `${block.left}px`,
                  bottom: `${index * BLOCK_HEIGHT}px`,
                }}
              />
            ))}

            {isPlaying && (
              <div
                className={`absolute ${COLORS[stack.length % COLORS.length]} shadow-[0_0_20px_rgba(255,255,255,0.3)] border border-white`}
                style={{
                  width: `${currentBlock.width}px`,
                  height: `${BLOCK_HEIGHT}px`,
                  left: `${currentBlock.left}px`,
                  bottom: `${stack.length * BLOCK_HEIGHT}px`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full" />
              </div>
            )}
          </div>

          {/* --- FEEDBACK POPUP --- */}
          {feedback && (
            <div className="absolute top-[20%] w-full flex justify-center pointer-events-none z-30">
              <div className={`
                    px-6 py-3 rounded-2xl font-bold shadow-2xl backdrop-blur-md animate-bounce text-center max-w-[90%]
                    ${feedbackType === 'success' ? 'bg-emerald-500/90 text-white border border-emerald-400' : ''}
                    ${feedbackType === 'neutral' ? 'bg-blue-500/90 text-white border border-blue-400' : ''}
                    ${feedbackType === 'danger' ? 'bg-rose-500/90 text-white border border-rose-400' : ''}
                `}>
                {feedbackType === 'success' && <Zap size={16} className="inline mr-2 fill-yellow-300 text-yellow-300" />}
                {feedback}
              </div>
            </div>
          )}

          {/* Floor */}
          <div className="absolute bottom-0 w-full h-1 bg-white/20" />
        </div>

      </div>
    </GameSessionTracker>
  );
}