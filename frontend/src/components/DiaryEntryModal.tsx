import { useState } from "react";
import { X, Heart, Save } from "lucide-react";

interface DiaryEntry {
    id?: string;
    title: string;
    content: string;
    mood_rating: number;
    tags: string[];
    entry_date: string;
    created_at?: string;
}

interface DiaryEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (entry: Omit<DiaryEntry, 'id'>) => Promise<void>;
    date: string;
    existingEntry?: DiaryEntry | null;
}

export default function DiaryEntryModal({
    isOpen,
    onClose,
    onSave,
    date,
    existingEntry = null
}: DiaryEntryModalProps) {
    const [title, setTitle] = useState(existingEntry?.title || "");
    const [content, setContent] = useState(existingEntry?.content || "");
    const [moodRating, setMoodRating] = useState(existingEntry?.mood_rating || 5);
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

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

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) {
            alert("Please fill in both title and content");
            return;
        }

        setSaving(true);
        try {
            await onSave({
                title: title.trim(),
                content: content.trim(),
                mood_rating: moodRating,
                tags: [],
                entry_date: date
            });

            // Reset form
            setTitle("");
            setContent("");
            setMoodRating(5);
            onClose();
        } catch (error) {
            console.error("Error saving entry:", error);
            alert("Failed to save diary entry");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl glass-dark rounded-3xl p-8 border border-white/20 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-calm">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                            {existingEntry ? "Edit Entry" : "New Diary Entry"}
                        </h2>
                        <p className="text-sm text-purple-300">{formatDate(date)}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white transition-all duration-300 rounded-xl hover:bg-white/10"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Give your entry a title..."
                            className="input-calm"
                            autoFocus
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Your Thoughts
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your thoughts and feelings here..."
                            className="input-calm resize-none"
                            rows={12}
                        />
                    </div>

                    {/* Mood Rating */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            How are you feeling?
                        </label>
                        <div className="flex items-center gap-4">
                            <Heart size={18} className="text-pink-400" />
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={moodRating}
                                onChange={(e) => setMoodRating(parseInt(e.target.value))}
                                className="flex-1 accent-purple-400"
                            />
                            <span className={`text-2xl font-medium ${getMoodColor(moodRating)} min-w-[80px] text-center`}>
                                {getMoodEmoji(moodRating)} {moodRating}/10
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn-nature flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Save size={18} />
                            {saving ? "Saving..." : "Save Entry"}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className="px-6 py-3 glass rounded-2xl text-gray-300 hover:text-white transition-all duration-300 hover:bg-white/10 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Privacy Note */}
                <p className="text-xs text-gray-400 mt-6 text-center leading-relaxed">
                    🔒 Your diary is private and only accessible to you and your AI companion
                </p>
            </div>
        </div>
    );
}
