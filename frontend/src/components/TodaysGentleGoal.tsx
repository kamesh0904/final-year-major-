import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wind, Flame, CheckCircle, Play, Clock, Star } from "lucide-react";
import { supabase } from "../lib/supabase";

interface GentleGoalProps {
    userId: string;
}

export default function TodaysGentleGoal({ userId }: GentleGoalProps) {
    const navigate = useNavigate();
    const [streak, setStreak] = useState(0);
    const [completedToday, setCompletedToday] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            loadGoalData();
        }
    }, [userId]);

    const loadGoalData = async () => {
        try {
            // Get user's streak and check if they completed today's goal
            const { data: profile } = await supabase
                .from('profiles')
                .select('gentle_goal_streak, last_gentle_goal_date')
                .eq('id', userId)
                .single();

            if (profile) {
                setStreak(profile.gentle_goal_streak || 0);

                // Check if completed today
                const today = new Date().toISOString().split('T')[0];
                const lastCompleted = profile.last_gentle_goal_date;
                setCompletedToday(lastCompleted === today);
            }
        } catch (error) {
            console.error("Error loading gentle goal data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteGoal = async () => {
        try {
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
                    // Already completed today
                    return;
                }
                // If gap > 1 day, streak resets to 1
            }

            // Update profile with new streak and completion date
            const { error } = await supabase
                .from('profiles')
                .update({
                    gentle_goal_streak: newStreak,
                    last_gentle_goal_date: today
                })
                .eq('id', userId);

            if (error) throw error;

            setStreak(newStreak);
            setCompletedToday(true);

            // Show celebration message
            alert(`🎉 Gentle goal completed! Your streak is now ${newStreak} days!`);

        } catch (error) {
            console.error("Error completing gentle goal:", error);
        }
    };

    const handleStartBreathing = () => {
        navigate("/breath-sync");
    };

    if (loading) {
        return (
            <div className="card-calm animate-pulse">
                <div className="h-32 bg-white/5 rounded-2xl"></div>
            </div>
        );
    }

    return (
        <div className="card-calm animate-fade-in relative overflow-hidden">
            {/* Subtle animated background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-2xl"></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 glass rounded-2xl flex items-center justify-center">
                            <Wind className="text-cyan-400" size={20} />
                        </div>
                        Today's Gentle Goal
                    </h3>

                    {/* Streak Display */}
                    <div className="flex items-center gap-2 glass px-4 py-2 rounded-full">
                        <Flame className="text-orange-400" size={16} />
                        <span className="font-bold text-white">{streak}</span>
                        <span className="text-sm text-gray-400">day streak</span>
                    </div>
                </div>

                {completedToday ? (
                    // Completed State
                    <div className="text-center py-8">
                        <div className="w-16 h-16 glass rounded-full flex items-center justify-center mx-auto mb-4 bg-emerald-500/20 border border-emerald-500/30">
                            <CheckCircle className="text-emerald-400" size={24} />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">Goal Completed! 🎉</h4>
                        <p className="text-gray-300 mb-4">
                            You've completed your gentle breathing session today.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-emerald-400">
                            <Star size={16} fill="currentColor" />
                            <span className="font-medium">Streak: {streak} days</span>
                            <Star size={16} fill="currentColor" />
                        </div>
                    </div>
                ) : (
                    // Active State
                    <div>
                        <div className="glass rounded-2xl p-6 mb-4 border border-cyan-500/20">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center bg-cyan-500/10">
                                    <Wind className="text-cyan-400" size={20} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-white mb-2">Nebula Breath Session</h4>
                                    <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                                        Take at least 3 minutes for mindful breathing with beautiful visual guidance.
                                        Complete this to maintain your daily wellness streak.
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} />
                                            <span>3+ minutes</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Star size={14} />
                                            <span>+1 streak day</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleStartBreathing}
                            className="btn-calm w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 hover:border-cyan-400/50"
                        >
                            <Play size={18} fill="currentColor" />
                            Begin Gentle Session
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}