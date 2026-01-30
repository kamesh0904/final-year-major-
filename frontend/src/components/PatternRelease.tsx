import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, Trophy, Play, RotateCcw, Zap, AlertCircle, Heart } from "lucide-react";
import { submitGameSession } from "../api/neuroNestApi";
import { supabase } from "../lib/supabase";
import GameSessionTracker from "./GameSessionTracker";

// --- Types ---
type Tile = {
  id: number;
  color: string;
  isTilted: boolean; // The "Imperfection" (OCD Trigger)
  isTarget: boolean; // The Goal
  isTrapped: boolean; // If true, clicking this is a mistake
};

const COLORS = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-rose-500"];
const GRID_SIZE = 16; // 4x4 Grid

export default function PatternRelease() {
  const navigate = useNavigate();

  // Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3); // <--- NEW: 3 Lives System
  const [timeLeft, setTimeLeft] = useState(60); // Giving a bit more time now that lives are the constraint
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [targetColor, setTargetColor] = useState("");
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);

  // --- 1. GAME LOGIC ---
  const generateGrid = useCallback(() => {
    const newTargetColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    setTargetColor(newTargetColor);

    const newTiles: Tile[] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const isTilted = Math.random() < 0.3;

      const isTargetColor = color === newTargetColor;
      const isTrapped = isTilted;
      const isTarget = isTargetColor && !isTilted;

      newTiles.push({ id: i, color, isTilted, isTarget, isTrapped });
    }
    setTiles(newTiles);
  }, []);

  // --- 2. GAME LOOP ---
  useEffect(() => {
    let interval: any;
    if (isPlaying && timeLeft > 0 && lives > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      endGame(); // Time ran out
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeLeft, lives]);

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setLives(3); // <--- Reset Lives
    setTimeLeft(60);
    setIsPlaying(true);
    setIsGameOver(false);
    generateGrid();
  };

  const endGame = async () => {
    setIsPlaying(false);
    setIsGameOver(true);
    // GameSessionTracker will handle saving the session
  };

  // --- 3. CLICK HANDLER (With Lives Logic) ---
  const handleTileClick = (tile: Tile) => {
    if (!isPlaying) return;

    if (tile.isTarget) {
      // SUCCESS
      setScore((prev) => prev + 10 + (streak * 2));
      setStreak((prev) => prev + 1);
      setFeedback("Perfect!");
      playSound("pop");

      // Level Up Logic
      if (score > 0 && score % 50 === 0) {
        setLevel(prev => prev + 1);
        generateGrid();
        setTimeLeft(prev => prev + 10); // Bonus time
        setFeedback("Level Up! +10s");
      } else {
        setTiles(prev => prev.map(t => t.id === tile.id ? { ...t, color: "bg-transparent", isTarget: false } : t));

        const remaining = tiles.filter(t => t.id !== tile.id && t.isTarget).length;
        if (remaining === 0) generateGrid();
      }

    } else {
      // FAILURE (Clicked Trapped/Tilted OR Wrong Color)
      handleMistake(tile.isTrapped ? "Don't touch the tilted ones!" : "Wrong Color!");
    }

    // Clear feedback text
    setTimeout(() => setFeedback(null), 1000);
  };

  const handleMistake = (reason: string) => {
    const newLives = lives - 1;
    setLives(newLives); // Update State
    setStreak(0);
    setFeedback(reason);
    playSound("error");

    // Check for Game Over immediately
    if (newLives <= 0) {
      endGame();
    }
  };

  const playSound = (type: "pop" | "error") => {
    // Placeholder for audio
  };

  const getColorName = (cls: string) => cls.replace("bg-", "").replace("-500", "").toUpperCase();

  return (
    <GameSessionTracker gameName="Pattern Release">
      <div className="min-h-screen bg-[#0b0616] text-white flex flex-col items-center justify-center p-4">

        {/* Header */}
        <div className="w-full max-w-2xl flex justify-between items-center mb-8">
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

        {/* Game Area */}
        <div className="relative w-full max-w-md aspect-square bg-[#120b22] rounded-3xl border border-white/10 p-6 shadow-2xl">

          {/* START SCREEN */}
          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0b0616]/90 rounded-3xl backdrop-blur-sm p-8 text-center">
              <Zap size={64} className="text-emerald-400 mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">Focus & Ignore</h2>
              <p className="text-gray-300 mb-8 leading-relaxed">
                Your goal: Click the <span className="text-emerald-400 font-bold">PERFECT</span> tiles of the target color.
                <br /><br />
                <span className="text-rose-400 font-bold flex items-center justify-center gap-2">
                  <Heart size={16} className="fill-rose-500" /> 3 LIVES:
                </span>
                Clicking a tilted tile or wrong color costs 1 Life.
              </p>
              <button
                onClick={startGame}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-lg transition-all shadow-glow flex items-center gap-2"
              >
                <Play size={20} /> Start Training
              </button>
            </div>
          )}

          {/* GAME OVER SCREEN */}
          {isGameOver && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0b0616]/95 rounded-3xl backdrop-blur-sm p-8 text-center animate-fade-in">
              <div className="mb-4">
                {lives === 0 ? (
                  <Heart size={64} className="text-gray-600 fill-gray-800" />
                ) : (
                  <Trophy size={64} className="text-yellow-400" />
                )}
              </div>

              <h2 className="text-3xl font-bold text-white mb-2">
                {lives === 0 ? "Out of Lives!" : "Time's Up!"}
              </h2>
              <p className="text-gray-400 mb-6">Final Score: {score}</p>

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase">Accuracy</p>
                  <p className="text-xl font-bold text-emerald-400">{score > 0 ? "Good" : "Try Again"}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase">Lives Left</p>
                  <p className="text-xl font-bold text-rose-400">{lives}/3</p>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={startGame}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition flex items-center gap-2"
                >
                  <RotateCcw size={18} /> Retry
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold transition shadow-glow"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* HUD */}
          {isPlaying && (
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm">Target:</span>
                <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white ${targetColor} shadow-lg border border-white/20`}>
                  {getColorName(targetColor)}
                </div>
              </div>
              <div className={`font-mono text-2xl font-bold ${timeLeft < 10 ? "text-red-400 animate-pulse" : "text-gray-200"}`}>
                {timeLeft}s
              </div>
            </div>
          )}

          {/* GRID */}
          <div className="grid grid-cols-4 gap-3 h-[80%]">
            {tiles.map((tile) => (
              <button
                key={tile.id}
                onClick={() => handleTileClick(tile)}
                disabled={tile.color === "bg-transparent"}
                className={`
                relative rounded-xl transition-all duration-200 
                ${tile.color}
                ${tile.color === "bg-transparent" ? "opacity-0 cursor-default" : "opacity-100 hover:brightness-110 active:scale-95 shadow-lg"}
                ${tile.isTilted ? "rotate-6 border-2 border-rose-500/50" : "rotate-0 border border-white/10"}
              `}
              >
                {tile.isTilted && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <X className="text-white/50" size={32} />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* FEEDBACK POPUP */}
          {feedback && (
            <div className={`
                absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-3 rounded-full font-bold backdrop-blur-md animate-bounce pointer-events-none whitespace-nowrap z-20 shadow-2xl border
                ${feedback.includes("Perfect") || feedback.includes("Level") ? "bg-emerald-500/90 text-white border-emerald-400" : "bg-rose-500/90 text-white border-rose-400"}
            `}>
              {feedback}
            </div>
          )}

        </div>

        {/* Footer Hint */}
        <p className="mt-8 text-gray-500 text-sm max-w-md text-center">
          Tip: Preserve your hearts. It's better to be slow and accurate than fast and reckless.
        </p>

      </div>
    </GameSessionTracker>
  );
}