import { useState } from "react";
import { Star, Check, X, ArrowRight, Send } from "lucide-react";
import { GAME_QUESTIONS } from "../data/gameQuestions";
import { useLocation, useNavigate } from "react-router-dom";

interface Props {
  onComplete: () => void; // Callback to close modal or redirect
}

export default function GameFeedback({ onComplete }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname; // e.g. "/impulse-guard"
  
  const questions = GAME_QUESTIONS[path] || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const handleAnswer = (val: any) => {
    const currentQ = questions[currentIndex];
    
    // Save answer
    const newAnswers = { ...answers, [currentQ.id]: val };
    setAnswers(newAnswers);

    // Next question or Finish
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      submitFeedback(newAnswers);
    }
  };

  const submitFeedback = (finalAnswers: any) => {
    console.log("Submitting Feedback to Observer Agent:", {
      game: path,
      feedback: finalAnswers
    });
    
    // TODO: Here you would call your backend API
    // await api.post('/submit-feedback', { ... })

    onComplete(); // Usually navigates back to dashboard
  };

  if (questions.length === 0) return null;

  const q = questions[currentIndex];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-fade-in">
      <div className="w-full max-w-sm bg-[#1a142e] border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
        
        <h3 className="text-xl font-bold text-white mb-2 text-center">Quick Check-in</h3>
        <p className="text-sm text-purple-200/60 text-center mb-6">
          Question {currentIndex + 1} of {questions.length}
        </p>

        <div className="min-h-[120px] flex flex-col items-center justify-center">
          <p className="text-lg text-white font-medium text-center mb-8 animate-in slide-in-from-right-4 duration-300 key={currentIndex}">
            {q.text}
          </p>

          {/* RATING INPUT (1-5 Stars) */}
          {q.type === "rating" && (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleAnswer(star)}
                  className="p-3 rounded-full hover:bg-white/10 text-purple-400 hover:text-yellow-400 transition transform hover:scale-110"
                >
                  <Star fill="currentColor" size={32} />
                </button>
              ))}
            </div>
          )}

          {/* YES / NO INPUT */}
          {q.type === "yesno" && (
            <div className="flex gap-4 w-full">
              <button
                onClick={() => handleAnswer(false)}
                className="flex-1 py-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold hover:bg-red-500/20 transition flex items-center justify-center gap-2"
              >
                <X size={20} /> No
              </button>
              <button
                onClick={() => handleAnswer(true)}
                className="flex-1 py-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 font-bold hover:bg-green-500/20 transition flex items-center justify-center gap-2"
              >
                <Check size={20} /> Yes
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}