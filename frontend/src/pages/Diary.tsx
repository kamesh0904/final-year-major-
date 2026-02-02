import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ArrowLeft, Lock, Book } from "lucide-react";
import DiaryCalendar from "../components/DiaryCalendar";
import DiaryEntryModal from "../components/DiaryEntryModal";
import DiaryEntriesListModal from "../components/DiaryEntriesListModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

interface DiaryEntry {
    id: string;
    title: string;
    content: string;
    mood_rating: number;
    tags: string[];
    entry_date: string;
    created_at: string;
}

export default function Diary() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string>("");
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [showEntryModal, setShowEntryModal] = useState(false);
    const [showEntriesListModal, setShowEntriesListModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [currentMonthStart, setCurrentMonthStart] = useState<string>("");
    const [currentMonthEnd, setCurrentMonthEnd] = useState<string>("");

    useEffect(() => {
        checkAccess();
    }, []);

    useEffect(() => {
        if (userId) {
            loadEntriesForCurrentMonth();
        }
    }, [userId, currentMonthStart, currentMonthEnd]);

    const checkAccess = async () => {
        try {
            // Check if user has diary access
            const diaryAccess = sessionStorage.getItem('diary_access');
            const accessTime = sessionStorage.getItem('diary_access_time');

            if (!diaryAccess || !accessTime) {
                navigate('/dashboard');
                return;
            }

            // Check if access has expired (optional: 1 hour timeout)
            const currentTime = Date.now();
            const elapsed = currentTime - parseInt(accessTime);
            const oneHour = 60 * 60 * 1000;

            if (elapsed > oneHour) {
                sessionStorage.removeItem('diary_access');
                sessionStorage.removeItem('diary_access_time');
                navigate('/dashboard');
                return;
            }

            // Get user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            setUserId(user.id);

            // Set initial month range
            const currentDate = new Date();
            const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            setCurrentMonthStart(firstDay.toISOString().split('T')[0]);
            setCurrentMonthEnd(lastDay.toISOString().split('T')[0]);

        } catch (error) {
            console.error("Access check error:", error);
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const loadEntriesForCurrentMonth = async () => {
        if (!currentMonthStart || !currentMonthEnd) return;

        try {
            const response = await fetch(
                `${API_BASE}/diary-entries-by-date/${userId}?start_date=${currentMonthStart}&end_date=${currentMonthEnd}`
            );
            const data = await response.json();

            if (data.entries) {
                setEntries(data.entries);
            }
        } catch (error) {
            console.error("Error loading diary entries:", error);
        }
    };

    const handleDateClick = (date: string) => {
        const entriesOnDate = entries.filter(entry => entry.entry_date === date);

        if (entriesOnDate.length > 1) {
            // Show list modal if multiple entries
            setSelectedDate(date);
            setShowEntriesListModal(true);
        } else if (entriesOnDate.length === 1) {
            // Show single entry in modal (view/edit mode)
            setSelectedDate(date);
            setShowEntryModal(true);
        }
    };

    const handleCreateEntry = (date: string) => {
        setSelectedDate(date);
        setShowEntryModal(true);
    };

    const handleSaveEntry = async (entry: Omit<DiaryEntry, 'id'>) => {
        try {
            const response = await fetch(`${API_BASE}/create-diary-entry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    ...entry
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                // Reload entries
                await loadEntriesForCurrentMonth();
                setShowEntryModal(false);
            } else {
                alert(result.message || "Failed to save entry");
            }
        } catch (error) {
            console.error("Error saving entry:", error);
            throw error;
        }
    };

    const handleDeleteEntry = async (entryId: string) => {
        if (!confirm("Are you sure you want to delete this entry?")) return;

        try {
            const response = await fetch(`${API_BASE}/diary-entry/${entryId}?user_id=${userId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.status === 'success') {
                await loadEntriesForCurrentMonth();
                setShowEntriesListModal(false);
            } else {
                alert(result.message || "Failed to delete entry");
            }
        } catch (error) {
            console.error("Error deleting entry:", error);
            alert("Failed to delete entry");
        }
    };

    const handleLockDiary = () => {
        sessionStorage.removeItem('diary_access');
        sessionStorage.removeItem('diary_access_time');
        navigate('/dashboard');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse-slow mx-auto mb-4" />
                    <p className="text-gray-400 animate-fade-in">Loading your diary...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-8 px-6 md:px-12 pb-24">
            {/* Gentle background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300 group hover-lift"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Back to dashboard
                    </button>

                    <button
                        onClick={handleLockDiary}
                        className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-gray-300 hover:text-white transition-all duration-300 hover:bg-white/10"
                    >
                        <Lock size={16} />
                        Lock Diary
                    </button>
                </div>

                {/* Title */}
                <div className="mb-8 animate-fade-in">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center">
                            <Book className="text-purple-400" size={24} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white">
                            Personal Diary
                        </h1>
                    </div>
                    <p className="text-gray-300 text-lg ml-16">
                        Your private space for thoughts, feelings, and reflections
                    </p>
                </div>

                {/* Calendar */}
                <DiaryCalendar
                    entries={entries}
                    onDateClick={handleDateClick}
                    onCreateEntry={handleCreateEntry}
                />

                {/* Entry Modal */}
                <DiaryEntryModal
                    isOpen={showEntryModal}
                    onClose={() => setShowEntryModal(false)}
                    onSave={handleSaveEntry}
                    date={selectedDate}
                />

                {/* Entries List Modal */}
                <DiaryEntriesListModal
                    isOpen={showEntriesListModal}
                    onClose={() => setShowEntriesListModal(false)}
                    entries={entries.filter(e => e.entry_date === selectedDate)}
                    date={selectedDate}
                    onDelete={handleDeleteEntry}
                    onCreateNew={() => {
                        setShowEntriesListModal(false);
                        setShowEntryModal(true);
                    }}
                />
            </div>
        </div>
    );
}
