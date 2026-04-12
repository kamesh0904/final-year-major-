import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
    KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions, Image,
    Modal, Linking, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import { BG_GRADIENT, GRADIENT_PRIMARY, COLOR, ORB } from '../config/theme';

const { width, height } = Dimensions.get('window');
const TODAY = new Date().toISOString().slice(0, 10);

const CRISIS_LINES = [
    { name: 'AASRA',               number: '9820466626', emoji: '📞' },
    { name: 'Vandrevala Foundation',number: '18602662345', emoji: '💙' },
    { name: 'Emergency',           number: '112',         emoji: '🚨' },
];

const MOOD_EMOJI = ['','😞','😔','😐','🙂','😊','😄','😁','🤩','🥳','✨'];

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    feedback?: 'positive' | 'negative' | null; // thumbs state
}

export default function ChatScreen() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [profileType, setProfileType] = useState('General');
    const [gameStats, setGameStats] = useState('No recent games played.');
    const [sessionId] = useState(() => `${user?.id ?? 'anon'}_${Date.now()}`);
    const [todayMood, setTodayMood] = useState<number | null>(null);
    const [showCrisisSOS, setShowCrisisSOS] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // ─── Load profile + game stats + history on mount ────────────────────────
    useEffect(() => {
        if (!user?.id) return;
        loadUserProfile();
        loadGameStats();
        loadChatHistory();
    }, [user?.id]);

    useEffect(() => {
        if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    }, [messages]);

    // ─── Load user neurotype from Supabase profile ─────────────────────────
    const loadUserProfile = async () => {
        if (!user?.id) return;
        try {
            const { data } = await supabase
                .from('profiles')
                .select('primary_profile, secondary_profile')
                .eq('id', user.id)
                .single();
            if (data?.primary_profile) {
                setProfileType(data.primary_profile);
            }
        } catch (e) {
            console.log('Profile load silently failed:', e);
        }
    };

    // ─── Load recent game sessions as a summary string ─────────────────────
    const loadGameStats = async () => {
        if (!user?.id) return;
        try {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const { data } = await supabase
                .from('game_sessions')
                .select('game_name, score, created_at')
                .eq('user_id', user.id)
                .gte('created_at', sevenDaysAgo)
                .order('created_at', { ascending: false })
                .limit(5);
            if (data && data.length > 0) {
                const summary = data.map(g =>
                    `${g.game_name} (score: ${g.score})`
                ).join(', ');
                setGameStats(`Recent games played: ${summary}`);
            }
        } catch (e) {
            console.log('Game stats load silently failed:', e);
        }
    };

    // ─── Load persisted chat history from backend ─────────────────────────
    const loadChatHistory = async () => {
        if (!user?.id) return;
        try {
            const response = await api.get('/chat/history', {
                params: { user_id: user.id, limit: 20 }
            });
            if (response.data.messages && response.data.messages.length > 0) {
                const loaded: Message[] = response.data.messages.map((m: any) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    timestamp: new Date(m.created_at),
                    feedback: null,
                }));
                setMessages(loaded);
            }
        } catch (error) {
            // History endpoint not available — start fresh
            console.log('Chat history not loaded, starting fresh');
        }
    };

    // ─── Send message with FULL therapy context ─────────────────────────────
    const sendMessage = async () => {
        if (!inputText.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputText.trim(),
            timestamp: new Date(),
            feedback: null,
        };

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInputText('');
        setLoading(true);

        // Build history array for the API (last 10 turns to keep tokens low)
        const historyForApi = updatedMessages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
        }));

        try {
            const response = await api.post('/chat', {
                message: userMessage.content,
                history: historyForApi,
                profile: profileType,
                game_stats: gameStats,
                user_id: user?.id ?? null,
                session_id: sessionId,
                // Inject today's mood for extra AI context
                ...(todayMood ? { mood_today: todayMood } : {}),
            });

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.data.response,
                timestamp: new Date(),
                feedback: null,
            };

            setMessages(prev => [...prev, assistantMessage]);
            setIsOffline(false);
        } catch (error) {
            console.error('Error sending message:', error);
            setIsOffline(true);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: messages.length === 0
                    ? "I can't reach the server right now — you might be offline. Your last conversation is saved. Try again when you're back online."
                    : "I'm having a little trouble connecting. I'm still here — try again in a moment.",
                timestamp: new Date(),
                feedback: null,
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    // ─── Submit thumbs up/down feedback ────────────────────────────────────
    const sendFeedback = async (assistantMsgId: string, rating: 'positive' | 'negative') => {
        // Optimistically update UI
        setMessages(prev => prev.map(m =>
            m.id === assistantMsgId ? { ...m, feedback: rating } : m
        ));

        // Find the user message that preceded this AI response
        const msgIndex = messages.findIndex(m => m.id === assistantMsgId);
        const userMsg = messages.slice(0, msgIndex).reverse().find(m => m.role === 'user');
        const aiMsg = messages.find(m => m.id === assistantMsgId);

        if (!aiMsg || !userMsg || !user?.id) return;

        try {
            await api.post('/chat/feedback', {
                message_id: assistantMsgId,
                user_id: user.id,
                rating,
                user_message: userMsg.content,
                ai_response: aiMsg.content,
                profile: profileType,
            });
        } catch (e) {
            console.log('Feedback save failed silently');
        }
    };

    const clearMessages = () => setMessages([]);

    // ─── Render each message ────────────────────────────────────────────────
    const renderMessage = ({ item }: { item: Message }) => (
        <View style={[
            styles.messageContainer,
            item.role === 'user' ? styles.userMessageContainer : styles.assistantMessageContainer
        ]}>
            {/* Avatar */}
            <View style={[
                styles.avatar,
                item.role === 'user' ? styles.userAvatar : styles.assistantAvatar
            ]}>
                <Ionicons
                    name={item.role === 'user' ? 'person' : 'sparkles'}
                    size={16}
                    color="white"
                />
            </View>

            {/* Bubble + Feedback */}
            <View style={styles.bubbleColumn}>
                <View style={[
                    styles.messageBubble,
                    item.role === 'user' ? styles.userBubble : styles.assistantBubble
                ]}>
                    {item.role === 'assistant' ? (
                        <View style={styles.assistantBubbleContent}>
                            <Text style={styles.assistantMessageText}>{item.content}</Text>
                        </View>
                    ) : (
                        <LinearGradient
                            colors={GRADIENT_PRIMARY}
                            style={styles.userBubbleGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.userMessageText}>{item.content}</Text>
                        </LinearGradient>
                    )}
                </View>

                {/* Thumbs up/down — only for AI messages */}
                {item.role === 'assistant' && (
                    <View style={styles.feedbackRow}>
                        <TouchableOpacity
                            onPress={() => sendFeedback(item.id, 'positive')}
                            style={[styles.feedbackBtn, item.feedback === 'positive' && styles.feedbackBtnActive]}
                            disabled={item.feedback !== null && item.feedback !== undefined}
                        >
                            <Ionicons
                                name={item.feedback === 'positive' ? 'thumbs-up' : 'thumbs-up-outline'}
                                size={13}
                                color={item.feedback === 'positive' ? '#6EE7B7' : 'rgba(156,163,175,0.5)'}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => sendFeedback(item.id, 'negative')}
                            style={[styles.feedbackBtn, item.feedback === 'negative' && styles.feedbackBtnNeg]}
                            disabled={item.feedback !== null && item.feedback !== undefined}
                        >
                            <Ionicons
                                name={item.feedback === 'negative' ? 'thumbs-down' : 'thumbs-down-outline'}
                                size={13}
                                color={item.feedback === 'negative' ? '#FCA5A5' : 'rgba(156,163,175,0.5)'}
                            />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
                <Ionicons name={'brain' as any} size={24} color="#A855F7" />
            </View>
            <Text style={styles.emptyTitle}>Your safe space for conversation</Text>
            <Text style={styles.emptySubtitle}>
                I'm aware of your {profileType} profile,{'\n'}your diary, and your recent games.{'\n'}Share anything on your mind.
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0a0514', '#1a0b2e', '#0f0619'] as const} style={styles.backgroundGradient} />
            <View style={[styles.floatingElement, styles.floatingElement1]} />
            <View style={[styles.floatingElement, styles.floatingElement2]} />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
                </View>

                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <LinearGradient colors={GRADIENT_PRIMARY} style={styles.headerAvatar}>
                            <Ionicons name="sparkles" size={20} color="white" />
                        </LinearGradient>
                        <View style={styles.headerInfo}>
                            <Text style={styles.headerTitle}>Neuro-Companion</Text>
                            <View style={styles.statusContainer}>
                                <View style={[styles.statusDot, isOffline && { backgroundColor: '#EF4444' }]} />
                                <Text style={[styles.statusText, isOffline && { color: '#EF4444' }]}>
                                    {isOffline ? 'Offline' : `Online • ${profileType} Mode`}
                                    {todayMood && !isOffline ? `  ${MOOD_EMOJI[todayMood]}` : ''}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.headerActions}>
                        {/* SOS Button */}
                        <TouchableOpacity onPress={() => setShowCrisisSOS(true)} style={styles.sosBtn}>
                            <Text style={styles.sosBtnText}>SOS</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.clearButton} onPress={clearMessages}>
                            <Ionicons name="refresh" size={16} color="rgba(156, 163, 175, 1)" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Crisis SOS Modal */}
                <Modal visible={showCrisisSOS} transparent animationType="fade">
                    <View style={styles.sosOverlay}>
                        <View style={styles.sosModal}>
                            <Text style={styles.sosTitle}>🆘 Crisis Support</Text>
                            <Text style={styles.sosSubtitle}>You are not alone. Reach out now:</Text>
                            {CRISIS_LINES.map(line => (
                                <TouchableOpacity
                                    key={line.number}
                                    onPress={() => Linking.openURL(`tel:${line.number}`)}
                                    style={styles.sosLine}
                                >
                                    <Text style={styles.sosLineEmoji}>{line.emoji}</Text>
                                    <View style={styles.sosLineInfo}>
                                        <Text style={styles.sosLineName}>{line.name}</Text>
                                        <Text style={styles.sosLineNum}>{line.number}</Text>
                                    </View>
                                    <Ionicons name="call" size={20} color="#6EE7B7" />
                                </TouchableOpacity>
                            ))}
                            <Text style={styles.sosSafeMsg}>
                                Please stay safe. Your life matters. This moment will pass.
                            </Text>
                            <TouchableOpacity onPress={() => setShowCrisisSOS(false)} style={styles.sosClose}>
                                <Text style={styles.sosCloseText}>I'm safe for now</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Messages */}
                <View style={styles.messagesContainer}>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.messagesList}
                        ListEmptyComponent={renderEmptyState}
                        showsVerticalScrollIndicator={false}
                    />

                    {loading && (
                        <View style={styles.loadingContainer}>
                            <View style={styles.loadingMessage}>
                                <View style={styles.assistantAvatar}>
                                    <ActivityIndicator size="small" color="white" />
                                </View>
                                <View style={styles.loadingBubble}>
                                    <Text style={styles.loadingText}>Thinking gently...</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Input */}
                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Share your thoughts..."
                            placeholderTextColor="rgba(156, 163, 175, 0.7)"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                            returnKeyType="send"
                            blurOnSubmit={false}
                            onSubmitEditing={sendMessage}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
                            onPress={sendMessage}
                            disabled={!inputText.trim() || loading}
                        >
                            <LinearGradient colors={GRADIENT_PRIMARY} style={styles.sendButtonGradient}>
                                <Ionicons name="send" size={20} color="white" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.inputHint}>
                        👍 Rate responses to train a better therapy model
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    backgroundGradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    floatingElement: { position: 'absolute', borderRadius: 200 },
    floatingElement1: { width: 384, height: 384, backgroundColor: ORB.purple, top: height * 0.33, right: width * 0.25 },
    floatingElement2: { width: 320, height: 320, backgroundColor: ORB.indigo, bottom: height * 0.33, left: width * 0.25 },
    keyboardView: { flex: 1 },
    logoContainer: { alignItems: 'center', paddingTop: 60, paddingBottom: 8 },
    logo: { width: 50, height: 50 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingHorizontal: 24, paddingBottom: 16, backgroundColor: 'rgba(0,0,0,0.2)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
    headerContent: { flexDirection: 'row', alignItems: 'center' },
    headerAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 4 },
    statusContainer: { flexDirection: 'row', alignItems: 'center' },
    statusDot: { width: 8, height: 8, backgroundColor: '#10B981', borderRadius: 4, marginRight: 8 },
    statusText: { fontSize: 12, color: '#10B981', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 },
    clearButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
    messagesContainer: { flex: 1 },
    messagesList: { padding: 24, flexGrow: 1 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
    emptyIcon: { width: 64, height: 64, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 16, color: 'rgba(156,163,175,1)', textAlign: 'center', marginBottom: 8 },
    emptySubtitle: { fontSize: 13, color: 'rgba(156,163,175,0.6)', textAlign: 'center', lineHeight: 20 },
    messageContainer: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-end' },
    userMessageContainer: { flexDirection: 'row-reverse' },
    assistantMessageContainer: { flexDirection: 'row' },
    avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
    userAvatar: { backgroundColor: 'transparent' },
    assistantAvatar: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    bubbleColumn: { maxWidth: '80%', gap: 4 },
    messageBubble: { borderRadius: 16, overflow: 'hidden' },
    userBubble: { borderTopRightRadius: 4 },
    assistantBubble: { borderTopLeftRadius: 4 },
    userBubbleGradient: { paddingHorizontal: 16, paddingVertical: 12 },
    assistantBubbleContent: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 12 },
    userMessageText: { color: 'white', fontSize: 16, lineHeight: 22 },
    assistantMessageText: { color: 'rgba(229,231,235,1)', fontSize: 16, lineHeight: 22 },
    // Feedback
    feedbackRow: { flexDirection: 'row', gap: 6, paddingLeft: 4 },
    feedbackBtn: { padding: 5, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    feedbackBtnActive: { backgroundColor: 'rgba(110,231,183,0.12)', borderColor: 'rgba(110,231,183,0.3)' },
    feedbackBtnNeg: { backgroundColor: 'rgba(252,165,165,0.12)', borderColor: 'rgba(252,165,165,0.3)' },
    // Loading
    loadingContainer: { paddingHorizontal: 24, paddingBottom: 16 },
    loadingMessage: { flexDirection: 'row', alignItems: 'flex-end' },
    loadingBubble: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderTopLeftRadius: 4, marginLeft: 8 },
    loadingText: { color: 'rgba(209,213,219,1)', fontSize: 14 },
    // Input
    inputContainer: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: 'rgba(0,0,0,0.2)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
    input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: 'white', maxHeight: 100, marginRight: 12 },
    sendButton: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
    sendButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    sendButtonDisabled: { opacity: 0.5 },
    inputHint: { fontSize: 11, color: 'rgba(156,163,175,0.7)', textAlign: 'center', lineHeight: 16 },
    // Header actions
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sosBtn: { backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(239,68,68,0.5)' },
    sosBtnText: { color: '#FCA5A5', fontWeight: 'bold', fontSize: 12 },
    // SOS modal
    sosOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    sosModal: { backgroundColor: '#14101E', borderRadius: 24, padding: 24, width: '100%', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', gap: 12 },
    sosTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
    sosSubtitle: { color: 'rgba(156,163,175,0.8)', fontSize: 14, textAlign: 'center' },
    sosLine: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(110,231,183,0.2)', gap: 12 },
    sosLineEmoji: { fontSize: 24 },
    sosLineInfo: { flex: 1 },
    sosLineName: { color: 'white', fontWeight: '700', fontSize: 14 },
    sosLineNum: { color: '#6EE7B7', fontSize: 13, marginTop: 2 },
    sosSafeMsg: { color: 'rgba(156,163,175,0.6)', fontSize: 13, textAlign: 'center', lineHeight: 20, fontStyle: 'italic' },
    sosClose: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    sosCloseText: { color: 'rgba(156,163,175,0.8)', fontWeight: '600', fontSize: 15 },
});