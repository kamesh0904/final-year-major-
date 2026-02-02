import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

interface DiaryEntry {
    id: string;
    title: string;
    content: string;
    mood_rating: number;
    tags: string[];
    entry_date: string;
    created_at: string;
}

interface DiaryCalendarProps {
    entries: DiaryEntry[];
    onDateClick: (date: string) => void;
    onCreateEntry: (date: string) => void;
}

export default function DiaryCalendar({ entries, onDateClick, onCreateEntry }: DiaryCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Get the first day of the month and total days
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Month names
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Day names
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Navigate to previous month
    const previousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    // Navigate to next month
    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    // Go to today
    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Check if a date has entries
    const getEntriesForDate = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return entries.filter(entry => entry.entry_date === dateStr);
    };

    // Check if date is today
    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    // Check if date is in the future
    const isFuture = (day: number) => {
        const dateToCheck = new Date(year, month, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dateToCheck > today;
    };

    // Generate calendar days including padding
    const calendarDays: (number | null)[] = [];

    // Add padding for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(null);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    const handleDayClick = (day: number | null) => {
        if (day === null || isFuture(day)) return;

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const entriesOnDate = getEntriesForDate(day);

        if (entriesOnDate.length > 0) {
            onDateClick(dateStr);
        } else {
            onCreateEntry(dateStr);
        }
    };

    return (
        <div className="card-calm animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 glass rounded-2xl flex items-center justify-center">
                        <CalendarIcon className="text-purple-400" size={20} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                        {monthNames[month]} {year}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={goToToday}
                        className="px-4 py-2 glass rounded-xl text-sm text-gray-300 hover:text-white transition-all duration-300 hover:bg-white/10"
                    >
                        Today
                    </button>
                    <button
                        onClick={previousMonth}
                        className="p-2 glass rounded-xl text-gray-300 hover:text-white transition-all duration-300 hover:bg-white/10"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 glass rounded-xl text-gray-300 hover:text-white transition-all duration-300 hover:bg-white/10"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {dayNames.map((day) => (
                    <div
                        key={day}
                        className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-2"
                    >
                        {day}
                    </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((day, index) => {
                    if (day === null) {
                        return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const dayEntries = getEntriesForDate(day);
                    const hasEntries = dayEntries.length > 0;
                    const todayClass = isToday(day);
                    const futureClass = isFuture(day);

                    return (
                        <div
                            key={day}
                            onClick={() => handleDayClick(day)}
                            className={`
                                aspect-square glass rounded-2xl p-2 relative group
                                transition-all duration-300 border border-white/10
                                ${futureClass
                                    ? 'cursor-not-allowed opacity-40'
                                    : 'cursor-pointer hover:border-purple-400/50 hover:bg-white/5 hover-lift'
                                }
                                ${todayClass ? 'border-emerald-400/50 bg-emerald-400/5 shadow-lg shadow-emerald-500/10' : ''}
                            `}
                        >
                            {/* Day number */}
                            <div className={`text-sm font-semibold ${todayClass ? 'text-emerald-400' : 'text-gray-200'}`}>
                                {day}
                            </div>

                            {/* Entry indicator or plus icon */}
                            {!futureClass && (
                                <div className="absolute bottom-2 right-2">
                                    {hasEntries ? (
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse-slow" />
                                            <span className="text-xs text-purple-400 font-medium">
                                                {dayEntries.length}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <Plus size={16} className="text-purple-400" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Today badge */}
                            {todayClass && (
                                <div className="absolute top-1 left-1">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse-slow" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                    <span className="text-gray-300">Today</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-400 rounded-full" />
                    <span className="text-gray-300">Has Entries</span>
                </div>
            </div>
        </div>
    );
}
