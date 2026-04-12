import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Sparkles, Brain, User, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { logger } from "../utils/logger";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
};

interface ChatMessage {
  role: string;
  content: string;
  created_at?: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileType, setProfileType] = useState("General");
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    loadChatHistory();
    loadProfile();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;

      setUserId(user.id);

      // Store profile in localStorage so NeuroChat widget can also use it
      const { data } = await supabase
        .from('profiles')
        .select('profile_type')
        .eq('id', user.id)
        .single();

      if (data?.profile_type) {
        setProfileType(data.profile_type);
        localStorage.setItem("activeProfile", data.profile_type);
      }
    } catch (err) {
      logger.error("Profile load error", err);
    }
  };

  const loadChatHistory = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;

      const { data, error } = await supabase
        .from('chat_messages')
        .select('role, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        logger.error("Error loading chat history", error);
        return;
      }

      if (data) {
        const history: Message[] = data.map((msg: ChatMessage) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));
        setMessages(history);
      }
    } catch (err) {
      logger.error("Chat history load error", err);
    }
  };

  const saveMessageToDB = async (role: "user" | "assistant", content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('chat_messages').insert([{ user_id: user.id, role, content }]);
    } catch (err) {
      logger.error("Message save error", err);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    const userMsg = trimmedInput;
    const newHistory = [...messages, { role: "user", content: userMsg } as Message];

    setMessages(newHistory);
    setInput("");
    setLoading(true);
    setError(null);

    saveMessageToDB("user", userMsg);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          message: userMsg,
          history: newHistory.slice(-20), // last 20 messages for context
          profile: profileType,
          game_stats: localStorage.getItem("lastGamePlayed") || "No recent games",
          user_id: userId,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => response.statusText);
        throw new Error(`Server error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const botMsg = data.response as string;

      setMessages((prev) => [...prev, { role: "assistant", content: botMsg }]);
      saveMessageToDB("assistant", botMsg);

    } catch (err) {
      if ((err as Error).name === "AbortError") return;

      const msg = err instanceof Error ? err.message : "Connection error";
      logger.error("Chat error", err);
      setError(msg);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble connecting right now. Please check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="min-h-screen pt-8 px-6 pb-6 flex flex-col items-center relative">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-4xl card-calm flex flex-col h-[85vh] overflow-hidden animate-fade-in relative z-10">

        {/* Header */}
        <div className="p-6 border-b border-white/10 glass-dark backdrop-blur-sm flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-lg animate-glow">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Neuro-Companion</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-slow" />
                <p className="text-xs text-emerald-300 font-medium uppercase tracking-wide">
                  Online • {profileType} Mode
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setMessages([])}
            className="p-2 glass rounded-xl transition-all duration-300 text-gray-400 hover:text-white hover:bg-white/10"
            title="Clear view (does not delete history)"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-200">✕</button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-calm">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-70">
              <div className="w-16 h-16 glass rounded-full flex items-center justify-center mb-4 animate-pulse-slow">
                <Brain size={24} className="text-purple-400" />
              </div>
              <p className="text-center leading-relaxed">
                Your safe space for conversation.<br />Share what's on your mind.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-4 animate-fade-in ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className={`
                w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center
                ${msg.role === "assistant" ? "glass border border-white/10" : "bg-gradient-to-br from-purple-500 to-indigo-500"}
              `}>
                {msg.role === "assistant"
                  ? <Sparkles size={16} className="text-purple-400" />
                  : <User size={16} />}
              </div>
              <div className={`
                max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg
                ${msg.role === "assistant"
                  ? "glass border border-white/10 text-gray-200 rounded-tl-none"
                  : "bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-tr-none"}
              `}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-4 animate-fade-in">
              <div className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center">
                <Sparkles size={16} className="animate-spin text-purple-400" />
              </div>
              <div className="glass p-4 rounded-2xl rounded-tl-none text-gray-300 text-sm border border-white/10">
                Thinking gently...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 glass-dark backdrop-blur-md border-t border-white/10">
          <form onSubmit={handleSend} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share your thoughts..."
              className="input-calm pr-14"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-2 p-2 btn-calm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} className="text-white" />
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-3 leading-relaxed">
            Your AI companion remembers your context. All conversations are private and secure.
          </p>
        </div>
      </div>
    </div>
  );
}
