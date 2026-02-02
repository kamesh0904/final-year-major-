import { X, Trash2, Plus, Calendar, Heart } from "lucide-react";

interface DiaryEntry {
    id: string;
    title: string;
    content: string;
    mood_rating: number;
    tags: string[];
    entry_date: string;
    created_at: string;
}

interface DiaryEntriesListModalProps {
    isOpen: boolean;
    onClose: () => void;
    entries: DiaryEntry[];
    date: string;
    onDelete: (entryId: string) => void;
    onCreateNew: () => void;
}

export default function DiaryEntriesListModal({
    isOpen,
    onClose,
    entries,
    date,
    onDelete,
    onCreateNew
}: DiaryEntriesListModalProps) {
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

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-3xl glass-dark rounded-3xl p-8 border border-white/20 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-calm">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                            Entries for {formatDate(date)}
                        </h2>
                        <p className="text-sm text-gray-400">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCreateNew}
                            className="p-2 text-purple-400 hover:text-purple-300 transition-all duration-300 rounded-xl hover:bg-purple-400/10"
                            title="Add another entry"
                        >
                            <Plus size={24} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white transition-all duration-300 rounded-xl hover:bg-white/10"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Entries List */}
                <div className="space-y-4">
                    {entries.map((entry) => (
                        <div
                            key={entry.id}
                            className="glass rounded-2xl p-6 border border-white/10 hover:border-purple-400/30 transition-all duration-300 group"
                        >
                            {/* Entry Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-200 transition-colors">
                                        {entry.title}
                                    </h3>
                                    <div className="flex items-center gap-3 text-sm text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {formatTime(entry.created_at)}
                                        </span>
                                        <span className={`flex items-center gap-1 ${getMoodColor(entry.mood_rating)}`}>
                                            <Heart size={12} />
                                            Mood: {entry.mood_rating}/10
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-2xl ${getMoodColor(entry.mood_rating)}`}>
                                        {getMoodEmoji(entry.mood_rating)}
                                    </span>
                                    <button
                                        onClick={() => onDelete(entry.id)}
                                        className="p-2 text-red-400/70 hover:text-red-400 transition-all duration-300 rounded-lg hover:bg-red-400/10"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Entry Content */}
                            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {entry.content}
                            </div>

                            {/* Tags (if any) */}
                            {entry.tags && entry.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                                    {entry.tags.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1 glass rounded-full text-xs text-purple-300"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* No Entries Message */}
                {entries.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-400 mb-4">No entries for this date yet</p>
                        <button onClick={onCreateNew} className="btn-nature">
                            Create First Entry
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
