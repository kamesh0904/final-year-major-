import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Zap, Home, Coffee, BookOpen, Music, Briefcase, Sun, LampFloor, CloudRain, Smile, CheckCircle, Target, Plus, Trash2 } from "lucide-react";
import { submitGameSession } from "../api/neuroNestApi";
import { supabase } from "../lib/supabase";
import GameSessionTracker from "./GameSessionTracker";

// --- Game Data (The Map Elements) ---
const ELEMENTS = [
    { id: 1, name: "Street Lamp", cost: 50, passive: 1, icon: LampFloor, left: 20, top: 75, scale: 1, color: "text-yellow-300", glow: "shadow-[0_0_50px_rgba(253,224,71,0.6)]" },
    { id: 2, name: "Cottage", cost: 120, passive: 2, icon: Home, left: 10, top: 55, scale: 1.5, color: "text-rose-300", glow: "shadow-[0_0_60px_rgba(253,164,175,0.5)]" },
    { id: 3, name: "Café", cost: 300, passive: 4, icon: Coffee, left: 45, top: 60, scale: 1.2, color: "text-orange-300", glow: "shadow-[0_0_60px_rgba(253,186,116,0.5)]" },
    { id: 4, name: "Library", cost: 600, passive: 6, icon: BookOpen, left: 75, top: 50, scale: 1.4, color: "text-cyan-300", glow: "shadow-[0_0_60px_rgba(103,232,249,0.5)]" },
    { id: 5, name: "Park", cost: 1000, passive: 10, icon: Music, left: 85, top: 75, scale: 1, color: "text-emerald-300", glow: "shadow-[0_0_60px_rgba(110,231,183,0.5)]" },
    { id: 6, name: "Town Hall", cost: 2000, passive: 20, icon: Briefcase, left: 40, top: 35, scale: 1.8, color: "text-purple-300", glow: "shadow-[0_0_100px_rgba(216,180,254,0.6)]" },
];

type Task = {
    id: number;
    text: string;
    completed: boolean;
};

