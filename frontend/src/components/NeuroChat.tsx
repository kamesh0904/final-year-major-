import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function NeuroChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Get Profile context from LocalStorage (saved during Home.tsx load)
    // We assume Home.tsx saved the "traits" or "scores" to localStorage.
    // For now, let's grab the raw questionnaire answers or a stored profile string.
    // You might want to update Home.tsx to save: localStorage.setItem("activeProfile", "ADHD");
    const profileContext = localStorage.getItem("activeProfile") || "General Neurodivergent";

    // Get recent game stats (optional)
    const recentGame = localStorage.getItem("lastGamePlayed") || "None";

    // Get user ID from Supabase auth
    let userId = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    } catch (error) {
      console.error("Error getting user:", error);
    }

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history: messages, // Send history for context
          profile: profileContext,
          game_stats: `Last game: ${recentGame}`,
          user_id: userId // Add user_id for diary access
        }),
      });

      const data = await res.json();
      const aiMsg: Message = { role: "assistant", content: data.response };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg: Message = { role: "assistant", content: "Sorry, I'm having trouble connecting right now." };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end pointer-events-none" style={{ zIndex: 60 }}>

      {/* Chat Window */}
      {isOpen && (
        <div className="pointer-events-auto w-80 md:w-96 h-[500px] bg-[#1a142e] border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-10 fade-in duration-300">

          {/* Header */}
          <div className="p-4 bg-purple-600/20 border-b border-purple-500/20 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-300" size={18} />
              <div>
                <h3 className="text-sm font-bold text-white">Neuro Companion</h3>
                <p className="text-[10px] text-purple-200/60">Powered by AI • Always here</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-full transition"
            >
              <X size={18} className="text-white" />
            </button>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center mt-10 opacity-50">
                <p className="text-sm text-purple-200">Hello! I adapt to your profile.</p>
                <p className="text-xs text-purple-300 mt-2">How are you feeling today?</p>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                    max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed
                    ${m.role === "user"
                      ? "bg-purple-600 text-white rounded-br-none"
                      : "bg-white/10 text-gray-200 rounded-bl-none border border-white/5"}
                  `}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 rounded-2xl px-4 py-3 rounded-bl-none">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-100" />
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-[#120b22] border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-2 bg-purple-600 rounded-xl text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-glow"
            >
              <Send size={18} />
            </button>
          </div>

        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto p-4 rounded-full bg-gradient-primary text-white shadow-2xl hover:scale-110 transition-transform duration-300 group"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} className="group-hover:animate-pulse" />}
      </button>
    </div>
  );
}