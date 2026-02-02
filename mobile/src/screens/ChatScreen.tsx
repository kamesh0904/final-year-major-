import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api';

const { width, height } = Dimensions.get('window');

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function ChatScreen() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [profileType, setProfileType] = useState('General');
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadChatHistory();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    };

    const loadChatHistory = async () => {
        try {
            const response = await api.get('/chat/history');
            if (response.data.messages) {
                setMessages(response.data.messages);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputText.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText('');
        setLoading(true);

        try {
            const response = await api.post('/chat', {
                message: userMessage.content,
            });

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.data.response,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const clearMessages = () => {
        setMessages([]);
    };

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

            {/* Message Bubble */}
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
                        colors={['#8B5CF6', '#6366F1']}
                        style={styles.userBubbleGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.userMessageText}>{item.content}</Text>
                    </LinearGradient>
                )}
            </View>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
                <Ionicons name="brain" size={24} color="#A855F7" />
            </View>
            <Text style={styles.emptyTitle}>Your safe space for conversation</Text>
            <Text style={styles.emptySubtitle}>Share what's on your mind.</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#0a0514', '#1a0b2e', '#0f0619']}
                style={styles.backgroundGradient}
            />

            {/* Floating Background Elements */}
            <View style={[styles.floatingElement, styles.floatingElement1]} />
            <View style={[styles.floatingElement, styles.floatingElement2]} />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <LinearGradient
                            colors={['#A855F7', '#6366F1']}
                            style={styles.headerAvatar}
                        >
                            <Ionicons name="sparkles" size={20} color="white" />
                        </LinearGradient>
                        <View style={styles.headerInfo}>
                            <Text style={styles.headerTitle}>Neuro-Companion</Text>
                            <View style={styles.statusContainer}>
                                <View style={styles.statusDot} />
                                <Text style={styles.statusText}>Online • {profileType} Mode</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={clearMessages}
                    >
                        <Ionicons name="refresh" size={16} color="rgba(156, 163, 175, 1)" />
                    </TouchableOpacity>
                </View>

                {/* Messages Area */}
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

                {/* Input Area */}
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
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
                            onPress={sendMessage}
                            disabled={!inputText.trim() || loading}
                        >
                            <LinearGradient
                                colors={['#8B5CF6', '#6366F1']}
                                style={styles.sendButtonGradient}
                            >
                                <Ionicons name="send" size={20} color="white" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.inputHint}>
                        Your AI companion remembers your context. All conversations are private and secure.
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    floatingElement: {
        position: 'absolute',
        borderRadius: 200,
        opacity: 0.05,
    },
    floatingElement1: {
        width: 384,
        height: 384,
        backgroundColor: '#8B5CF6',
        top: height * 0.33,
        right: width * 0.25,
    },
    floatingElement2: {
        width: 320,
        height: 320,
        backgroundColor: '#6366F1',
        bottom: height * 0.33,
        left: width * 0.25,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        backgroundColor: '#10B981',
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    clearButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesList: {
        padding: 24,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyIcon: {
        width: 64,
        height: 64,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 16,
        color: 'rgba(156, 163, 175, 1)',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: 'rgba(156, 163, 175, 0.7)',
        textAlign: 'center',
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        alignItems: 'flex-end',
    },
    userMessageContainer: {
        flexDirection: 'row-reverse',
    },
    assistantMessageContainer: {
        flexDirection: 'row',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    userAvatar: {
        backgroundColor: 'transparent',
    },
    assistantAvatar: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    messageBubble: {
        maxWidth: '80%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    userBubble: {
        borderTopRightRadius: 4,
    },
    assistantBubble: {
        borderTopLeftRadius: 4,
    },
    userBubbleGradient: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    assistantBubbleContent: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    userMessageText: {
        color: 'white',
        fontSize: 16,
        lineHeight: 22,
    },
    assistantMessageText: {
        color: 'rgba(229, 231, 235, 1)',
        fontSize: 16,
        lineHeight: 22,
    },
    loadingContainer: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    loadingMessage: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    loadingBubble: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderTopLeftRadius: 4,
        marginLeft: 8,
    },
    loadingText: {
        color: 'rgba(209, 213, 219, 1)',
        fontSize: 14,
    },
    inputContainer: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 12,
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: 'white',
        maxHeight: 100,
        marginRight: 12,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
    },
    sendButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    inputHint: {
        fontSize: 12,
        color: 'rgba(156, 163, 175, 1)',
        textAlign: 'center',
        lineHeight: 16,
    },
});