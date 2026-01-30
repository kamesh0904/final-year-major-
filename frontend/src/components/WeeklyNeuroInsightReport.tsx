import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
import { Brain, TrendingUp, Target, Calendar, BarChart3, Heart, Zap } from "lucide-react";
import WeeklyQuestionnaire from "./WeeklyQuestionnaire";

interface ClinicalSynthesis {
    clinical_observation: string;
    key_achievement: string;
    focus_area: string;
}

interface WeeklyReportData {
    report: ClinicalSynthesis;
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

interface WeeklyNeuroInsightReportProps {
    onGenerateNew?: () => void;
}

export default function WeeklyNeuroInsightReport({ onGenerateNew }: WeeklyNeuroInsightReportProps) {
    const [reportData, setReportData] = useState<WeeklyReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showQuestionnaire, setShowQuestionnaire] = useState(false);
    const [hasGameData, setHasGameData] = useState(true);

    useEffect(() => {
        loadLatestReport();
    }, []);

    const loadLatestReport = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check if user has game data from the last week
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const { data: gameSessions } = await supabase
                .from('game_sessions')
                .select('id')
                .eq('user_id', user.id)
                .gte('created_at', oneWeekAgo.toISOString())
                .limit(1);

            setHasGameData(gameSessions && gameSessions.length > 0);

