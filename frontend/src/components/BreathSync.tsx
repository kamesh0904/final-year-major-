import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Wind, Play, Volume2, VolumeX, Clock } from "lucide-react";
import { submitGameSession } from "../api/neuroNestApi";
import { supabase } from "../lib/supabase";
import GameSessionTracker from "./GameSessionTracker";

// --- Configuration ---
const SESSION_DURATION = 300; // 5 Minutes in seconds
const BREATH_PHASES = [
    { name: "Inhale", duration: 4000, color: "text-cyan-300" },
    { name: "Hold", duration: 7000, color: "text-indigo-300" },
    { name: "Exhale", duration: 8000, color: "text-emerald-300" },
];

export default function BreathSync() {
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // --- State ---
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [phaseIndex, setPhaseIndex] = useState(0);
    const [sessionTimeLeft, setSessionTimeLeft] = useState(SESSION_DURATION);
    const [timeLeftInPhase, setTimeLeftInPhase] = useState(BREATH_PHASES[0].duration / 1000);
    const [earnedStreak, setEarnedStreak] = useState(false);

    // Audio State
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // --- Refs for Animation ---
    const requestRef = useRef<number>(0);
    const particlesRef = useRef<{ x: number, y: number, angle: number, speed: number, radius: number, alpha: number }[]>([]);

    // --- 1. INITIALIZATION (Audio & Particles) ---
    useEffect(() => {
        // Initialize Particles
        const p = [];
        for (let i = 0; i < 80; i++) {
            p.push({
                x: 0, y: 0,
                angle: Math.random() * Math.PI * 2,
                speed: 0.2 + Math.random() * 0.8,
                radius: Math.random() * 2 + 1,
                alpha: Math.random()
            });
        }
        particlesRef.current = p;

        // Initialize Audio
        // NOTE: Replace this URL with your local file like "/sounds/nebula.mp3" if you prefer
        audioRef.current = new Audio("https://cdn.pixabay.com/download/audio/2022/02/07/audio_108f918932.mp3?filename=deep-meditation-111408.mp3");
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // --- 2. AUDIO CONTROL ---
    useEffect(() => {
        if (!audioRef.current) return;

        if (isPlaying && !isFinished && !isMuted) {
            audioRef.current.play().catch(e => console.log("Audio play blocked until interaction"));
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, isFinished, isMuted]);

    // --- 3. SESSION TIMER (5 Mins) ---
    useEffect(() => {
        if (!isPlaying || isFinished) return;

        const timer = setInterval(() => {
            setSessionTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleFinish(); // Time's up!
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isPlaying, isFinished]);

    // --- 4. BREATH LOGIC ---
    useEffect(() => {
        if (!isPlaying || isFinished) return;

        let timer: any;
        let countdown: any;
        const currentPhase = BREATH_PHASES[phaseIndex];

        // Reset phase countdown
        setTimeLeftInPhase(currentPhase.duration / 1000);

        // Countdown for the visual number
        countdown = setInterval(() => {
            setTimeLeftInPhase(prev => Math.max(0, prev - 1));
        }, 1000);

        // Switch Phase
        timer = setTimeout(() => {
            setPhaseIndex((prev) => (prev + 1) % BREATH_PHASES.length);
        }, currentPhase.duration);

        return () => {
            clearTimeout(timer);
            clearInterval(countdown);
        };
    }, [isPlaying, isFinished, phaseIndex]);

    // --- 5. CANVAS ANIMATION (Nebula Effect) ---
    const animate = (time: number) => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Responsive Canvas
        if (canvas.width !== canvas.offsetWidth) {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Clear with heavy trail for "fluid" look
        ctx.fillStyle = "rgba(11, 6, 22, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const baseRadius = 80;
        const maxRadius = 180;

        // Determine Gradient Color based on Phase
        let colorStart = "rgba(103, 232, 249, 0.4)"; // Cyan (Inhale)
        if (phaseIndex === 1) colorStart = "rgba(165, 180, 252, 0.4)"; // Indigo (Hold)
        if (phaseIndex === 2) colorStart = "rgba(110, 231, 183, 0.4)"; // Emerald (Exhale)

        // Draw Core Glow
        const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.2, centerX, centerY, maxRadius);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw Particles
        particlesRef.current.forEach(p => {
            // Physics based on Phase
            if (phaseIndex === 0) { // INHALE: Expand/Grow
                p.radius += 0.02;
                const targetDist = maxRadius;
                // No movement, just growing tension
            } else if (phaseIndex === 2) { // EXHALE: Contract/Release
                p.angle += 0.005;
                p.radius -= 0.02;
            } else { // HOLD: Orbit
                p.angle += 0.002;
            }

            // Clamp radius
            if (p.radius < 0.5) p.radius = 0.5;
            if (p.radius > 3.5) p.radius = 3.5;

            // Orbit calculation
            const pulse = Math.sin(time * 0.001); // Gentle heartbeat
            const orbitRadius = phaseIndex === 0
                ? baseRadius + (pulse * 10)
                : maxRadius;

            const x = centerX + Math.cos(p.angle + time * 0.0002 * p.speed) * (orbitRadius + p.speed * 20);
            const y = centerY + Math.sin(p.angle + time * 0.0002 * p.speed) * (orbitRadius + p.speed * 20);

            ctx.beginPath();
            // Particle color matching phase
            ctx.fillStyle = phaseIndex === 0 ? "#67e8f9" : (phaseIndex === 1 ? "#a5b4fc" : "#6ee7b7");
            ctx.globalAlpha = p.alpha;
            ctx.arc(x, y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [phaseIndex]);

    // --- ACTIONS ---

    const handleFinish = async () => {
        setIsFinished(true);
        setIsPlaying(false);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Update gentle goal completion
                await updateGentleGoalCompletion(user.id);
            }
            // GameSessionTracker will handle saving the session
        } catch (error) { console.error(error); }
    };

    const updateGentleGoalCompletion = async (userId: string) => {
        try {
            // Only award streak if user completed at least 3 minutes (180 seconds)
            const actualTimeSpent = SESSION_DURATION - sessionTimeLeft;
            const minimumTimeForStreak = 180; // 3 minutes in seconds

            if (actualTimeSpent < minimumTimeForStreak) {
                console.log(`Need at least 3 minutes for streak. Completed: ${Math.floor(actualTimeSpent / 60)}:${(actualTimeSpent % 60).toString().padStart(2, '0')}`);
                setEarnedStreak(false);
                return; // No streak update if less than 3 minutes
            }

            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            // Get current profile data
            const { data: profile } = await supabase
                .from('profiles')
                .select('gentle_goal_streak, last_gentle_goal_date')
                .eq('id', userId)
                .single();

            let newStreak = 1;
            if (profile) {
                const lastCompleted = profile.last_gentle_goal_date;
                if (lastCompleted === yesterdayStr) {
                    // Consecutive day - increment streak
                    newStreak = (profile.gentle_goal_streak || 0) + 1;
                } else if (lastCompleted === today) {
                    // Already completed today - don't update
                    setEarnedStreak(false);
                    return;
                }
                // If gap > 1 day, streak resets to 1
            }

            // Update profile with new streak and completion date
            await supabase
                .from('profiles')
                .update({
                    gentle_goal_streak: newStreak,
                    last_gentle_goal_date: today
                })
                .eq('id', userId);

            console.log(`✅ Gentle goal completed! Streak: ${newStreak} days (${Math.floor(actualTimeSpent / 60)}:${(actualTimeSpent % 60).toString().padStart(2, '0')} completed)`);
            setEarnedStreak(true);

        } catch (error) {
            console.error("Error updating gentle goal:", error);
            setEarnedStreak(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <GameSessionTracker gameName="Breath Sync">
            <div className="min-h-screen bg-[#0b0616] text-white flex flex-col items-center justify-center relative overflow-hidden transition-all duration-1000">

                {/* Background Ambience */}
                <div className="absolute inset-0 bg-gradient-radial from-[#1e1b4b] to-[#0b0616] opacity-60 pointer-events-none" />

                {/* --- HUD --- */}
                <div className="absolute top-0 w-full p-6 flex justify-between items-start z-50">
                    <button onClick={() => navigate("/dashboard")} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition backdrop-blur-md">
                        <X size={24} />
                    </button>

                    {/* Controls & Timer */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition backdrop-blur-md text-white/70 hover:text-white"
                        >
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>

                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                            <Clock size={16} className={sessionTimeLeft < 60 ? "text-red-400" : "text-cyan-300"} />
                            <span className="font-mono text-lg font-bold">{formatTime(sessionTimeLeft)}</span>
                        </div>
                    </div>
                </div>

                {/* --- CENTRAL VISUAL --- */}
                <div className="relative z-10 flex flex-col items-center justify-center">

                    {/* Canvas Layer */}
                    <div className="relative w-[400px] h-[400px] flex items-center justify-center">
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 w-full h-full"
                        />

                        {/* The Breathing Core */}
                        <div
                            className={`
                    w-64 h-64 rounded-full border-2 flex items-center justify-center backdrop-blur-sm transition-all duration-[4000ms] ease-in-out
                    ${phaseIndex === 0 ? "border-cyan-500/30 bg-cyan-500/10 scale-110 shadow-[0_0_100px_rgba(34,211,238,0.2)]" : ""}
                    ${phaseIndex === 1 ? "border-indigo-500/30 bg-indigo-500/10 scale-110 shadow-[0_0_100px_rgba(99,102,241,0.2)]" : ""}
                    ${phaseIndex === 2 ? "border-emerald-500/30 bg-emerald-500/10 scale-75 shadow-none" : ""}
                    ${!isPlaying && !isFinished ? "scale-90 opacity-80" : ""}
                `}
                            style={{
                                transitionDuration: `${BREATH_PHASES[phaseIndex].duration}ms`
                            }}
                        >
                            {/* Inner Content */}
                            <div className="text-center z-20">
                                {!isPlaying && !isFinished ? (
                                    <button
                                        onClick={() => setIsPlaying(true)}
                                        className="group flex flex-col items-center gap-3"
                                    >
                                        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20">
                                            <Play size={32} className="text-white fill-white ml-1" />
                                        </div>
                                        <span className="text-sm font-bold tracking-widest uppercase text-white/50">Begin Session</span>
                                    </button>
                                ) : isFinished ? (
                                    <div className="animate-fade-in flex flex-col items-center">
                                        <Wind size={48} className="text-cyan-300 mb-4" />
                                        <h2 className="text-2xl font-bold text-white mb-2">Session Complete</h2>
                                        {earnedStreak ? (
                                            <p className="text-emerald-400 text-sm mb-4 text-center">
                                                🎉 Gentle goal completed! Streak earned!
                                            </p>
                                        ) : (
                                            <p className="text-yellow-400 text-sm mb-4 text-center">
                                                Great session! Complete 3+ minutes next time for streak.
                                            </p>
                                        )}
                                        <button
                                            onClick={() => navigate("/dashboard")}
                                            className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold transition"
                                        >
                                            Return Home
                                        </button>
                                    </div>
                                ) : (
                                    <div className="animate-fade-in flex flex-col items-center">
                                        <h1 className={`text-4xl font-bold mb-2 transition-colors duration-1000 ${BREATH_PHASES[phaseIndex].color}`}>
                                            {BREATH_PHASES[phaseIndex].name}
                                        </h1>
                                        <div className="text-6xl font-mono font-light text-white/80">
                                            {timeLeftInPhase.toFixed(0)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                {/* --- GUIDANCE TEXT --- */}
                {isPlaying && !isFinished && (
                    <div className="absolute bottom-20 text-center animate-pulse">
                        <p className="text-white/40 text-sm font-light tracking-widest uppercase mb-4">
                            Follow the rhythm • Close your eyes if needed
                        </p>
                        <div className="flex gap-2 justify-center">
                            {BREATH_PHASES.map((p, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1 rounded-full transition-all duration-500 ${phaseIndex === idx ? "w-12 bg-white/90" : "w-4 bg-white/20"}`}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <style>{`
        .animate-fade-in { animation: fadeIn 1s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
            </div>
        </GameSessionTracker>
    );
}