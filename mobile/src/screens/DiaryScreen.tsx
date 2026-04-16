import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import { BG_GRADIENT, GRADIENT_PRIMARY, GRADIENT_WARM, COLOR, GLASS, ORB } from '../config/theme';

const { width } = Dimensions.get('window');

interface DiaryEntry {
    id: string;
    title: string;
    content: string;
    mood_rating: number;
    tags: string[];
    entry_date: string;
    created_at: string;
}

const MOOD_EMOJIS = ['😢', '😟', '😐', '🙂', '😊'];
const MOOD_LABELS = ['Very Low', 'Low', 'Neutral', 'Good', 'Great'];
const MOOD_COLORS = ['#EF4444', '#F97316', '#FBBF24', '#34D399', '#10B981'];

const COMMON_TAGS = ['#grateful', '#anxious', '#hopeful', '#tired', '#excited', '#calm', '#overwhelmed', '#proud'];

export default function DiaryScreen({ navigation }: any) {
    const { user } = useAuth();
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [showNewEntry, setShowNewEntry] = useState(false);
    const [showViewEntry, setShowViewEntry] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
    const [selectedDate, setSelectedDate] = useState('');

    // New entry form state
    const [entryTitle, setEntryTitle] = useState('');
    const [entryContent, setEntryContent] = useState('');
    const [entryMood, setEntryMood] = useState(3);
    const [entryTags, setEntryTags] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadEntries();
    }, [currentMonth]);

    const loadEntries = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
            const startDate = firstDay.toISOString().split('T')[0];
            const endDate = lastDay.toISOString().split('T')[0];
            const response = await api.get(`/diary-entries-by-date/${user.id}?start_date=${startDate}&end_date=${endDate}`);
            if (response.data.entries) {
                setEntries(response.data.entries);
            }
        } catch (error) {
            console.error('Error loading diary entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEntry = async () => {
        if (!entryTitle.trim() || !entryContent.trim()) {
            Alert.alert('Missing Info', 'Please add a title and content for your entry.');
            return;
        }
        setSaving(true);
        try {
            await api.post('/create-diary-entry', {
                user_id: user?.id,
                title: entryTitle,
                content: entryContent,
                mood_rating: entryMood,
                tags: entryTags,
                entry_date: selectedDate || new Date().toISOString().split('T')[0],
            });
            setShowNewEntry(false);
            resetForm();
            await loadEntries();
            Alert.alert('✨ Saved!', 'Your diary entry has been saved.');
        } catch (error) {
            Alert.alert('Error', 'Could not save your entry. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEntry = async (entryId: string) => {
        Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/diary-entry/${entryId}?user_id=${user?.id}`);
                        setShowViewEntry(false);
                        await loadEntries();
                    } catch {
                        Alert.alert('Error', 'Could not delete entry.');
                    }
                },
            },
        ]);
    };

    const resetForm = () => {
        setEntryTitle('');
        setEntryContent('');
        setEntryMood(3);
        setEntryTags([]);
        setSelectedDate('');
    };

    const toggleTag = (tag: string) => {
        setEntryTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    // Calendar helpers
    const getDaysInMonth = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        return { firstDay, daysInMonth };
    };

    const getEntriesForDay = (day: number) => {
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return entries.filter(e => e.entry_date === dateStr);
    };

    const handleDayPress = (day: number) => {
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Block future dates
        if (dateStr > todayStr) {
            Alert.alert('Future Date', 'You can only write diary entries for today or past dates.');
            return;
        }

        const dayEntries = getEntriesForDay(day);
        if (dayEntries.length > 0) {
            setSelectedEntry(dayEntries[0]);
            setShowViewEntry(true);
        } else {
            setSelectedDate(dateStr);
            resetForm();
            setShowNewEntry(true);
        }
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const { firstDay, daysInMonth } = getDaysInMonth();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    return (
        <View style={styles.container}>
            <LinearGradient colors={BG_GRADIENT} style={styles.bg} />
            <View style={[styles.orb, { backgroundColor: ORB.pink, top: 80, right: -60 }]} />
            <View style={[styles.orb, { backgroundColor: ORB.purple, bottom: 200, left: -60 }]} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
                    <View style={styles.titleRow}>
                        <View style={styles.iconBox}>
                            <Ionicons name="book" size={22} color={COLOR.pink400} />
                        </View>
                        <View>
                            <Text style={styles.pageTitle}>Personal Diary</Text>
                            <Text style={styles.pageSubtitle}>Your private space for thoughts & feelings</Text>
                        </View>
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNum}>{entries.length}</Text>
                        <Text style={styles.statLbl}>This Month</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNum}>
                            {entries.length > 0 ? (entries.reduce((s, e) => s + e.mood_rating, 0) / entries.length).toFixed(1) : '—'}
                        </Text>
                        <Text style={styles.statLbl}>Avg Mood</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.newEntryBtn]}
                        onPress={() => {
                            // Block if today already has an entry
                            const todayEntries = entries.filter(e => e.entry_date === todayStr);
                            if (todayEntries.length > 0) {
                                setSelectedEntry(todayEntries[0]);
                                setShowViewEntry(true);
                            } else {
                                resetForm();
                                setSelectedDate(todayStr);
                                setShowNewEntry(true);
                            }
                        }}
                    >
                        <LinearGradient colors={GRADIENT_WARM} style={styles.newEntryGrad}>
                            <Ionicons name="add" size={18} color="white" />
                            <Text style={styles.newEntryText}>New</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Calendar */}
                <View style={styles.calendarCard}>
                    {/* Month Nav */}
                    <View style={styles.calendarHeader}>
                        <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                            <Ionicons name="chevron-back" size={24} color={COLOR.purple500} />
                        </TouchableOpacity>
                        <Text style={styles.monthLabel}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</Text>
                        <TouchableOpacity
                            onPress={() => {
                                const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
                                if (next.getFullYear() < today.getFullYear() ||
                                    (next.getFullYear() === today.getFullYear() && next.getMonth() <= today.getMonth())) {
                                    setCurrentMonth(next);
                                }
                            }}
                        >
                            <Ionicons name="chevron-forward" size={24} color={COLOR.purple500} />
                        </TouchableOpacity>
                    </View>

                    {/* Day labels */}
                    <View style={styles.dayLabels}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <Text key={d} style={styles.dayLabel}>{d}</Text>
                        ))}
                    </View>

                    {/* Grid */}
                    <View style={styles.grid}>
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <View key={`empty-${i}`} style={styles.dayCell} />
                        ))}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                            const dayEntries = getEntriesForDay(day);
                            const hasEntry = dayEntries.length > 0;
                            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isToday = dateStr === todayStr;
                            const moodColor = hasEntry ? MOOD_COLORS[dayEntries[0].mood_rating - 1] : undefined;
                            return (
                                <TouchableOpacity key={day} style={styles.dayCell} onPress={() => handleDayPress(day)}>
                                    <View style={[
                                        styles.dayInner,
                                        isToday && styles.todayCell,
                                        hasEntry && { backgroundColor: (moodColor ?? '#8B5CF6') + '30', borderColor: moodColor ?? '#8B5CF6', borderWidth: 1 },
                                    ]}>
                                        <Text style={[styles.dayNum, isToday && styles.todayNum, hasEntry && { color: moodColor }]}>{day}</Text>
                                        {hasEntry && <Text style={styles.entryDot}>{MOOD_EMOJIS[dayEntries[0].mood_rating - 1]}</Text>}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Recent Entries */}
                {entries.length > 0 && (
                    <View style={styles.recentSection}>
                        <Text style={styles.recentTitle}>Recent Entries</Text>
                        {entries.slice(0, 5).map(entry => (
                            <TouchableOpacity key={entry.id} style={styles.entryCard} onPress={() => { setSelectedEntry(entry); setShowViewEntry(true); }}>
                                <View style={styles.entryMoodBadge}>
                                    <Text style={styles.entryMoodEmoji}>{MOOD_EMOJIS[entry.mood_rating - 1]}</Text>
                                </View>
                                <View style={styles.entryInfo}>
                                    <Text style={styles.entryTitle} numberOfLines={1}>{entry.title}</Text>
                                    <Text style={styles.entryDate}>{new Date(entry.entry_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                                    <Text style={styles.entryPreview} numberOfLines={2}>{entry.content}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* ─── New Entry Modal ─── */}
            <Modal visible={showNewEntry} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalSheet}>
                            <LinearGradient colors={['#1a0b2e', '#0f0619']} style={StyleSheet.absoluteFill} />
                            <View style={styles.modalHandle} />
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.modalTitle}>New Entry ✨</Text>
                                {selectedDate ? <Text style={styles.modalDate}>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text> : null}

                                {/* Mood Selector */}
                                <Text style={styles.fieldLabel}>How are you feeling?</Text>
                                <View style={styles.moodRow}>
                                    {MOOD_EMOJIS.map((emoji, i) => (
                                        <TouchableOpacity key={i} style={[styles.moodBtn, entryMood === i + 1 && { borderColor: MOOD_COLORS[i], borderWidth: 2, backgroundColor: MOOD_COLORS[i] + '20' }]} onPress={() => setEntryMood(i + 1)}>
                                            <Text style={styles.moodEmoji}>{emoji}</Text>
                                            <Text style={[styles.moodLbl, { color: MOOD_COLORS[i] }]}>{MOOD_LABELS[i]}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Title */}
                                <Text style={styles.fieldLabel}>Title</Text>
                                <TextInput
                                    style={styles.titleInput}
                                    placeholder="Give your entry a title..."
                                    placeholderTextColor="#6B7280"
                                    value={entryTitle}
                                    onChangeText={setEntryTitle}
                                />

                                {/* Content */}
                                <Text style={styles.fieldLabel}>What's on your mind?</Text>
                                <TextInput
                                    style={styles.contentInput}
                                    placeholder="Write freely — this is your safe space..."
                                    placeholderTextColor="#6B7280"
                                    value={entryContent}
                                    onChangeText={setEntryContent}
                                    multiline
                                    textAlignVertical="top"
                                />

                                {/* Tags */}
                                <Text style={styles.fieldLabel}>Tags</Text>
                                <View style={styles.tagsRow}>
                                    {COMMON_TAGS.map(tag => (
                                        <TouchableOpacity key={tag} style={[styles.tag, entryTags.includes(tag) && styles.tagActive]} onPress={() => toggleTag(tag)}>
                                            <Text style={[styles.tagText, entryTags.includes(tag) && styles.tagTextActive]}>{tag}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Buttons */}
                                <View style={styles.modalBtns}>
                                    <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowNewEntry(false); resetForm(); }}>
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEntry} disabled={saving}>
                                        <LinearGradient colors={GRADIENT_PRIMARY} style={styles.saveBtnGrad}>
                                            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Entry'}</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* ─── View Entry Modal ─── */}
            <Modal visible={showViewEntry} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <LinearGradient colors={['#1a0b2e', '#0f0619']} style={StyleSheet.absoluteFill} />
                        <View style={styles.modalHandle} />
                        {selectedEntry && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.viewEntryHeader}>
                                    <Text style={styles.viewMoodEmoji}>{MOOD_EMOJIS[selectedEntry.mood_rating - 1]}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.viewEntryTitle}>{selectedEntry.title}</Text>
                                        <Text style={styles.viewEntryDate}>{new Date(selectedEntry.entry_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                                        <Text style={[styles.viewMoodLabel, { color: MOOD_COLORS[selectedEntry.mood_rating - 1] }]}>{MOOD_LABELS[selectedEntry.mood_rating - 1]}</Text>
                                    </View>
                                </View>
                                <Text style={styles.viewContent}>{selectedEntry.content}</Text>
                                {selectedEntry.tags?.length > 0 && (
                                    <View style={styles.tagsRow}>
                                        {selectedEntry.tags.map(tag => (
                                            <View key={tag} style={styles.tagActive}><Text style={styles.tagTextActive}>{tag}</Text></View>
                                        ))}
                                    </View>
                                )}
                                <View style={styles.modalBtns}>
                                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowViewEntry(false)}>
                                        <Text style={styles.cancelBtnText}>Close</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.cancelBtn, { borderColor: '#EF4444' }]} onPress={() => handleDeleteEntry(selectedEntry.id)}>
                                        <Text style={[styles.cancelBtnText, { color: '#EF4444' }]}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const DAY_CELL_SIZE = (width - 48 - 12) / 7;

const styles = StyleSheet.create({
    container: { flex: 1 },
    bg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    orb: { position: 'absolute', width: 280, height: 280, borderRadius: 140 },
    scroll: { flex: 1 },
    content: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 100 },
    header: { marginBottom: 24, alignItems: 'center' },
    logo: { width: 50, height: 50, marginBottom: 16 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 44, height: 44, backgroundColor: 'rgba(244,114,182,0.15)', borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(244,114,182,0.3)' },
    pageTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    pageSubtitle: { fontSize: 13, color: COLOR.textFaint, marginTop: 2 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20, alignItems: 'center' },
    statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    statNum: { fontSize: 22, fontWeight: 'bold', color: COLOR.purple400, marginBottom: 2 },
    statLbl: { fontSize: 11, color: COLOR.textFaint, textTransform: 'uppercase', letterSpacing: 0.5 },
    newEntryBtn: { borderRadius: 14, overflow: 'hidden' },
    newEntryGrad: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18, gap: 6 },
    newEntryText: { color: 'white', fontWeight: '600', fontSize: 14 },
    calendarCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 24 },
    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    monthLabel: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    dayLabels: { flexDirection: 'row', marginBottom: 8 },
    dayLabel: { width: DAY_CELL_SIZE, textAlign: 'center', fontSize: 11, color: '#6B7280', fontWeight: '600' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: DAY_CELL_SIZE, height: DAY_CELL_SIZE + 4, padding: 2 },
    dayInner: { flex: 1, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    todayCell: { backgroundColor: 'rgba(139,92,246,0.25)', borderColor: '#8B5CF6', borderWidth: 1 },
    dayNum: { fontSize: 13, color: COLOR.textMuted, fontWeight: '500' },
    todayNum: { color: COLOR.purple400, fontWeight: '700' },
    entryDot: { fontSize: 10, marginTop: 1 },
    recentSection: { marginBottom: 16 },
    recentTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 12 },
    entryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 12 },
    entryMoodBadge: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    entryMoodEmoji: { fontSize: 22 },
    entryInfo: { flex: 1 },
    entryTitle: { fontSize: 15, fontWeight: '600', color: 'white', marginBottom: 2 },
    entryDate: { fontSize: 12, color: COLOR.purple400, marginBottom: 4 },
    entryPreview: { fontSize: 13, color: COLOR.textFaint, lineHeight: 18 },
    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
    modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: '90%', overflow: 'hidden' },
    modalHandle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 4 },
    modalDate: { fontSize: 14, color: COLOR.purple400, marginBottom: 20 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: COLOR.textMuted, marginBottom: 8, marginTop: 16 },
    moodRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    moodBtn: { flex: 1, minWidth: 55, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    moodEmoji: { fontSize: 22, marginBottom: 4 },
    moodLbl: { fontSize: 9, fontWeight: '600', textAlign: 'center' },
    titleInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 14, color: 'white', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    contentInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 14, color: 'white', fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: 140, lineHeight: 22 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    tagActive: { backgroundColor: 'rgba(139,92,246,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#8B5CF6' },
    tagText: { color: COLOR.textFaint, fontSize: 13 },
    tagTextActive: { color: COLOR.purple400, fontSize: 13, fontWeight: '600' },
    modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
    cancelBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    cancelBtnText: { color: COLOR.textMuted, fontWeight: '600' },
    saveBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
    saveBtnGrad: { padding: 14, alignItems: 'center' },
    saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
    viewEntryHeader: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 20 },
    viewMoodEmoji: { fontSize: 40 },
    viewEntryTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 4 },
    viewEntryDate: { fontSize: 13, color: COLOR.textFaint, marginBottom: 4 },
    viewMoodLabel: { fontSize: 13, fontWeight: '600' },
    viewContent: { fontSize: 16, color: COLOR.textMuted, lineHeight: 26, marginBottom: 16 },
});
