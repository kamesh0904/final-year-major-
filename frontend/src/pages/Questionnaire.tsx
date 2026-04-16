import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { submitQuestionnaire } from "../api/neuroNestApi";

// --- Types ---
type Option = { label: string; value: number };
type Question = { id: number; domain: string; text: string };

const OPTIONS: Option[] = [
  { label: "Never", value: 1 },
  { label: "Rarely", value: 2 },
  { label: "Sometimes", value: 3 },
  { label: "Often", value: 4 },
  { label: "Always", value: 5 },
];

const QUESTIONS: Question[] = [
  // ADHD (IDs 1-5)
  { id: 1, domain: "ADHD", text: "Do you struggle to stay focused on tasks that don't interest you, even when they're important?" },
  { id: 2, domain: "ADHD", text: "Do you often start multiple projects but find it difficult to complete them?" },
  { id: 3, domain: "ADHD", text: "Do you tend to act or speak before thinking things through?" },
  { id: 4, domain: "ADHD", text: "Do you feel mentally restless, even when your body is still?" },
  { id: 5, domain: "ADHD", text: "Do you have trouble keeping track of time or remembering deadlines?" },

  // OCD (IDs 6-10)
  { id: 6, domain: "OCD", text: "Do you feel an uncontrollable urge to check things repeatedly (like locks, switches, or messages)?" },
  { id: 7, domain: "OCD", text: "Do certain thoughts get stuck in your mind even when you try hard to ignore them?" },
  { id: 8, domain: "OCD", text: "Do you perform certain actions (like washing, counting, or arranging) to reduce anxiety?" },
  { id: 9, domain: "OCD", text: "Do you feel intense discomfort when things aren't done the right way or placed symmetrically?" },
  { id: 10, domain: "OCD", text: "Does your daily life or routine get disrupted because of repetitive thoughts or behaviors?" },

  // Autism (IDs 11-15)
  { id: 11, domain: "Autism", text: "Do you find social interactions confusing or exhausting?" },
  { id: 12, domain: "Autism", text: "Do you prefer following specific routines and feel distressed when they change unexpectedly?" },
  { id: 13, domain: "Autism", text: "Do you often notice small details or patterns that others seem to miss?" },
  { id: 14, domain: "Autism", text: "Do you feel overwhelmed by loud noises, bright lights, or certain textures?" },
  { id: 15, domain: "Autism", text: "Do you have one or more interests that you can talk or think about for hours without getting bored?" },

  // Anxiety (IDs 16-20)
  { id: 16, domain: "Anxiety", text: "Do you often worry about future events, even when there's no clear reason?" },
  { id: 17, domain: "Anxiety", text: "Do you find it hard to relax, even during your free time?" },
  { id: 18, domain: "Anxiety", text: "Do you overthink small mistakes or social situations long after they happen?" },
  { id: 19, domain: "Anxiety", text: "Do you experience physical symptoms (like a racing heart or tense muscles) when you feel anxious?" },
  { id: 20, domain: "Anxiety", text: "Do you frequently feel like something bad might happen, even when things are going well?" },

  // Depression (IDs 21-25)
  { id: 21, domain: "Depression", text: "Do you often feel drained or unmotivated, even when you've had enough rest?" },
  { id: 22, domain: "Depression", text: "Do you lose interest in activities you once enjoyed?" },
  { id: 23, domain: "Depression", text: "Do your emotions shift quickly or feel more intense than others seem to experience?" },
  { id: 24, domain: "Depression", text: "Do you sometimes feel disconnected from yourself or your surroundings?" },
  { id: 25, domain: "Depression", text: "Do you struggle to find joy or purpose in daily life?" },
];

