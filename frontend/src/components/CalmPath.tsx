import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Trophy, Play, RotateCcw, Zap, Wind, Heart, Shield } from "lucide-react";
import { submitGameSession } from "../api/neuroNestApi";
import { supabase } from "../lib/supabase";
import GameSessionTracker from "./GameSessionTracker";

// --- Game Constants ---
const PLAYER_RADIUS = 12;
const OBSTACLE_WIDTH = 50;
const OBSTACLE_HEIGHT = 20;
const ORB_RADIUS = 8;
const BASE_SPEED = 3;
const MAX_SPEED = 8;

export default function CalmPath() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Game State ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [speed, setSpeed] = useState(BASE_SPEED);
  const [feedback, setFeedback] = useState<string | null>(null);

  // --- Refs for Game Loop (Mutable state without re-renders) ---
  const gameState = useRef({
    playerX: 0, // Will be set on mount
    obstacles: [] as { x: number; y: number; id: number }[],
    orbs: [] as { x: number; y: number; id: number }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    score: 0,
    speed: BASE_SPEED,
    lives: 3,
    frameCount: 0,
    isShielded: false,
    shieldTimer: 0
  });

  const requestRef = useRef<number>(0);

  // --- 1. GAME ENGINE ---
  const update = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameState.current;

    // --- A. SPAWN LOGIC ---
    state.frameCount++;

    // Spawn Obstacles (Stress)
    // Spawns faster as score increases
    const spawnRate = Math.max(30, 100 - Math.floor(state.score / 50));
    if (state.frameCount % spawnRate === 0) {
      state.obstacles.push({
        id: Math.random(),
        x: Math.random() * (canvas.width - OBSTACLE_WIDTH),
        y: -50,
      });
    }

    // Spawn Calm Orbs (Relief)
    if (state.frameCount % 120 === 0) {
      state.orbs.push({
        id: Math.random(),
        x: Math.random() * (canvas.width - ORB_RADIUS * 2),
        y: -50,
      });
    }

    // --- B. PHYSICS & MOVEMENT ---

    // Move Obstacles
    state.obstacles.forEach(ob => ob.y += state.speed);
    // Move Orbs
    state.orbs.forEach(orb => orb.y += state.speed);

    // Remove off-screen entities
    state.obstacles = state.obstacles.filter(ob => ob.y < canvas.height);
    state.orbs = state.orbs.filter(orb => orb.y < canvas.height);

    // Gradual Speed Up (Anxiety building)
    if (state.frameCount % 300 === 0 && state.speed < MAX_SPEED) {
      state.speed += 0.2;
      setSpeed(parseFloat(state.speed.toFixed(1)));
    }

    // Shield Decay
    if (state.shieldTimer > 0) state.shieldTimer--;
    if (state.shieldTimer <= 0) state.isShielded = false;

    // --- C. COLLISION DETECTION ---

    // 1. Player vs Obstacles
    state.obstacles.forEach((ob, index) => {
      // Simple Rect vs Circle collision approximation
      const distX = Math.abs(state.playerX - ob.x - OBSTACLE_WIDTH / 2);
      const distY = Math.abs((canvas.height - 100) - ob.y - OBSTACLE_HEIGHT / 2);

      if (distX < (OBSTACLE_WIDTH / 2 + PLAYER_RADIUS) && distY < (OBSTACLE_HEIGHT / 2 + PLAYER_RADIUS)) {
        // HIT!
        if (!state.isShielded) {
          createExplosion(state.playerX, canvas.height - 100, "red");
          state.obstacles.splice(index, 1);
          handleLifeLost();
        } else {
          // Shield Hit (Safe)
          createExplosion(ob.x, ob.y, "cyan");
          state.obstacles.splice(index, 1);
        }
      }
    });

    // 2. Player vs Orbs
    state.orbs.forEach((orb, index) => {
      const dx = state.playerX - orb.x;
      const dy = (canvas.height - 100) - orb.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < PLAYER_RADIUS + ORB_RADIUS) {
        // COLLECT!
        createExplosion(orb.x, orb.y, "gold");
        state.orbs.splice(index, 1);
        handleOrbCollect();
      }
    });


    // --- D. RENDERING ---

    // 1. Clear Screen
    ctx.fillStyle = "#0b0616";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Moving Grid (The "Flow" effect)
    ctx.strokeStyle = "rgba(79, 70, 229, 0.2)";
    ctx.lineWidth = 1;
    const gridOffset = (state.frameCount * state.speed) % 50;

    // Vertical lines
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    // Horizontal moving lines
    for (let i = gridOffset; i < canvas.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // 3. Draw Player
    ctx.shadowBlur = 20;
    ctx.shadowColor = state.isShielded ? "#22d3ee" : "#a855f7";
    ctx.fillStyle = state.isShielded ? "#22d3ee" : "#a855f7";
    ctx.beginPath();
    ctx.arc(state.playerX, canvas.height - 100, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Player Trail
    ctx.beginPath();
    ctx.moveTo(state.playerX, canvas.height - 100);
    ctx.lineTo(state.playerX, canvas.height - 80 + (state.speed * 5));
    ctx.strokeStyle = state.isShielded ? "rgba(34, 211, 238, 0.5)" : "rgba(168, 85, 247, 0.5)";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.shadowBlur = 0; // Reset shadow

    // 4. Draw Obstacles (Stress Blocks)
    ctx.fillStyle = "#f43f5e"; // Red
    state.obstacles.forEach(ob => {
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#f43f5e";
      ctx.fillRect(ob.x, ob.y, OBSTACLE_WIDTH, OBSTACLE_HEIGHT);
      ctx.shadowBlur = 0;
    });

    // 5. Draw Orbs (Calm Orbs)
    ctx.fillStyle = "#fbbf24"; // Gold
    state.orbs.forEach(orb => {
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#fbbf24";
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, ORB_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 6. Draw Particles
    state.particles.forEach((p, index) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;

      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (p.life <= 0) state.particles.splice(index, 1);
    });

    // Loop
    requestRef.current = requestAnimationFrame(update);
  };

  // --- 3. HELPER FUNCTIONS ---

  const handleOrbCollect = () => {
    gameState.current.score += 50;
    setScore(gameState.current.score);

    // THERAPEUTIC MECHANIC: Orbs slow down the chaos
    if (gameState.current.speed > BASE_SPEED) {
      gameState.current.speed -= 0.5;
      setSpeed(parseFloat(gameState.current.speed.toFixed(1)));
      setFeedback("Slowing Down...");
    } else {
      setFeedback("Calm & Focused");
    }
    setTimeout(() => setFeedback(null), 1000);
  };

  const handleLifeLost = () => {
    gameState.current.lives -= 1;
    setLives(gameState.current.lives);
    setFeedback("Ouch! -1 Life");

    // Temporary Shield on hit
    gameState.current.isShielded = true;
    gameState.current.shieldTimer = 120; // 2 seconds at 60fps

    if (gameState.current.lives <= 0) {
      endGame();
    }
    setTimeout(() => setFeedback(null), 1000);
  };

  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 10; i++) {
      gameState.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 1,
        color
      });
    }
  };

  const startGame = () => {
    // Reset State
    gameState.current = {
      playerX: canvasRef.current ? canvasRef.current.width / 2 : 150,
      obstacles: [],
      orbs: [],
      particles: [],
      score: 0,
      speed: BASE_SPEED,
      lives: 3,
      frameCount: 0,
      isShielded: false,
      shieldTimer: 0
    };

    setScore(0);
    setLives(3);
    setSpeed(BASE_SPEED);
    setIsPlaying(true);
    setIsGameOver(false);

    requestRef.current = requestAnimationFrame(update);
  };

  const endGame = async () => {
    setIsPlaying(false);
    setIsGameOver(true);
    cancelAnimationFrame(requestRef.current);

    // GameSessionTracker will handle saving the session
  };

  // --- 4. INPUT HANDLING ---
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isGameOver) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      gameState.current.playerX = e.clientX - rect.left;
    }
  };

  // Stop loop on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  return (
    <GameSessionTracker gameName="Calm Path">
      <div className="min-h-screen bg-[#0b0616] text-white flex flex-col items-center justify-center p-4">

        {/* Header */}
        <div className="w-full max-w-lg flex justify-between items-center mb-6">
          <button onClick={() => navigate("/dashboard")} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
            <X size={24} />
          </button>

          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <Heart
                key={i}
                size={24}
                className={`${i < lives ? "fill-rose-500 text-rose-500" : "fill-gray-800 text-gray-800"} transition-colors`}
              />
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-cyan-400">
              <Wind size={18} />
              <span className="font-mono text-sm">{speed}x</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
              <Trophy size={18} className="text-yellow-400" />
              <span className="font-mono text-xl">{score}</span>
            </div>
          </div>
        </div>

        {/* GAME CANVAS CONTAINER */}
        <div className="relative group cursor-none">
          <canvas
            ref={canvasRef}
            width={400}
            height={600}
            onMouseMove={handleMouseMove}
            className="bg-[#120b22] rounded-3xl border border-white/10 shadow-2xl touch-none"
          />

          {/* FEEDBACK OVERLAY */}
          {feedback && (
            <div className="absolute top-20 w-full text-center pointer-events-none">
              <span className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full font-bold text-white shadow-lg animate-bounce">
                {feedback}
              </span>
            </div>
          )}

          {/* START SCREEN */}
          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0b0616]/80 backdrop-blur-sm p-8 text-center rounded-3xl">
              <Zap size={64} className="text-cyan-400 mb-6 animate-pulse" />
              <h2 className="text-3xl font-bold text-white mb-4">Cosmic Flow</h2>
              <p className="text-gray-300 mb-8 leading-relaxed max-w-xs">
                Guide your spark through the neon stream.
                <br /><br />
                <span className="text-yellow-400 font-bold">Collect Orbs</span> to score points and <span className="text-cyan-400 font-bold">slow down</span> the chaos.
                <br />
                Avoid the red blocks.
              </p>
              <button
                onClick={startGame}
                className="px-8 py-4 bg-cyan-600 hover:bg-cyan-700 rounded-xl font-bold text-lg transition-all shadow-glow flex items-center gap-2"
              >
                <Play size={20} /> Enter Flow
              </button>
            </div>
          )}

          {/* GAME OVER SCREEN */}
          {isGameOver && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0b0616]/90 backdrop-blur-sm p-8 text-center rounded-3xl animate-fade-in">
              <Trophy size={64} className="text-yellow-400 mb-6" />
              <h2 className="text-3xl font-bold text-white mb-2">Flow Interrupted</h2>
              <p className="text-gray-400 mb-6">Final Score: {score}</p>

              <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
                <div className="bg-white/5 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase">Max Speed</p>
                  <p className="text-xl font-bold text-cyan-400">{speed}x</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase">Focus</p>
                  <p className="text-xl font-bold text-purple-400">{score > 500 ? "Zen Master" : "Novice"}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={startGame}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition flex items-center gap-2"
                >
                  <RotateCcw size={18} /> Try Again
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-xl font-bold transition shadow-glow"
                >
                  Finish
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions Footer */}
        <p className="mt-8 text-gray-500 text-sm flex items-center gap-2">
          <Shield size={14} /> Tip: Collecting orbs reduces anxiety (speed).
        </p>

      </div>
    </GameSessionTracker>
  );
}