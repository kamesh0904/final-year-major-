import { useState, useEffect } from "react";
import { getUnusedQuestions, submitPostGameQuestionnaire } from "../api/neuroNestApi";
import { getCategoryDisplayName } from "../data/postGameQuestions";
import { CheckCircle, XCircle, Brain, Clock, Target } from "lucide-react";

interface PostGameQuestionnaireProps {
    gameName: string;
    sessionDuration: number; // in seconds
    category: string;
    totalDuration: number;
    availableQuestionsCount: number;
    onComplete: () => void;
    onSkip: () => void;
}

export default function PostGameQuestionnaire({
    gameName,
    sessionDuration,
    category,
    totalDuration,
    availableQuestionsCount,
    onComplete,
    onSkip
}: PostGameQuestionnaireProps) {
    const [questions, setQuestions] = useState<string[]>([]);
    const [responses, setResponses] = useState<boolean[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        initializeQuestionnaire();
    }, [category]);

    const initializeQuestionnaire = async () => {
        try {
            // Get unused questions for this category
            const response = await getUnusedQuestions(category);

            if (!response.eligible || response.unused_questions.length === 0) {
                // No questions available, skip questionnaire
                onSkip();
                return;
            }

            setQuestions(response.unused_questions);
            setResponses(new Array(response.unused_questions.length).fill(null));

        } catch (error) {
            console.error("Error initializing questionnaire:", error);
            onSkip();
        } finally {
            setLoading(false);
        }
    };

    const handleResponse = (response: boolean) => {
        const newResponses = [...responses];
        newResponses[currentQuestion] = response;
        setResponses(newResponses);

        // Auto-advance to next question
        if (currentQuestion < questions.length - 1) {
            setTimeout(() => {
                setCurrentQuestion(currentQuestion + 1);
            }, 300);
        }
    };

    const handleSubmit = async () => {
        if (responses.some(r => r === null)) return;

        setSubmitting(true);
        try {
            // Submit using API
            await submitPostGameQuestionnaire({
                game_name: gameName,
                session_duration: totalDuration, // Use total cumulative duration
                profile_category: category,
                questions: questions,
                responses: responses
            });

            onComplete();
        } catch (error) {
            console.error("Error submitting questionnaire:", error);
            alert("Failed to save your responses. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const progress = ((currentQuestion + 1) / questions.length) * 100;
    const allAnswered = responses.every(r => r !== null);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center" style={{ zIndex: 99999 }}>
                <div className="card-calm max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-4">
                            <div className="w-full h-full border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-gray-300">Preparing your reflection questions...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
            <div className="card-calm max-w-2xl w-full animate-fade-in relative overflow-hidden">
                {/* Subtle animated background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl"></div>

                <div className="relative z-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center">
                                <Brain className="text-purple-400" size={20} />
                            </div>
                            <div className="text-left">
                                <h2 className="text-2xl font-bold text-white">Quick Reflection</h2>
                                <p className="text-gray-300 text-sm">
                                    {getCategoryDisplayName(category)} • {formatDuration(totalDuration)} total
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <Target size={14} />
                                <span>{gameName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={14} />
                                <span>{questions.length} questions</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Brain size={14} />
                                <span>{availableQuestionsCount} remaining</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between text-xs text-gray-300 mb-2">
                            <span>Question {currentQuestion + 1} of {questions.length}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 glass rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-500 ease-out rounded-full"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Question */}
                    <div className="mb-8">
                        <div className="glass rounded-2xl p-6 border border-white/10">
                            <p className="text-lg text-white leading-relaxed text-center">
                                {questions[currentQuestion]}
                            </p>
                        </div>
                    </div>

                    {/* Response Buttons */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button
                            onClick={() => handleResponse(true)}
                            disabled={submitting}
                            className={`flex items-center justify-center gap-3 py-4 px-6 rounded-2xl border transition-all duration-300 hover-lift ${responses[currentQuestion] === true
                                ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-300"
                                : "border-white/10 glass text-gray-300 hover:border-emerald-400/30 hover:bg-emerald-500/10"
                                }`}
                        >
                            <CheckCircle size={20} />
                            <span className="font-medium">Yes</span>
                        </button>

                        <button
                            onClick={() => handleResponse(false)}
                            disabled={submitting}
                            className={`flex items-center justify-center gap-3 py-4 px-6 rounded-2xl border transition-all duration-300 hover-lift ${responses[currentQuestion] === false
                                ? "border-red-400/50 bg-red-500/20 text-red-300"
                                : "border-white/10 glass text-gray-300 hover:border-red-400/30 hover:bg-red-500/10"
                                }`}
                        >
                            <XCircle size={20} />
                            <span className="font-medium">No</span>
                        </button>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={onSkip}
                            disabled={submitting}
                            className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors duration-300"
                        >
                            Skip for now
                        </button>

                        <div className="flex gap-3">
                            {currentQuestion > 0 && (
                                <button
                                    onClick={() => setCurrentQuestion(currentQuestion - 1)}
                                    disabled={submitting}
                                    className="px-6 py-2 glass rounded-xl text-gray-300 hover:text-white transition-all duration-300 hover:bg-white/10"
                                >
                                    Back
                                </button>
                            )}

                            {allAnswered && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="btn-nature px-6 py-2 disabled:opacity-50"
                                >
                                    {submitting ? "Saving..." : "Complete"}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Question Indicators */}
                    <div className="flex justify-center gap-2 mt-6">
                        {questions.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentQuestion
                                    ? "bg-purple-400 scale-125"
                                    : responses[index] !== null
                                        ? "bg-emerald-400"
                                        : "bg-white/20"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}