export default function Questionnaire() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ primaryProfile: string; scores: Record<string, number> } | null>(null);

  const question = QUESTIONS[current];
  const progress = ((current + 1) / QUESTIONS.length) * 100;

  const handleSelect = (value: number) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const next = () => {
    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1);
    } else {
      handleSubmit();
    }
  };

  const previous = () => {
    if (current > 0) setCurrent(current - 1);
  };

  // --- SUBMISSION LOGIC (Updated to Calculate Scores) ---
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // 2. Calculate Scores Manually (So dashboard fills immediately)
      const scores = {
        ADHD: 0, OCD: 0, Autism: 0, Anxiety: 0, Depression: 0
      };

      Object.entries(answers).forEach(([qId, val]) => {
        const id = parseInt(qId);
        if (id >= 1 && id <= 5) scores.ADHD += val;
        else if (id >= 6 && id <= 10) scores.OCD += val;
        else if (id >= 11 && id <= 15) scores.Autism += val;
        else if (id >= 16 && id <= 20) scores.Anxiety += val;
        else if (id >= 21 && id <= 25) scores.Depression += val;
      });

      // 3. Determine Primary Profile
      const maxScore = Math.max(...Object.values(scores));
      // Find which category has the maxScore
      const primaryProfile = Object.keys(scores).find(key => scores[key as keyof typeof scores] === maxScore) || "General";

      // 4. Send to Backend (Optional - don't block if fails)
      try {
        await submitQuestionnaire(answers);
      } catch (apiError) {
        console.warn("Backend API skipped:", apiError);
      }

      // 5. SAVE TO DB (Include 'scores' this time!)
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          profile_type: primaryProfile,
          scores: scores,  // <--- CRITICAL FIX: Saving the scores object
          traits: ['New User'],
          xp: 0,
          level: 1
        });

      if (error) {
        console.error("Supabase Upsert Error:", error);
      }

      // 6. Force Local Storage Update
      localStorage.setItem("hasCompletedQuestionnaire", "true");
      localStorage.setItem("activeProfile", primaryProfile);

      // 7. Show Result
      setResult({ primaryProfile, scores });

    } catch (error) {
      console.error("Submission Error:", error);
      localStorage.setItem("hasCompletedQuestionnaire", "true");
      window.location.href = "/dashboard";
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="w-full max-w-2xl relative z-10 card-calm animate-fade-in relative overflow-hidden text-center py-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Assessment Complete ✨</h2>
            <div className="mb-8 px-4">
                <p className="text-xl text-gray-200 mb-6">Primary Profile: <span className="text-purple-400 font-bold">{result.primaryProfile}</span></p>
                
                <div className="bg-white/5 rounded-2xl p-6 inline-block text-left w-full max-w-md mx-auto border border-white/10">
                    <h3 className="text-lg text-white font-medium border-b border-white/10 pb-3 mb-4">Scores Breakdown</h3>
                    {Object.entries(result.scores).map(([domain, score]) => (
                        <div key={domain} className="flex justify-between items-center text-gray-300 py-2">
                            <span className="text-base">{domain}</span>
                            <span className="font-bold text-white text-lg bg-white/10 px-3 py-1 rounded-lg">{score}</span>
                        </div>
                    ))}
                </div>
            </div>
            
            <p className="text-gray-300 mb-8 text-lg px-4">Your experience is now personalised. Welcome to NeuroNest.</p>
            
            <div className="px-4">
                <button
                onClick={() => window.location.href = "/dashboard"}
                className="btn-calm px-8 py-4 w-full sm:w-auto text-lg hover-lift shadow-lg shadow-purple-500/20"
                >
                Start My Journey
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {/* Gentle background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">

        {/* Progress Bar */}
        <div className="mb-8 animate-fade-in">
          <div className="flex justify-between text-xs text-gray-300 mb-3">
            <span>Question {current + 1} of {QUESTIONS.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-3 glass rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 transition-all duration-700 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="card-calm animate-fade-in relative overflow-hidden">
          {/* Subtle animated background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              <span className="text-gradient">{question.domain}</span> Assessment
            </h2>
            <p className="text-lg text-gray-200 mb-8 leading-relaxed">
              {question.text}
            </p>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  disabled={isSubmitting}
                  className={`w-full text-left px-6 py-4 rounded-2xl border transition-all duration-300 hover-lift
                    ${answers[question.id] === opt.value
                      ? "border-purple-400/50 glass bg-purple-500/20 text-white animate-glow"
                      : "border-white/10 glass text-gray-300 hover:border-white/30 hover:bg-white/10"
                    }
                  `}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{opt.label}</span>
                    {answers[question.id] === opt.value && (
                      <span className="w-3 h-3 rounded-full bg-purple-400 animate-pulse-slow" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4">
              <button
                onClick={previous}
                disabled={current === 0 || isSubmitting}
                className="px-6 py-3 glass rounded-2xl font-medium text-gray-300 hover:text-white disabled:opacity-0 transition-all duration-300 hover:bg-white/10"
              >
                Back
              </button>

              <button
                onClick={next}
                disabled={!answers[question.id] || isSubmitting}
                className="ml-auto btn-calm px-8 py-3 disabled:opacity-50 disabled:scale-100"
              >
                {isSubmitting ? "Analyzing..." : current === QUESTIONS.length - 1 ? "Complete Assessment" : "Next Question"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}