export default function LightBuilder() {
    const navigate = useNavigate();

    // --- State ---
    const [energy, setEnergy] = useState(0);
    const [totalEnergy, setTotalEnergy] = useState(0);
    const [unlockedIds, setUnlockedIds] = useState<number[]>([]);
    const [passiveRate, setPassiveRate] = useState(0);
    const [isWon, setIsWon] = useState(false);

    // Real Life Task State
    const [tasks, setTasks] = useState<Task[]>([]);
    const [taskInput, setTaskInput] = useState("");
    const [isQuestActive, setIsQuestActive] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);

    // Visuals
    const [clickEffects, setClickEffects] = useState<{ id: number, x: number, y: number, val: number }[]>([]);

    // Day/Night Cycle (0 = Midnight, 100 = Noon)
    const progress = (unlockedIds.length / ELEMENTS.length) * 100;

    // --- Loops ---
    useEffect(() => {
        if (isWon) return;
        const interval = setInterval(() => {
            if (passiveRate > 0) {
                setEnergy(prev => prev + passiveRate);
                setTotalEnergy(prev => prev + passiveRate);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [passiveRate, isWon]);

    // Win Check
    useEffect(() => {
        if (unlockedIds.length === ELEMENTS.length && !isWon) {
            handleWin();
        }
    }, [unlockedIds]);

    const handleWin = async () => {
        setIsWon(true);
        // GameSessionTracker will handle saving the session
    };

    // --- Actions ---
    const handleClickSun = (e: React.MouseEvent) => {
        const clickVal = 1 + unlockedIds.length;
        setEnergy(prev => prev + clickVal);
        setTotalEnergy(prev => prev + clickVal);

        const id = Date.now();
        setClickEffects(prev => [...prev, { id, x: e.clientX, y: e.clientY, val: clickVal }]);
        setTimeout(() => setClickEffects(prev => prev.filter(p => p.id !== id)), 800);
    };

    const unlockElement = (el: typeof ELEMENTS[0]) => {
        if (energy >= el.cost && !unlockedIds.includes(el.id)) {
            setEnergy(prev => prev - el.cost);
            setUnlockedIds(prev => [...prev, el.id]);
            setPassiveRate(prev => prev + el.passive);
        }
    };

    // --- Real Life Task Logic ---

    const addTaskToBuffer = () => {
        if (taskInput.trim() && tasks.length < 5) {
            setTasks(prev => [...prev, { id: Date.now(), text: taskInput, completed: false }]);
            setTaskInput("");
        }
    };

    const removeTaskFromBuffer = (id: number) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const startQuest = () => {
        if (tasks.length > 0) {
            setIsQuestActive(true);
            setShowTaskModal(false);
        }
    };

    const handleCompleteTask = (taskId: number) => {
        setTasks(prev => prev.map(t => {
            if (t.id === taskId && !t.completed) {
                // REWARD!
                setEnergy(curr => curr + 100);
                setTotalEnergy(curr => curr + 100);
                triggerRewardEffect();
                return { ...t, completed: true };
            }
            return t;
        }));
    };

    const triggerRewardEffect = () => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const id = Date.now();
        setClickEffects(prev => [...prev, { id, x: centerX, y: centerY, val: 100 }]);
        setTimeout(() => setClickEffects(prev => prev.filter(p => p.id !== id)), 2000);
    };

    // --- Styles ---
    const getSkyGradient = () => {
        if (progress < 20) return "bg-gradient-to-b from-slate-900 via-purple-950 to-indigo-950"; // Midnight
        if (progress < 50) return "bg-gradient-to-b from-indigo-900 via-purple-800 to-rose-900";   // Dawn
        if (progress < 80) return "bg-gradient-to-b from-blue-600 via-cyan-500 to-orange-400";     // Sunrise
        return "bg-gradient-to-b from-sky-400 via-blue-300 to-emerald-200";                         // Day
    };

    return (
        <GameSessionTracker gameName="Light Builder">
            <div className={`min-h-screen relative overflow-hidden transition-colors duration-[3000ms] ${getSkyGradient()}`}>

                {/* --- UI LAYER (HUD) --- */}
                <div className="absolute top-0 w-full p-6 flex justify-between items-start z-50 pointer-events-none">
                    {/* Back Button */}
                    <button onClick={() => navigate("/dashboard")} className="pointer-events-auto p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition">
                        <X size={24} />
                    </button>

                    {/* Resources Panel */}
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-3 bg-black/30 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-xl">
                            <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
                            <span className="font-mono text-3xl font-bold text-white">{energy}</span>
                            <span className="text-xs text-yellow-200/60 uppercase tracking-widest ml-1">Lumens</span>
                        </div>

                        {/* Passive Rate Indicator */}
                        <div className={`flex items-center gap-1 font-mono text-sm bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm transition-all ${passiveRate > 0 ? "text-emerald-300 opacity-100" : "text-gray-400 opacity-50"}`}>
                            <Zap size={14} fill="currentColor" /> {passiveRate > 0 ? `+${passiveRate}/s` : "0/s"}
                        </div>
                    </div>
                </div>

                {/* --- REAL LIFE TASK WIDGET (Top Right) --- */}
                <div className="absolute top-24 right-6 z-50 w-72 pointer-events-auto">
                    {!isQuestActive ? (
                        <button
                            onClick={() => setShowTaskModal(true)}
                            className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-left p-4 rounded-2xl border border-white/10 text-white transition-all group shadow-lg"
                        >
                            <div className="flex items-center gap-2 mb-1 text-yellow-300">
                                <Target size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Real Life Quest</span>
                            </div>
                            <div className="text-sm text-gray-300 group-hover:text-white flex justify-between items-center">
                                Add your tasks list... <Plus size={16} />
                            </div>
                        </button>
                    ) : (
                        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
                            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                                <div className="flex items-center gap-2 text-yellow-300">
                                    <Target size={16} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Quest Log</span>
                                </div>
                                <span className="text-xs text-emerald-400 font-mono">+100 ⚡ / Task</span>
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                {tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className={`flex items-center gap-3 p-2 rounded-lg transition-all ${task.completed ? "bg-emerald-500/20 opacity-70" : "bg-white/5 hover:bg-white/10"}`}
                                    >
                                        <button
                                            onClick={() => handleCompleteTask(task.id)}
                                            disabled={task.completed}
                                            className={`
                                    flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                    ${task.completed ? "bg-emerald-500 border-emerald-500" : "border-gray-400 hover:border-emerald-400"}
                                `}
                                        >
                                            {task.completed && <CheckCircle size={14} className="text-white" />}
                                        </button>
                                        <span className={`text-sm ${task.completed ? "line-through text-emerald-100" : "text-white"}`}>
                                            {task.text}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-500"
                                    style={{ width: `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* --- TASK INPUT MODAL --- */}
                {showTaskModal && (
                    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-[#1a1a2e] p-6 rounded-3xl border border-white/10 w-full max-w-sm shadow-2xl animate-fade-in">
                            <h3 className="text-xl font-bold text-white mb-2">Create Your Quest</h3>
                            <p className="text-gray-400 text-sm mb-4">Break your work into small steps. <br />Max 5 tasks per session.</p>

                            {/* Task List (Draft) */}
                            <div className="space-y-2 mb-4">
                                {tasks.map((task) => (
                                    <div key={task.id} className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                                        <span className="text-sm text-white truncate px-2">{task.text}</span>
                                        <button onClick={() => removeTaskFromBuffer(task.id)} className="text-gray-500 hover:text-red-400 p-1">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Input */}
                            {tasks.length < 5 && (
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={taskInput}
                                        onChange={(e) => setTaskInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addTaskToBuffer()}
                                        placeholder="Add a task..."
                                        className="flex-1 bg-black/30 border border-white/20 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-400"
                                        autoFocus
                                    />
                                    <button
                                        onClick={addTaskToBuffer}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowTaskModal(false)}
                                    className="flex-1 py-3 text-gray-400 hover:text-white transition"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={startQuest}
                                    disabled={tasks.length === 0}
                                    className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-xl hover:opacity-90 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Start Quest
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- THE WORLD MAP --- */}
                <div className="absolute inset-0 z-0">

                    {/* 1. THE SUN (Clicker) */}
                    <div
                        className="absolute left-1/2 -translate-x-1/2 transition-all duration-[2000ms] ease-in-out cursor-pointer z-20 group"
                        style={{ top: `${70 - (progress * 0.6)}%` }}
                        onClick={handleClickSun}
                    >
                        <div className={`relative flex items-center justify-center transition-all duration-1000 ${isWon ? "scale-150" : "scale-100"}`}>
                            <div className="w-32 h-32 rounded-full bg-yellow-100 shadow-[0_0_100px_rgba(253,224,71,0.5)] group-active:scale-95 transition-transform" />
                            <Sun
                                size={isWon ? 160 : 80}
                                className={`absolute text-yellow-400 ${progress > 50 ? "animate-spin-slow" : "opacity-50"}`}
                            />
                            <span className="absolute mt-40 text-white/50 text-xs font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                CLICK TO SHINE
                            </span>
                        </div>
                    </div>

                    {/* 2. LANDSCAPE */}
                    <div className="absolute bottom-0 w-full h-1/3 bg-indigo-950 opacity-80" style={{ clipPath: "polygon(0% 100%, 0% 20%, 30% 0%, 60% 40%, 100% 10%, 100% 100%)" }} />
                    <div className="absolute bottom-0 w-full h-1/4 bg-purple-950 opacity-90" style={{ clipPath: "polygon(0% 100%, 20% 30%, 50% 10%, 80% 40%, 100% 20%, 100% 100%)" }} />
                    <div className={`absolute bottom-0 w-full h-[15%] transition-colors duration-[2000ms] ${progress > 50 ? "bg-emerald-900" : "bg-black"}`} />

                    {/* 3. INTERACTIVE BUILDINGS */}
                    {ELEMENTS.map((el) => {
                        const isUnlocked = unlockedIds.includes(el.id);
                        const canAfford = energy >= el.cost;
                        const Icon = el.icon;

                        return (
                            <button
                                key={el.id}
                                onClick={() => unlockElement(el)}
                                disabled={isUnlocked}
                                className={`
                        absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-700
                        ${isUnlocked ? "opacity-100 scale-100 z-30" : "opacity-40 scale-90 z-10 hover:scale-95 hover:opacity-70 grayscale"}
                        ${!isUnlocked && canAfford ? "cursor-pointer animate-pulse" : ""}
                    `}
                                style={{ left: `${el.left}%`, top: `${el.top}%` }}
                            >
                                <div className={`
                        relative p-4 rounded-2xl transition-all duration-700
                        ${isUnlocked ? `bg-white/10 backdrop-blur-md ${el.glow}` : "bg-black/50"}
                    `}>
                                    <Icon
                                        size={32 * el.scale}
                                        className={`transition-colors duration-700 ${isUnlocked ? el.color : "text-gray-600"}`}
                                        fill={isUnlocked ? "currentColor" : "none"}
                                    />
                                    {isUnlocked && (
                                        <div className="absolute inset-0 bg-yellow-400/10 rounded-2xl animate-pulse" />
                                    )}
                                </div>

                                <div className="mt-2 text-center">
                                    <span className={`text-xs font-bold block ${isUnlocked ? "text-white" : "text-gray-500"}`}>
                                        {el.name}
                                    </span>
                                    {!isUnlocked && (
                                        <span className={`text-xs font-mono bg-black/60 px-2 py-0.5 rounded ${canAfford ? "text-yellow-400" : "text-gray-600"}`}>
                                            {el.cost} ⚡
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* --- WEATHER OVERLAY --- */}
                <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-[3000ms] z-40 flex items-center justify-center"
                    style={{ opacity: Math.max(0, 1 - (progress / 40)) }}
                >
                    <div className="absolute inset-0 bg-black/40" />
                    <CloudRain size={120} className="text-slate-700 opacity-20 animate-bounce" />
                </div>

                {/* --- WIN OVERLAY --- */}
                {isWon && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/20 backdrop-blur-md animate-fade-in text-center p-8">
                        <Smile size={100} className="text-yellow-500 animate-bounce mb-6 drop-shadow-xl" />
                        <h1 className="text-6xl font-bold text-white drop-shadow-lg mb-4">Town Restored</h1>
                        <p className="text-2xl text-white/90 font-medium max-w-lg mb-8 drop-shadow-md">
                            You brought the light back.
                        </p>
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="px-10 py-4 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 rounded-full font-bold text-xl transition shadow-2xl hover:scale-105"
                        >
                            Continue Journey
                        </button>
                    </div>
                )}

                {/* --- CLICK PARTICLES --- */}
                {clickEffects.map(eff => (
                    <div
                        key={eff.id}
                        className={`fixed pointer-events-none font-bold text-2xl animate-float-up z-50 ${eff.val >= 100 ? "text-emerald-400 text-4xl" : "text-yellow-300"}`}
                        style={{ left: eff.x, top: eff.y }}
                    >
                        +{eff.val}
                    </div>
                ))}

                {/* CSS */}
                <style>{`
        @keyframes float-up {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            100% { transform: translateY(-80px) scale(1.5); opacity: 0; }
        }
        .animate-float-up { animation: float-up 0.6s ease-out forwards; }
        .animate-spin-slow { animation: spin 12s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
      `}</style>
            </div>
        </GameSessionTracker>
    );
}