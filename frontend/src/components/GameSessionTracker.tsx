import { useState, useEffect, useRef } from "react";
import { usePostGameQuestionnaire } from "../hooks/usePostGameQuestionnaire";
import PostGameQuestionnaire from "./PostGameQuestionnaire";
import { submitGameSession } from "../api/neuroNestApi";
import { supabase } from "../lib/supabase";

interface GameSessionTrackerProps {
    gameName: string;
    children: React.ReactNode;
    onGameStart?: () => void;
    onGameEnd?: () => void;
    gameScore?: number; // Optional score from the game
}

// Global state for cumulative time tracking
let globalCumulativeTime = 0;
let globalLastQuestionnaireDate = '';
let globalQuestionnaireShown = false;

export default function GameSessionTracker({
    gameName,
    children,
    onGameStart,
    onGameEnd,
    gameScore
}: GameSessionTrackerProps) {
    const [isGameActive, setIsGameActive] = useState(false);
    const [sessionDuration, setSessionDuration] = useState(0);
    const [showQuestionnaire, setShowQuestionnaire] = useState(false);
    const [cumulativeTime, setCumulativeTime] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const intervalRef = useRef<number | null>(null);

    const questionnaire = usePostGameQuestionnaire({
        gameName,
        sessionDuration,
        isGameActive
    });

    // Load cumulative time on mount
    useEffect(() => {
        loadTodaysCumulativeTime();
        startSession();
        return () => {
            endSession();
        };
    }, []);

    // Check questionnaire eligibility when game ends
    useEffect(() => {
        if (!isGameActive && sessionDuration > 0) {
            // Update cumulative time
            updateCumulativeTime(sessionDuration);

            // Small delay to ensure state is updated
            setTimeout(() => {
                checkQuestionnaireEligibility();
            }, 1000);
        }
    }, [isGameActive, sessionDuration]);

    const loadTodaysCumulativeTime = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const today = new Date().toISOString().split('T')[0];

            // Check if we already showed questionnaire today
            if (globalLastQuestionnaireDate === today && globalQuestionnaireShown) {
                return;
            }

            // Get today's total game time from all sessions
            const { data: sessions } = await supabase
                .from('game_sessions')
                .select('duration_seconds')
                .eq('user_id', user.id)
                .gte('created_at', `${today}T00:00:00`)
                .lt('created_at', `${today}T23:59:59`);

            if (sessions) {
                const totalTime = sessions.reduce((sum, session) => sum + (session.duration_seconds || 0), 0);
                globalCumulativeTime = totalTime;
                setCumulativeTime(totalTime);
            }
        } catch (error) {
            console.error("Error loading cumulative time:", error);
        }
    };

    const updateCumulativeTime = (newSessionTime: number) => {
        globalCumulativeTime += newSessionTime;
        setCumulativeTime(globalCumulativeTime);
    };

    const checkQuestionnaireEligibility = () => {
        const today = new Date().toISOString().split('T')[0];

        // Only show questionnaire once per day and if cumulative time >= 5 minutes (300 seconds)
        if (globalCumulativeTime >= 300 &&
            globalLastQuestionnaireDate !== today &&
            !globalQuestionnaireShown) {

            globalLastQuestionnaireDate = today;
            globalQuestionnaireShown = true;
            setShowQuestionnaire(true);
        }
    };

    const startSession = () => {
        if (isGameActive) return;

        startTimeRef.current = Date.now();
        setIsGameActive(true);
        setSessionDuration(0);

        // Update duration every second
        intervalRef.current = window.setInterval(() => {
            if (startTimeRef.current) {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                setSessionDuration(elapsed);
            }
        }, 1000);

        onGameStart?.();
    };

    const endSession = async () => {
        if (!isGameActive) return;

        setIsGameActive(false);

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Calculate final duration
        let finalDuration = 0;
        if (startTimeRef.current) {
            finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setSessionDuration(finalDuration);
        }

        // Save game session to database
        await saveGameSession(finalDuration);

        onGameEnd?.();
    };

    const saveGameSession = async (duration: number) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || duration < 10) return; // Only save sessions longer than 10 seconds

            await submitGameSession({
                user_id: user.id,
                game_name: gameName,
                duration_seconds: duration,
                score: gameScore || Math.floor(duration * 10), // Use provided score or time-based score
                difficulty_level: 1
            });
        } catch (error) {
            console.error("Error saving game session:", error);
        }
    };

    const handleQuestionnaireComplete = () => {
        setShowQuestionnaire(false);
        questionnaire.markCompleted();
    };

    const handleQuestionnaireSkip = () => {
        setShowQuestionnaire(false);
        questionnaire.skip();
    };

    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const formatCumulativeTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m total today`;
    };

    return (
        <>
            {/* Game Session Info Overlay */}
            {isGameActive && (
                <div className="fixed top-4 right-4" style={{ zIndex: 45 }}>
                    <div className="glass rounded-2xl px-4 py-2 border border-white/10">
                        <div className="flex flex-col gap-1 text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-slow"></div>
                                <span className="text-gray-300">Session: {formatDuration(sessionDuration)}</span>
                            </div>
                            <div className="text-xs text-gray-400 text-center">
                                {formatCumulativeTime(cumulativeTime + sessionDuration)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Game Controls */}
            <div className="fixed top-4 left-4" style={{ zIndex: 45 }}>
                <div className="flex gap-2">
                    {!isGameActive ? (
                        <button
                            onClick={startSession}
                            className="btn-nature px-4 py-2 text-sm"
                        >
                            Start Session
                        </button>
                    ) : (
                        <button
                            onClick={endSession}
                            className="btn-warm px-4 py-2 text-sm"
                        >
                            End Session
                        </button>
                    )}
                </div>
            </div>

            {/* Game Content */}
            {children}

            {/* Post-Game Questionnaire */}
            {showQuestionnaire && (
                <PostGameQuestionnaire
                    gameName="Daily Check-in"
                    sessionDuration={cumulativeTime}
                    category="Mixed"
                    totalDuration={cumulativeTime}
                    availableQuestionsCount={5}
                    onComplete={handleQuestionnaireComplete}
                    onSkip={handleQuestionnaireSkip}
                />
            )}
        </>
    );
}