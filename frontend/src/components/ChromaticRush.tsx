import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Zap, Trophy, Play, RotateCcw, Flame } from "lucide-react";
import { submitGameSession, getPersonalBest } from "../api/neuroNestApi";
import { supabase } from "../lib/supabase";
import GameSessionTracker from "./GameSessionTracker";

const ChromaticRush = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // --- Game State (Logic Unchanged) ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [speed, setSpeed] = useState(0.9);

  // Load High Score
  useEffect(() => {
    getPersonalBest("Chromatic Rush").then(setHighScore);
  }, []);

  // Colors
  const [arcColors, setArcColors] = useState<string[]>([
    "#E63946", "#06FFA5", "#FFD60A",
  ]);
  const [radiusColor, setRadiusColor] = useState("#E63946");
  const [wasInMatchingArc, setWasInMatchingArc] = useState(false);

  const colorPalette = [
    "#E63946", "#06FFA5", "#8338EC", "#FFD60A",
    "#00B4D8", "#FF006E", "#7209B7", "#FF9E00",
  ];

  // --- Logic Functions ---
  const getRandomDifferentColor = (current: string, colors: string[]): string => {
    const others = colors.filter((c) => c !== current);
    return others[Math.floor(Math.random() * others.length)];
  };

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setRotation(0);
    setSpeed(0.9);

    const baseColors = colorPalette.slice(0, 3);
    setArcColors(baseColors);
    const startColor = baseColors[Math.floor(Math.random() * baseColors.length)];
    setRadiusColor(startColor);
    setWasInMatchingArc(false);
  };

  const isInMatchingArc = (rot: number) => {
    const anglePerArc = 360 / arcColors.length;
    // Normalize rotation to 0-360 positive
    const normalized = (rot % 360 + 360) % 360;
    const index = Math.floor(normalized / anglePerArc);
    // Safety check for index bounds
    if (index >= 0 && index < arcColors.length) {
      return arcColors[index] === radiusColor;
    }
    return false;
  };

  const handleTap = () => {
    if (!isPlaying && !isGameOver) {
      startGame();
      return;
    }
    if (isGameOver) {
      startGame();
      return;
    }

    if (isInMatchingArc(rotation)) {
      // SUCCESS
      const newScore = score + 1;
      setScore(newScore);
      if (newScore > highScore) setHighScore(newScore);

      setSpeed((s) => s + 0.05);

      // CRITICAL: Reset this BEFORE changing colors to prevent false game-over
      setWasInMatchingArc(false);

      // Level Up: Add more colors every 5 points
      if (newScore % 5 === 0 && arcColors.length < colorPalette.length) {
        const newColors = [...arcColors, colorPalette[arcColors.length]];
        setArcColors(newColors);
        setRadiusColor(getRandomDifferentColor(radiusColor, newColors));
      } else {
        setRadiusColor(getRandomDifferentColor(radiusColor, arcColors));
      }
    } else {
      // FAIL
      endGame();
    }
  };

  const endGame = async () => {
    setIsGameOver(true);
    setIsPlaying(false);
    // GameSessionTracker will handle saving the session
  };

  // --- Animation Loop ---
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const animate = () => {
      setRotation((prev) => {
        const next = (prev + speed) % 360;
        const nowInArc = isInMatchingArc(next);

        // If we left the correct arc without tapping -> Game Over
        if (wasInMatchingArc && !nowInArc) {
          endGame();
          return prev;
        }

        setWasInMatchingArc(nowInArc);
        return next;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, isGameOver, speed, arcColors, radiusColor, wasInMatchingArc]);

  // --- Canvas Rendering (The Visual Upgrade) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Retina display scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = 120; // Slightly smaller to fit glow
    const thickness = 20;

    ctx.clearRect(0, 0, rect.width, rect.height);

    // 1. Draw Arcs (The Tracks)
    const anglePerArc = (2 * Math.PI) / arcColors.length;

    arcColors.forEach((color, i) => {
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        radius,
        i * anglePerArc - Math.PI / 2, // Start -90deg
        (i + 1) * anglePerArc - Math.PI / 2
      );
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.lineCap = "butt"; // Cleaner edges for segments

      // Neon Glow Effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;

      ctx.stroke();

      // Reset Shadow for next ops
      ctx.shadowBlur = 0;
    });

    // 2. Draw The Spinner (The Player)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180 - Math.PI / 2);

    // Glowy Beam
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(radius - thickness / 2, 0); // Stop inside the ring
    ctx.strokeStyle = "white"; // Inner core
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "white";
    ctx.stroke();

    // The "Head" of the spinner (matches target color)
    ctx.beginPath();
    ctx.arc(radius, 0, 14, 0, Math.PI * 2); // Dot at the end
    ctx.fillStyle = radiusColor;
    ctx.shadowBlur = 20;
    ctx.shadowColor = radiusColor;
    ctx.fill();

    ctx.restore();

    // 3. Center Hub (Decoration)
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
    ctx.fillStyle = "#1e1b4b";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [rotation, arcColors, radiusColor]);

  return (
    <GameSessionTracker gameName="Chromatic Rush" gameScore={score}>
      <div className="min-h-screen bg-[#0b0616] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">

        {/* Background Ambience */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[100px] rounded-full animate-pulse-slow" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[100px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>

        {/* Header */}
        <div className="absolute top-0 w-full p-6 flex justify-between items-center z-20">
          <button onClick={() => navigate("/dashboard")} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
            <X size={24} />
          </button>
        </div>

        {/* --- GAME CARD --- */}
        <div className="relative w-full max-w-md bg-[#120b22] border border-white/10 rounded-3xl p-8 shadow-2xl z-10 flex flex-col items-center">

          {/* Score Display - Above Title */}
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl flex items-center gap-2 backdrop-blur-md">
              <Trophy size={20} className="text-yellow-400" />
              <span className="font-mono text-2xl font-bold">{score}</span>
            </div>
            <div className="text-sm text-gray-400 font-mono">
              HIGH: {highScore}
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-1">
              Chromatic Rush
            </h1>
            <p className="text-gray-400 text-sm">Tap when the colors match.</p>
          </div>

          {/* Canvas Container */}
          <div className="relative cursor-pointer group" onClick={handleTap}>
            <canvas
              ref={canvasRef}
              style={{ width: '340px', height: '340px' }} // CSS size
              className="mx-auto rounded-full transition-transform active:scale-95 duration-100"
            />

            {/* Start Overlay */}
            {!isPlaying && !isGameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full backdrop-blur-sm transition-opacity group-hover:bg-black/50">
                <Play size={48} className="text-white opacity-80 animate-pulse" fill="currentColor" />
              </div>
            )}
          </div>

          {/* Footer / Controls */}
          <div className="mt-8 w-full">
            {!isPlaying && !isGameOver && (
              <button
                onClick={startGame}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 rounded-xl font-bold text-white text-lg transition shadow-lg flex items-center justify-center gap-2"
              >
                <Zap size={20} fill="currentColor" /> START GAME
              </button>
            )}

            {isGameOver && (
              <div className="text-center animate-fade-in">
                <p className="text-red-400 font-bold text-xl mb-4 flex items-center justify-center gap-2">
                  <Flame size={20} /> GAME OVER
                </p>
                <button
                  onClick={startGame}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold text-white transition flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} /> TRY AGAIN
                </button>
              </div>
            )}

            {isPlaying && (
              <p className="text-center text-gray-500 text-xs mt-2 animate-pulse">
                Tap anywhere on the circle...
              </p>
            )}
          </div>

        </div>

        {/* Global Styles */}
        <style>{`
        .animate-pulse-slow { animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      </div>
    </GameSessionTracker>
  );
};

export default ChromaticRush;