import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
import { Book, Lock, ArrowRight } from "lucide-react";

export default function DiaryAccess() {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPasswordInput, setShowPasswordInput] = useState(false);

    const handleDiaryAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Please log in first");
                return;
            }

            // Verify diary password
            const response = await fetch(`${API_BASE}/verify-diary-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, password })
            });

            const result = await response.json();
            if (result.valid) {
                sessionStorage.setItem('diary_access', 'granted');
                sessionStorage.setItem('diary_access_time', Date.now().toString());

                // Navigate to diary page
                navigate("/diary");
            } else {
                alert("Incorrect diary password");
            }
        } catch (error) {
            console.error("Diary access error:", error);
            alert("Error accessing diary");
        } finally {
            setLoading(false);
            setPassword("");
        }
    };

    if (!showPasswordInput) {
        return (
            <div className="card-warm group animate-fade-in relative overflow-hidden">
                {/* Subtle animated background */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-500/10 to-transparent rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                <Book className="text-purple-400" size={20} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">Personal Diary</h3>
                                <p className="text-gray-300 text-sm">Private thoughts & reflections</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowPasswordInput(true)}
                            className="btn-warm flex items-center gap-2 group-hover:scale-105 transition-transform duration-300"
                        >
                            <Lock size={14} />
                            Access
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card-warm animate-fade-in relative overflow-hidden">
            {/* Subtle animated background */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 glass rounded-2xl flex items-center justify-center">
                        <Lock className="text-purple-400" size={16} />
                    </div>
                    <h3 className="text-white font-bold">Enter Diary Password</h3>
                </div>

                <form onSubmit={handleDiaryAccess} className="space-y-4">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your diary password..."
                        className="input-calm"
                        required
                        autoFocus
                    />

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-nature flex-1 disabled:opacity-50"
                        >
                            {loading ? "Verifying..." : "Access Diary"}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowPasswordInput(false);
                                setPassword("");
                            }}
                            className="px-6 py-3 glass rounded-2xl text-gray-300 hover:text-white transition-all duration-300 hover:bg-white/10"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
                ) : (
                <div>
                    <button onClick={() => setShowPasswordInput(true)} className="btn-nature w-full">
                        <Lock size={16} />
                        Access Your Diary
                        <ArrowRight size={16} />
                    </button>
                    <button
                        onClick={() => navigate('/forgot-diary-password')}
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors mt-3 text-center w-full"
                    >
                        Forgot your diary password?
                    </button>
                </div>

                <p className="text-xs text-gray-400 mt-4 text-center leading-relaxed">
                    Your diary is protected and only accessible to you and your AI companion
                </p>
            </div>
        </div>
    );
}