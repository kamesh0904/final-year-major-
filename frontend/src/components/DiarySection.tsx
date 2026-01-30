import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
import { Book, Lock, Plus, Trash2, Calendar, Heart } from "lucide-react";

interface DiaryEntry {
    id: string;
    title: string;
    content: string;
    mood_rating: number;
    tags: string[];
    created_at: string;
    updated_at: string;
}

interface DiarySectionProps {
    userId: string;
}

export default function DiarySection({ userId }: DiarySectionProps) {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [password, setPassword] = useState("");
    const [hasPassword, setHasPassword] = useState(false);
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [showNewEntry, setShowNewEntry] = useState(false);
    const [editingEntry, setEditingEntry] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [newEntry, setNewEntry] = useState({
        title: "",
        content: "",
        mood_rating: 5,
        tags: [] as string[]
    });

    useEffect(() => {
        checkDiaryPassword();
    }, [userId]);

    useEffect(() => {
        if (isUnlocked) {
            loadDiaryEntries();
        }
    }, [isUnlocked]);

    const checkDiaryPassword = async () => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('diary_password_hash')
                .eq('id', userId)
                .single();

            setHasPassword(!!data?.diary_password_hash);
        } catch (error) {
            console.error("Error checking diary password:", error);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!hasPassword) {
                // Create new diary password
                const response = await fetch(`${API_BASE}/create-diary-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId, password })
                });

                if (response.ok) {
                    setHasPassword(true);
                    setIsUnlocked(true);
                    setPassword("");
                } else {
                    alert("Failed to create diary password");
                }
            } else {
                // Verify existing password
                const response = await fetch(`${API_BASE}/verify-diary-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId, password })
                });

                const result = await response.json();
                if (result.valid) {
                    setIsUnlocked(true);
                    setPassword("");
                } else {
                    alert("Incorrect diary password");
                }
            }
        } catch (error) {
            console.error("Password error:", error);
            alert("Error with diary password");
        } finally {
            setLoading(false);
        }
    };

    const loadDiaryEntries = async () => {
        try {
            const { data, error } = await supabase
                .from('diary_entries')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEntries(data || []);
        } catch (error) {
            console.error("Error loading diary entries:", error);
        }
    };

    const saveDiaryEntry = async () => {
        if (!newEntry.title.trim() || !newEntry.content.trim()) {
            alert("Please fill in both title and content");
            return;
        }

        try {
            const { error } = await supabase
                .from('diary_entries')
                .insert({
                    user_id: userId,
                    title: newEntry.title,
                    content: newEntry.content,
                    mood_rating: newEntry.mood_rating,
                    tags: newEntry.tags
                });

            if (error) throw error;

            setNewEntry({ title: "", content: "", mood_rating: 5, tags: [] });
            setShowNewEntry(false);
            loadDiaryEntries();
        } catch (error) {
            console.error("Error saving diary entry:", error);
            alert("Failed to save diary entry");
        }
    };

    const deleteDiaryEntry = async (entryId: string) => {
        if (!confirm("Are you sure you want to delete this diary entry?")) return;

        try {
            const { error } = await supabase
                .from('diary_entries')
                .delete()
                .eq('id', entryId);

            if (error) throw error;
            loadDiaryEntries();
        } catch (error) {
            console.error("Error deleting diary entry:", error);
            alert("Failed to delete diary entry");
        }
    };

    const getMoodEmoji = (rating: number) => {
        if (rating <= 2) return "😢";
        if (rating <= 4) return "😕";
        if (rating <= 6) return "😐";
        if (rating <= 8) return "🙂";
        return "😊";
    };

    const getMoodColor = (rating: number) => {
        if (rating <= 2) return "text-red-400";
        if (rating <= 4) return "text-orange-400";
        if (rating <= 6) return "text-yellow-400";
        if (rating <= 8) return "text-green-400";
        return "text-emerald-400";
    };

    if (!isUnlocked) {
        return (
            <div className="card-calm relative overflow-hidden">
                {/* Subtle animated background */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <div className="w-8 h-8 glass rounded-xl flex items-center justify-center">
                                <Book className="text-purple-400" size={16} />
                            </div>
                            Personal Diary
                        </h3>
                        <div className="w-8 h-8 glass rounded-xl flex items-center justify-center">
                            <Lock className="text-gray-400" size={14} />
                        </div>
                    </div>

                    <div className="text-center py-8">
                        <div className="mb-6">
                            <div className="w-16 h-16 glass rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
                                <Lock className="text-purple-400" size={24} />
                            </div>
                            <h4 className="text-white font-semibold mb-2">
                                {hasPassword ? "Enter Diary Password" : "Create Diary Password"}
                            </h4>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {hasPassword
                                    ? "Your diary is protected. Enter your password to access your private thoughts."
                                    : "Create a password to protect your personal diary. Only you and your AI companion will have access."
                                }
                            </p>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="max-w-sm mx-auto space-y-4">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={hasPassword ? "Enter diary password" : "Create diary password"}
                                className="input-calm"
                                required
                                minLength={6}
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-calm w-full disabled:opacity-50"
                            >
                                {loading ? "Processing..." : (hasPassword ? "Unlock Diary" : "Create Diary")}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card-calm relative overflow-hidden">
            {/* Subtle animated background */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl"></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <div className="w-8 h-8 glass rounded-xl flex items-center justify-center">
                            <Book className="text-purple-400" size={16} />
                        </div>
                        Personal Diary
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-medium">Unlocked</span>
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowNewEntry(!showNewEntry)}
                            className="p-2 text-purple-400 hover:text-purple-300 transition-all duration-300 rounded-xl hover:bg-purple-400/10"
                        >
                            <Plus size={16} />
                        </button>
                        <button
                            onClick={() => setIsUnlocked(false)}
                            className="p-2 text-gray-400 hover:text-gray-300 transition-all duration-300 rounded-xl hover:bg-white/10"
                        >
                            <Lock size={16} />
                        </button>
                    </div>
                </div>

                {/* New Entry Form */}
                {showNewEntry && (
                    <div className="mb-6 glass rounded-2xl p-5 border border-white/10 animate-fade-in">
                        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <div className="w-6 h-6 glass rounded-lg flex items-center justify-center">
                                <Plus className="text-purple-400" size={12} />
                            </div>
                            New Diary Entry
                        </h4>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={newEntry.title}
                                onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                                placeholder="Entry title..."
                                className="input-calm"
                            />

                            <textarea
                                value={newEntry.content}
                                onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                                placeholder="Write your thoughts..."
                                className="input-calm resize-none"
                                rows={6}
                            />

                            <div className="flex items-center gap-4">
                                <label className="text-sm text-gray-300 flex items-center gap-2 font-medium">
                                    <Heart size={14} className="text-pink-400" />
                                    Mood (1-10):
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={newEntry.mood_rating}
                                    onChange={(e) => setNewEntry({ ...newEntry, mood_rating: parseInt(e.target.value) })}
                                    className="flex-1 accent-purple-400"
                                />
                                <span className={`text-lg font-medium ${getMoodColor(newEntry.mood_rating)}`}>
                                    {getMoodEmoji(newEntry.mood_rating)} {newEntry.mood_rating}
                                </span>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={saveDiaryEntry}
                                    className="btn-nature flex-1"
                                >
                                    Save Entry
                                </button>
                                <button
                                    onClick={() => {
                                        setShowNewEntry(false);
                                        setNewEntry({ title: "", content: "", mood_rating: 5, tags: [] });
                                    }}
                                    className="px-6 py-3 glass rounded-2xl text-gray-300 hover:text-white transition-all duration-300 hover:bg-white/10"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Diary Entries */}
                <div className="space-y-4 scrollbar-calm max-h-96 overflow-y-auto">
                    {entries.length === 0 ? (
                        <div className="text-center py-12 glass rounded-2xl border border-white/10 border-dashed">
                            <div className="w-16 h-16 glass rounded-full flex items-center justify-center mx-auto mb-4">
                                <Book className="text-purple-400/50" size={24} />
                            </div>
                            <p className="text-gray-400 mb-4">No diary entries yet</p>
                            <p className="text-gray-500 text-sm">Start writing your thoughts and feelings</p>
                        </div>
                    ) : (
                        entries.map((entry) => (
                            <div key={entry.id} className="glass rounded-2xl p-5 border border-white/10 hover:border-purple-400/30 transition-all duration-300 hover-lift group">
                                <div className="flex items-start justify-between mb-3">
                                    <h4 className="text-white font-semibold group-hover:text-purple-200 transition-colors">{entry.title}</h4>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-lg ${getMoodColor(entry.mood_rating)}`}>
                                            {getMoodEmoji(entry.mood_rating)}
                                        </span>
                                        <button
                                            onClick={() => deleteDiaryEntry(entry.id)}
                                            className="p-1 text-red-400/70 hover:text-red-400 transition-all duration-300 rounded-lg hover:bg-red-400/10"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-gray-300 text-sm mb-4 leading-relaxed line-clamp-3">{entry.content}</p>

                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(entry.created_at).toLocaleDateString()}
                                    </span>
                                    <span className={`${getMoodColor(entry.mood_rating)} font-medium`}>
                                        Mood: {entry.mood_rating}/10
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}