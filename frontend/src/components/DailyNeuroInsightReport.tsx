import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
import { Sun, TrendingUp, Target, Calendar, BarChart3, Heart, Zap } from "lucide-react";
import DailyQuestionnaire from "./DailyQuestionnaire";

interface DailySynthesis {
    daily_observation: string;
    key_moment: string;
    focus_area: string;
}

interface DailyReportData {
    report: DailySynthesis;
    raw_data: {
        objective_data: any;
        subjective_data: any;
        emotional_context: any;
        baseline_profile: any;
        insights: any;
    };
    report_date: string;
    created_at: string;
}

interface DailyNeuroInsightReportProps {
    onGenerateNew?: () => void;
}

export default function DailyNeuroInsightReport({ onGenerateNew }: DailyNeuroInsightReportProps) {
    const [reportData, setReportData] = useState<DailyReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showQuestionnaire, setShowQuestionnaire] = useState(false);
    const [hasTodayData, setHasTodayData] = useState(true);

    useEffect(() => {
        loadLatestReport();
    }, []);

    const loadLatestReport = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Please log in to view daily reports.');
                return;
            }

            console.log('Loading daily report for user:', user.id);

            // Check if user has game data from today
            let hasTodayData = false;
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const { data: gameSessions } = await supabase
                    .from('game_sessions')
                    .select('id')
                    .eq('user_id', user.id)
                    .gte('created_at', today.toISOString())
                    .limit(1);

                hasTodayData = gameSessions && gameSessions.length > 0;
                console.log('Has today data:', hasTodayData);
            } catch (gameError) {
                console.warn('Error checking today\'s game data:', gameError);
                hasTodayData = false;
            }

            setHasTodayData(hasTodayData);

            // Try to call the backend API for daily report
            const response = await fetch(`${API_BASE}/api/reports/get-latest-daily-report`, {
                headers: {
                    'Authorization': `Bearer ${user.id}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('API response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('API response data:', data);
                if (data.status === 'success') {
                    setReportData(data);
                    return;
                } else if (data.status === 'no_report') {
                    // No report exists yet - this is normal, show generate option
                    setReportData(null);
                    return;
                }
            }

            // If API call fails, show appropriate message
            if (response.status === 404) {
                // No report exists yet - this is normal
                setReportData(null);
            } else if (response.status === 401) {
                setError('Authentication failed. Please try logging in again.');
            } else {
                // Get the error details from the response
                try {
                    const errorData = await response.json();
                    console.error('API error details:', errorData);
                    setError(`Backend error: ${errorData.detail || response.status}`);
                } catch {
                    setError(`Backend API error: ${response.status}`);
                }
            }
        } catch (err) {
            console.error('Error loading daily report:', err);
            // Check if it's a network error (backend not running)
            if (err instanceof TypeError && err.message.includes('fetch')) {
                setError('Backend server is not running. Please start the backend to generate reports.');
            } else {
                setError('Failed to load daily report. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    const generateNewReport = async (questionnaireAnswers?: Record<string, string>) => {
        try {
            setGenerating(true);
            setError(null);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Use questionnaire answers if provided, otherwise use default check-in data
            const checkinData = questionnaireAnswers || {
                mood: "Good",
                energy: "Moderate",
                stress: "Low",
                focus: "Good",
                motivation: "Quite"
            };

            const response = await fetch(`${API_BASE}/api/reports/generate-daily-report`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.id}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user.id,
                    checkinData: checkinData
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success') {
                    setReportData({
                        report: data.report,
                        raw_data: data.raw_data,
                        report_date: new Date().toISOString().split('T')[0],
                        created_at: new Date().toISOString()
                    });
                    setShowQuestionnaire(false);
                    onGenerateNew?.();
                    return;
                }
            }

            // Get the error details from the response
            try {
                const errorData = await response.json();
                throw new Error(`Backend error: ${errorData.detail || 'Unknown error'}`);
            } catch (parseError) {
                throw new Error(`Backend API error: ${response.status}`);
            }
        } catch (err) {
            console.error('Error generating daily report:', err);
            // Check if it's a network error (backend not running)
            if (err instanceof TypeError && err.message.includes('fetch')) {
                setError('Backend server is not running. Please start the backend to generate reports.');
            } else {
                setError('Failed to generate daily report. Please ensure the backend server is running.');
            }
        } finally {
            setGenerating(false);
        }
    };

    const handleQuestionnaireComplete = (answers: Record<string, string>) => {
        generateNewReport(answers);
    };

    const handleStartQuestionnaire = () => {
        setShowQuestionnaire(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getTodayMetrics = () => {
        if (!reportData?.raw_data?.insights) return null;

        const insights = reportData.raw_data.insights;
        return {
            todaySessions: insights.engagement_metrics?.today_sessions || 0,
            todayPlaytime: Math.round((insights.engagement_metrics?.today_playtime || 0) / 60),
            questionnaires: insights.engagement_metrics?.today_questionnaires || 0,
            currentMood: insights.emotional_patterns?.current_mood || 0
        };
    };

    if (loading) {
        return (
            <div className="card-calm">
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4">
                        <div className="w-full h-full border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-gray-300">Loading your daily insights...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card-calm">
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 glass rounded-2xl flex items-center justify-center">
                        <Sun className="text-red-400" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-red-300 mb-2">Daily Report Unavailable</h3>
                    <p className="text-gray-300 mb-4 max-w-md mx-auto leading-relaxed">
                        {error}
                    </p>
                    {error.includes('Backend server') && (
                        <div className="glass rounded-xl p-4 mb-4 border border-yellow-400/20 bg-yellow-500/5">
                            <p className="text-yellow-300 text-sm">
                                💡 To enable daily reports, start the backend server by running:
                                <br />
                                <code className="bg-black/30 px-2 py-1 rounded mt-2 inline-block">
                                    cd backend && python main.py
                                </code>
                            </p>
                        </div>
                    )}
                    <button
                        onClick={loadLatestReport}
                        className="btn-calm px-6 py-2"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (showQuestionnaire) {
        return (
            <DailyQuestionnaire
                onComplete={handleQuestionnaireComplete}
                onCancel={() => setShowQuestionnaire(false)}
            />
        );
    }

    if (!reportData) {
        return (
            <div className="card-calm">
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 glass rounded-2xl flex items-center justify-center">
                        <Sun className="text-yellow-400" size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Daily Report Yet</h3>
                    <p className="text-gray-300 mb-6">
                        Generate your Daily Neuro-Insight Report to see how you're doing today.
                    </p>

                    {!hasTodayData ? (
                        <div className="mb-6">
                            <div className="glass rounded-xl p-4 mb-4 border border-yellow-400/20 bg-yellow-500/5">
                                <p className="text-yellow-300 text-sm mb-2">
                                    💡 No activity detected today
                                </p>
                                <p className="text-gray-300 text-sm">
                                    Complete a quick 5-question check-in to generate your daily insights
                                </p>
                            </div>
                            <button
                                onClick={handleStartQuestionnaire}
                                disabled={generating}
                                className="btn-warm px-6 py-3 mr-3"
                            >
                                Start Daily Check-In
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => generateNewReport()}
                            disabled={generating}
                            className="btn-warm px-6 py-3"
                        >
                            {generating ? "Generating..." : "Generate Daily Report"}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const metrics = getTodayMetrics();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="card-calm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center">
                            <Sun className="text-yellow-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Daily Neuro-Insight Report</h2>
                            <p className="text-gray-300 text-sm">
                                Today's Snapshot • {formatDate(reportData.report_date)}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {!hasTodayData && (
                            <button
                                onClick={handleStartQuestionnaire}
                                disabled={generating}
                                className="btn-calm px-4 py-2 text-sm"
                            >
                                Daily Check-In
                            </button>
                        )}
                        <button
                            onClick={() => generateNewReport()}
                            disabled={generating}
                            className="btn-warm px-4 py-2 text-sm"
                        >
                            {generating ? "Generating..." : "Generate New"}
                        </button>
                    </div>
                </div>

                {/* Quick Metrics */}
                {metrics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center mb-2">
                                <BarChart3 className="text-blue-400" size={16} />
                            </div>
                            <div className="text-2xl font-bold text-white">{metrics.todaySessions}</div>
                            <div className="text-xs text-gray-400">Sessions Today</div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center mb-2">
                                <Calendar className="text-green-400" size={16} />
                            </div>
                            <div className="text-2xl font-bold text-white">{metrics.todayPlaytime}m</div>
                            <div className="text-xs text-gray-400">Playtime</div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center mb-2">
                                <Target className="text-purple-400" size={16} />
                            </div>
                            <div className="text-2xl font-bold text-white">{metrics.questionnaires}</div>
                            <div className="text-xs text-gray-400">Check-ins</div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center mb-2">
                                <Heart className="text-pink-400" size={16} />
                            </div>
                            <div className="text-2xl font-bold text-white">{metrics.currentMood.toFixed(1)}</div>
                            <div className="text-xs text-gray-400">Current Mood</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Daily Observation */}
            <div className="card-calm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
                        <TrendingUp className="text-blue-400" size={18} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Today's Observation</h3>
                </div>
                <div className="glass rounded-xl p-6 border border-white/10">
                    <p className="text-gray-200 leading-relaxed">
                        {reportData.report.daily_observation}
                    </p>
                </div>
            </div>

            {/* Key Moment */}
            <div className="card-calm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
                        <Zap className="text-emerald-400" size={18} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Key Moment</h3>
                </div>
                <div className="glass rounded-xl p-6 border border-emerald-400/20 bg-emerald-500/5">
                    <p className="text-gray-200 leading-relaxed">
                        {reportData.report.key_moment}
                    </p>
                </div>
            </div>

            {/* Focus Area for Tomorrow */}
            <div className="card-calm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
                        <Target className="text-yellow-400" size={18} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Focus for Tomorrow</h3>
                </div>
                <div className="glass rounded-xl p-6 border border-yellow-400/20 bg-yellow-500/5">
                    <p className="text-gray-200 leading-relaxed">
                        {reportData.report.focus_area}
                    </p>
                </div>
            </div>

            {/* Data Sources Footer */}
            <div className="card-calm">
                <div className="text-center">
                    <p className="text-sm text-gray-400 mb-2">
                        This daily report analyzes your today's activities, mood check-ins,
                        and interactions to provide personalized insights.
                    </p>
                    <p className="text-xs text-gray-500">
                        Generated by Dr. Nexus AI • {new Date(reportData.created_at).toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
}