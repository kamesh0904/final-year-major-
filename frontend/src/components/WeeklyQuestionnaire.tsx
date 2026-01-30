import { useState } from "react";
import { CheckCircle, ArrowRight, Brain } from "lucide-react";

interface WeeklyQuestionnaireProps {
    onComplete: (answers: Record<string, string>) => void;
    onCancel: () => void;
}

const WEEKLY_QUESTIONS = [
    {
        id: "mood",
        question: "How has your overall mood been this week?",
        options: ["Very Low", "Low", "Neutral", "Good", "Very Good"]
    },
    {
        id: "energy",
        question: "What has your energy level been like?",
        options: ["Very Low", "Low", "Moderate", "High", "Very High"]
    },
    {
        id: "stress",
        question: "How would you rate your stress levels?",
        options: ["Very High", "High", "Moderate", "Low", "Very Low"]
    },
    {
        id: "sleep",
        question: "How has your sleep quality been?",
        options: ["Very Poor", "Poor", "Fair", "Good", "Excellent"]
    },
    {
        id: "focus",
        question: "How well have you been able to concentrate?",
        options: ["Very Poorly", "Poorly", "Okay", "Well", "Very Well"]
    },
    {
        id: "social",
        question: "How have your social interactions felt?",
        options: ["Very Difficult", "Difficult", "Neutral", "Positive", "Very Positive"]
    },
    {
        id: "motivation",
        question: "How motivated have you felt to do daily activities?",
        options: ["Not at all", "Slightly", "Moderately", "Quite", "Extremely"]
    },
    {
        id: "anxiety",
        question: "How would you describe your anxiety levels?",
        options: ["Very High", "High", "Moderate", "Low", "Very Low"]
    },
    {
        id: "accomplishment",
        question: "How satisfied are you with what you accomplished this week?",
        options: ["Very Unsatisfied", "Unsatisfied", "Neutral", "Satisfied", "Very Satisfied"]
    },
    {
        id: "outlook",
        question: "How do you feel about the upcoming week?",
        options: ["Very Pessimistic", "Pessimistic", "Neutral", "Optimistic", "Very Optimistic"]
    }
];

export default function WeeklyQuestionnaire({ onComplete, onCancel }: WeeklyQuestionnaireProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const handleAnswer = (answer: string) => {
        const questionId = WEEKLY_QUESTIONS[currentQuestion].id;
        const newAnswers = { ...answers, [questionId]: answer };
        setAnswers(newAnswers);

        if (currentQuestion < WEEKLY_QUESTIONS.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            // All questions answered
            onComplete(newAnswers);
        }
    };

    const progress = ((currentQuestion + 1) / WEEKLY_QUESTIONS.length) * 100;
    const question = WEEKLY_QUESTIONS[currentQuestion];

    return (
        <div className="card-calm max-w-2xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
                            <Brain className="text-purple-400" size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Weekly Check-In</h3>
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
                        className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="text-center mb-2">
                    <span className="text-sm text-gray-400">
                        Question {currentQuestion + 1} of {WEEKLY_QUESTIONS.length}
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
                        className="w-full glass rounded-2xl p-4 text-left hover:bg-white/10 hover:border-purple-400/30 transition-all duration-300 group border border-white/10"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-white font-medium">{option}</span>
                            <ArrowRight
                                size={16}
                                className="text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-300"
                            />
                        </div>
                    </button>
                ))}
            </div>

            <div className="mt-8 text-center">
                <p className="text-sm text-gray-400">
                    Your responses help generate personalized insights for your weekly report
                </p>
            </div>
        </div>
    );
}