import { useState } from "react";
import { CheckCircle, ArrowRight, Sun } from "lucide-react";

interface DailyQuestionnaireProps {
    onComplete: (answers: Record<string, string>) => void;
    onCancel: () => void;
}

const DAILY_QUESTIONS = [
    {
        id: "mood",
        question: "How are you feeling right now?",
        options: ["Very Low", "Low", "Neutral", "Good", "Very Good"]
    },
    {
        id: "energy",
        question: "What's your energy level today?",
        options: ["Exhausted", "Low", "Moderate", "High", "Energized"]
    },
    {
        id: "stress",
        question: "How stressed do you feel today?",
        options: ["Very High", "High", "Moderate", "Low", "Very Low"]
    },
    {
        id: "focus",
        question: "How well can you concentrate today?",
        options: ["Can't Focus", "Struggling", "Okay", "Good", "Very Sharp"]
    },
    {
        id: "motivation",
        question: "How motivated do you feel for today's activities?",
        options: ["Not at all", "Slightly", "Moderately", "Quite", "Very Motivated"]
    }
];

export default function DailyQuestionnaire({ onComplete, onCancel }: DailyQuestionnaireProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const handleAnswer = (answer: string) => {
        const questionId = DAILY_QUESTIONS[currentQuestion].id;
        const newAnswers = { ...answers, [questionId]: answer };
        setAnswers(newAnswers);

        if (currentQuestion < DAILY_QUESTIONS.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            // All questions answered
            onComplete(newAnswers);
        }
    };

    const progress = ((currentQuestion + 1) / DAILY_QUESTIONS.length) * 100;
    const question = DAILY_QUESTIONS[currentQuestion];

    return (
        <div className="card-calm max-w-2xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
                            <Sun className="text-yellow-400" size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Daily Check-In</h3>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        ×
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full glass rounded-full h-2 mb-6">
                    <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="text-center mb-2">
                    <span className="text-sm text-gray-400">
                        Question {currentQuestion + 1} of {DAILY_QUESTIONS.length}
                    </span>
                </div>
            </div>

            <div className="text-center mb-8">
                <h4 className="text-2xl font-bold text-white mb-6 leading-relaxed">
                    {question.question}
                </h4>
            </div>

            <div className="space-y-3">
                {question.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleAnswer(option)}
                        className="w-full glass rounded-2xl p-4 text-left hover:bg-white/10 hover:border-yellow-400/30 transition-all duration-300 group border border-white/10"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-white font-medium">{option}</span>
                            <ArrowRight
                                size={16}
                                className="text-gray-400 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all duration-300"
                            />
                        </div>
                    </button>
                ))}
            </div>

            <div className="mt-8 text-center">
                <p className="text-sm text-gray-400">
                    Your daily check-in helps track your mood and energy patterns
                </p>
            </div>
        </div>
    );
}