            // Try to call the backend API
            const response = await fetch(`${API_BASE}/api/reports/get-latest-weekly-report`, {
                headers: {
                    'Authorization': `Bearer ${user.id}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success') {
                    setReportData(data);
                    return;
                }
            }

            // If API call fails, show appropriate message
            if (response.status === 404) {
                // No report exists yet - this is normal
                setReportData(null);
            } else {
                throw new Error(`Backend API error: ${response.status}`);
            }
        } catch (err) {
            console.error('Error loading report:', err);
            // Check if it's a network error (backend not running)
            if (err instanceof TypeError && err.message.includes('fetch')) {
                setError('Backend server is not running. Please start the backend to generate reports.');
            } else {
                setError('Failed to load weekly report. Please try again later.');
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
                overall_mood: "Good",
                energy_level: "Moderate",
                stress_level: "Low",
                sleep_quality: "Good",
                social_interactions: "Positive"
            };

            const response = await fetch(`${API_BASE}/api/reports/generate-enhanced-weekly-report`, {
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

            throw new Error(`Backend API error: ${response.status}`);
        } catch (err) {
            console.error('Error generating report:', err);
            // Check if it's a network error (backend not running)
            if (err instanceof TypeError && err.message.includes('fetch')) {
                setError('Backend server is not running. Please start the backend to generate reports.');
            } else {
                setError('Failed to generate weekly report. Please ensure the backend server is running.');
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

    const getInsightMetrics = () => {
        if (!reportData?.raw_data?.insights) return null;

        const insights = reportData.raw_data.insights;
        return {
            totalSessions: insights.engagement_metrics?.total_game_sessions || 0,
            totalPlaytime: Math.round((insights.engagement_metrics?.total_game_sessions || 0) / 60),
            questionnaires: insights.engagement_metrics?.total_questionnaires || 0,
            averageMood: insights.emotional_patterns?.average_mood || 0
        };
    };

    if (loading) {
        return (
            <div className="card-calm">
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4">
                        <div className="w-full h-full border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-gray-300">Loading your weekly insights...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card-calm">
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 glass rounded-2xl flex items-center justify-center">
                        <Brain className="text-red-400" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-red-300 mb-2">Report Generation Unavailable</h3>
                    <p className="text-gray-300 mb-4 max-w-md mx-auto leading-relaxed">
                        {error}
                    </p>
                    {error.includes('Backend server') && (
                        <div className="glass rounded-xl p-4 mb-4 border border-yellow-400/20 bg-yellow-500/5">
                            <p className="text-yellow-300 text-sm">
                                💡 To enable weekly reports, start the backend server by running:
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
            <WeeklyQuestionnaire
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
                        <Brain className="text-purple-400" size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Weekly Report Yet</h3>
                    <p className="text-gray-300 mb-6">
                        Generate your first Weekly Neuro-Insight Report to see your therapeutic progress.
                    </p>

                    {!hasGameData ? (
                        <div className="mb-6">
                            <div className="glass rounded-xl p-4 mb-4 border border-blue-400/20 bg-blue-500/5">
                                <p className="text-blue-300 text-sm mb-2">
                                    💡 No recent game activity detected
                                </p>
                                <p className="text-gray-300 text-sm">
                                    Complete a quick 10-question check-in to generate your personalized report
                                </p>
                            </div>
                            <button
                                onClick={handleStartQuestionnaire}
                                disabled={generating}
                                className="btn-nature px-6 py-3 mr-3"
                            >
                                Start Weekly Check-In
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => generateNewReport()}
                            disabled={generating}
                            className="btn-nature px-6 py-3"
                        >
                            {generating ? "Generating..." : "Generate Weekly Report"}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const metrics = getInsightMetrics();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="card-calm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center">
                            <Brain className="text-purple-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Weekly Neuro-Insight Report</h2>
                            <p className="text-gray-300 text-sm">
                                Clinical Synthesis • {formatDate(reportData.report_date)}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {!hasGameData && (
                            <button
                                onClick={handleStartQuestionnaire}
                                disabled={generating}
                                className="btn-calm px-4 py-2 text-sm"
                            >
                                Weekly Check-In
                            </button>
                        )}
                        <button
                            onClick={() => generateNewReport()}
                            disabled={generating}
                            className="btn-nature px-4 py-2 text-sm"
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
                            <div className="text-2xl font-bold text-white">{metrics.totalSessions}</div>
                            <div className="text-xs text-gray-400">Game Sessions</div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center mb-2">
                                <Calendar className="text-green-400" size={16} />
                            </div>
                            <div className="text-2xl font-bold text-white">{metrics.totalPlaytime}m</div>
                            <div className="text-xs text-gray-400">Total Playtime</div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center mb-2">
                                <Target className="text-purple-400" size={16} />
                            </div>
                            <div className="text-2xl font-bold text-white">{metrics.questionnaires}</div>
                            <div className="text-xs text-gray-400">Reflections</div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center mb-2">
                                <Heart className="text-pink-400" size={16} />
                            </div>
                            <div className="text-2xl font-bold text-white">{metrics.averageMood.toFixed(1)}</div>
                            <div className="text-xs text-gray-400">Avg Mood</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Clinical Observation & Insight */}
            <div className="card-calm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
                        <TrendingUp className="text-blue-400" size={18} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Clinical Observation & Insight</h3>
                </div>
                <div className="glass rounded-xl p-6 border border-white/10">
                    <p className="text-gray-200 leading-relaxed">
                        {reportData.report.clinical_observation}
                    </p>
                </div>
            </div>

            {/* Key Achievement */}
            <div className="card-calm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
                        <Zap className="text-emerald-400" size={18} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Key Achievement</h3>
                </div>
                <div className="glass rounded-xl p-6 border border-emerald-400/20 bg-emerald-500/5">
                    <p className="text-gray-200 leading-relaxed">
                        {reportData.report.key_achievement}
                    </p>
                </div>
            </div>

            {/* Focus Area for Next Week */}
            <div className="card-calm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
                        <Target className="text-purple-400" size={18} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Focus Area for Next Week</h3>
                </div>
                <div className="glass rounded-xl p-6 border border-purple-400/20 bg-purple-500/5">
                    <p className="text-gray-200 leading-relaxed">
                        {reportData.report.focus_area}
                    </p>
                </div>
            </div>

            {/* Data Sources Footer */}
            <div className="card-calm">
                <div className="text-center">
                    <p className="text-sm text-gray-400 mb-2">
                        This report triangulates data from your game performance, questionnaire responses,
                        chat interactions, and diary entries to provide comprehensive insights.
                    </p>
                    <p className="text-xs text-gray-500">
                        Generated by Dr. Nexus AI • {new Date(reportData.created_at).toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
}