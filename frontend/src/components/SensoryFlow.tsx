import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Feather, Volume2, VolumeX, Wind, Target, CheckCircle, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GameSessionTracker from "./GameSessionTracker";

// Types
type ShapeType = "circle" | "square";
type ColorType = "blue" | "purple" | "teal";

interface FloatingShape {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: ShapeType;
  color: ColorType;
  radius: number;
  isDragging: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export default function SensoryFlow() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game State
  const [score, setScore] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [speed, setSpeed] = useState(0.5);
  const [level, setLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [targetScore, setTargetScore] = useState(10);

  // Refs for game loop to avoid re-renders
  const shapesRef = useRef<FloatingShape[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const dragRef = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null);
  const sessionTimerRef = useRef<number | null>(null);

  // Configuration
  const COLORS = {
    blue: { main: "#60a5fa", glow: "rgba(96, 165, 250, 0.4)" },
    purple: { main: "#a78bfa", glow: "rgba(167, 139, 250, 0.4)" },
    teal: { main: "#2dd4bf", glow: "rgba(45, 212, 191, 0.4)" },
  };

  const ZONES = [
    { color: "blue" as const, x: 0.2, label: "Calm" },
    { color: "purple" as const, x: 0.5, label: "Focus" },
    { color: "teal" as const, x: 0.8, label: "Flow" },
  ];

  // Session timer
  useEffect(() => {
    if (isPlaying && !isComplete) {
      sessionTimerRef.current = window.setInterval(() => {
        setSessionTime(t => t + 1);
      }, 1000);
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [isPlaying, isComplete]);

  // Check completion
  useEffect(() => {
    if (score >= targetScore && isPlaying) {
      setIsComplete(true);
      setIsPlaying(false);
    }
  }, [score, targetScore, isPlaying]);

  const startSession = () => {
    setIsPlaying(true);
    setIsComplete(false);
    setScore(0);
    setLevel(1);
    setSessionTime(0);
    setTargetScore(10);
    shapesRef.current = [];
    particlesRef.current = [];
  };

  const spawnShape = (width: number, height: number) => {
    const types: ShapeType[] = ["circle", "square"];
    const colors: ColorType[] = ["blue", "purple", "teal"];

    const shape: FloatingShape = {
      id: Math.random(),
      x: Math.random() * width,
      y: -50,
      vx: (Math.random() - 0.5) * 0.5,
      vy: Math.random() * 0.5 + 0.2,
      type: types[Math.floor(Math.random() * types.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      radius: 30 + Math.random() * 10,
      isDragging: false,
    };

    shapesRef.current.push(shape);
  };

  const createParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 12; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1.0,
        color
      });
    }
  };

  // Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener("resize", updateSize);

    // Initial Spawn
    if (isPlaying) {
      for (let i = 0; i < 5; i++) spawnShape(canvas.width, canvas.height);
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isPlaying && !isComplete) {
        // Draw start screen
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 100, 400, 200);
        ctx.fillStyle = "white";
        ctx.font = "24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Sensory Flow", canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = "16px sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.fillText("Drag shapes to matching colored zones", canvas.width / 2, canvas.height / 2);
        ctx.fillText(`Goal: Match ${targetScore} shapes`, canvas.width / 2, canvas.height / 2 + 30);

        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Draw Zones
      ZONES.forEach(zone => {
        const xPos = canvas.width * zone.x;
        const gradient = ctx.createRadialGradient(xPos, canvas.height, 0, xPos, canvas.height, 200);
        gradient.addColorStop(0, COLORS[zone.color].glow);
        gradient.addColorStop(1, "transparent");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Zone Indicator
        ctx.beginPath();
        ctx.arc(xPos, canvas.height - 60, 40, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS[zone.color].main;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Zone Label
        ctx.fillStyle = COLORS[zone.color].main;
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(zone.label, xPos, canvas.height - 20);
      });

      // Update & Draw Shapes
      shapesRef.current.forEach((shape, index) => {
        if (!shape.isDragging) {
          shape.x += shape.vx * speed;
          shape.y += shape.vy * speed;

          if (shape.x < shape.radius || shape.x > canvas.width - shape.radius) shape.vx *= -1;

          if (shape.y > canvas.height + 100) {
            shapesRef.current.splice(index, 1);
            if (isPlaying) spawnShape(canvas.width, canvas.height);
            return;
          }
        }

        // Draw Shape with glow
        ctx.shadowBlur = 25;
        ctx.shadowColor = COLORS[shape.color].main;
        ctx.fillStyle = COLORS[shape.color].main;

        ctx.beginPath();
        if (shape.type === "circle") {
          ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
        } else {
          ctx.roundRect(shape.x - shape.radius, shape.y - shape.radius, shape.radius * 2, shape.radius * 2, 10);
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw inner highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.beginPath();
        if (shape.type === "circle") {
          ctx.arc(shape.x - shape.radius / 3, shape.y - shape.radius / 3, shape.radius / 3, 0, Math.PI * 2);
        } else {
          ctx.roundRect(shape.x - shape.radius + 10, shape.y - shape.radius + 10, shape.radius / 2, shape.radius / 2, 5);
        }
        ctx.fill();
      });

      // Particles
      particlesRef.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.life -= 0.015;
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          return;
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // Maintain population
      if (isPlaying && shapesRef.current.length < 6 && Math.random() < 0.02) {
        spawnShape(canvas.width, canvas.height);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", updateSize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [speed, isPlaying, isComplete]);

  // Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isPlaying) {
      startSession();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = shapesRef.current.length - 1; i >= 0; i--) {
      const s = shapesRef.current[i];
      const dist = Math.hypot(s.x - x, s.y - y);

      if (dist < s.radius + 10) {
        s.isDragging = true;
        dragRef.current = { id: s.id, offsetX: s.x - x, offsetY: s.y - y };
        shapesRef.current.splice(i, 1);
        shapesRef.current.push(s);
        return;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const shape = shapesRef.current.find(s => s.id === dragRef.current?.id);
    if (shape) {
      shape.x = e.clientX - rect.left + dragRef.current.offsetX;
      shape.y = e.clientY - rect.top + dragRef.current.offsetY;
    }
  };

  const handlePointerUp = () => {
    if (!dragRef.current) return;

    const shapeIndex = shapesRef.current.findIndex(s => s.id === dragRef.current?.id);
    if (shapeIndex !== -1) {
      const shape = shapesRef.current[shapeIndex];
      shape.isDragging = false;

      const canvas = canvasRef.current;
      if (canvas && shape.y > canvas.height - 150) {
        const zone = ZONES.find(z => Math.abs((canvas.width * z.x) - shape.x) < 80);

        if (zone && zone.color === shape.color) {
          createParticles(shape.x, shape.y, COLORS[shape.color].main);
          shapesRef.current.splice(shapeIndex, 1);
          setScore(s => {
            const newScore = s + 1;
            // Level up every 10 matches
            if (newScore % 10 === 0) {
              setLevel(l => l + 1);
              setTargetScore(t => t + 10);
            }
            return newScore;
          });
          if (isPlaying) spawnShape(canvas.width, canvas.height);
        }
      }
    }
    dragRef.current = null;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <GameSessionTracker gameName="Sensory Flow" gameScore={score}>
      <div className="relative min-h-screen bg-gradient-to-br from-[#0b0616] via-[#1a0b2e] to-[#0b0616] overflow-hidden">

        {/* UI Overlay */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pointer-events-none">

          {/* Back & Title */}
          <div className="pointer-events-auto">
            <button
              onClick={() => navigate("/games")}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition mb-4 hover:scale-110"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
              <Feather className="animate-float text-teal-400" /> Sensory Flow
            </h1>
            <p className="text-sm text-teal-200/50">
              {isPlaying ? `Goal: ${targetScore} matches` : "Tap to start flowing"}
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-col items-end gap-4 pointer-events-auto">
            <div className="grid grid-cols-2 gap-4 text-right">
              <div className="glass rounded-xl p-3">
                <p className="text-xs text-gray-400 uppercase tracking-widest">Score</p>
                <p className="text-2xl font-light text-white">{score}</p>
              </div>
              <div className="glass rounded-xl p-3">
                <p className="text-xs text-gray-400 uppercase tracking-widest">Time</p>
                <p className="text-2xl font-light text-white">{formatTime(sessionTime)}</p>
              </div>
            </div>

            {/* Progress */}
            {isPlaying && (
              <div className="glass rounded-xl p-3 min-w-[200px]">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>Level {level}</span>
                  <span>{score}/{targetScore}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-500"
                    style={{ width: `${(score / targetScore) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => setSpeed(s => s === 0.2 ? 0.5 : s === 0.5 ? 1.0 : 0.2)}
                className="p-3 rounded-xl glass hover:bg-white/10 text-white transition"
                title="Flow Speed"
              >
                <Wind size={20} className={speed > 0.5 ? "text-teal-400" : "text-white"} />
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-3 rounded-xl glass hover:bg-white/10 text-white transition"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Layer */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="block w-full h-full touch-none cursor-grab active:cursor-grabbing"
        />

        {/* Completion Modal */}
        {isComplete && (
          <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="glass rounded-3xl p-8 max-w-md w-full text-center border border-teal-400/20">
              <div className="w-16 h-16 mx-auto mb-4 glass rounded-2xl flex items-center justify-center">
                <CheckCircle className="text-teal-400" size={32} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Flow Complete!</h3>
              <p className="text-teal-300 mb-4">You've achieved perfect sensory harmony</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass rounded-xl p-3">
                  <div className="text-2xl font-bold text-white">{score}</div>
                  <div className="text-xs text-gray-400">Matches</div>
                </div>
                <div className="glass rounded-xl p-3">
                  <div className="text-2xl font-bold text-white">{formatTime(sessionTime)}</div>
                  <div className="text-xs text-gray-400">Duration</div>
                </div>
              </div>

              <button
                onClick={startSession}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold shadow-lg hover:scale-105 transition-all duration-300"
              >
                Flow Again
              </button>
            </div>
          </div>
        )}

        <style>{`
          .animate-float { animation: float 6s ease-in-out infinite; }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
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