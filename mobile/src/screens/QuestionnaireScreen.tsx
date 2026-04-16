import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { saveNeuroProfileResult } from '../utils/neuroProfile';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BG_GRADIENT, GRADIENT_PRIMARY } from '../config/theme';

const { width } = Dimensions.get('window');

// Same 25 questions as the website — domain hidden from user
const QUESTIONS = [
    { id: 1, domain: 'ADHD', text: "Do you struggle to stay focused on tasks that don't interest you, even when they're important?" },
    { id: 2, domain: 'ADHD', text: "Do you often start multiple projects but find it difficult to complete them?" },
    { id: 3, domain: 'ADHD', text: "Do you tend to act or speak before thinking things through?" },
    { id: 4, domain: 'ADHD', text: "Do you feel mentally restless, even when your body is still?" },
    { id: 5, domain: 'ADHD', text: "Do you have trouble keeping track of time or remembering deadlines?" },
    { id: 6, domain: 'OCD', text: "Do you feel an uncontrollable urge to check things repeatedly (like locks, switches, or messages)?" },
    { id: 7, domain: 'OCD', text: "Do certain thoughts get stuck in your mind even when you try hard to ignore them?" },
    { id: 8, domain: 'OCD', text: "Do you perform certain actions (like washing, counting, or arranging) to reduce anxiety?" },
    { id: 9, domain: 'OCD', text: "Do you feel intense discomfort when things aren't done the right way or placed symmetrically?" },
    { id: 10, domain: 'OCD', text: "Does your daily life or routine get disrupted because of repetitive thoughts or behaviors?" },
    { id: 11, domain: 'Autism', text: "Do you find social interactions confusing or exhausting?" },
    { id: 12, domain: 'Autism', text: "Do you prefer following specific routines and feel distressed when they change unexpectedly?" },
    { id: 13, domain: 'Autism', text: "Do you often notice small details or patterns that others seem to miss?" },
    { id: 14, domain: 'Autism', text: "Do you feel overwhelmed by loud noises, bright lights, or certain textures?" },
    { id: 15, domain: 'Autism', text: "Do you have one or more interests that you can talk or think about for hours without getting bored?" },
    { id: 16, domain: 'Anxiety', text: "Do you often worry about future events, even when there's no clear reason?" },
    { id: 17, domain: 'Anxiety', text: "Do you find it hard to relax, even during your free time?" },
    { id: 18, domain: 'Anxiety', text: "Do you overthink small mistakes or social situations long after they happen?" },
    { id: 19, domain: 'Anxiety', text: "Do you experience physical symptoms (like a racing heart or tense muscles) when you feel anxious?" },
    { id: 20, domain: 'Anxiety', text: "Do you frequently feel like something bad might happen, even when things are going well?" },
    { id: 21, domain: 'Depression', text: "Do you often feel drained or unmotivated, even when you've had enough rest?" },
    { id: 22, domain: 'Depression', text: "Do you lose interest in activities you once enjoyed?" },
    { id: 23, domain: 'Depression', text: "Do your emotions shift quickly or feel more intense than others seem to experience?" },
    { id: 24, domain: 'Depression', text: "Do you sometimes feel disconnected from yourself or your surroundings?" },
    { id: 25, domain: 'Depression', text: "Do you struggle to find joy or purpose in daily life?" },
];

// Same options as website
const OPTIONS = [
    { label: 'Never', value: 1 },
    { label: 'Rarely', value: 2 },
    { label: 'Sometimes', value: 3 },
    { label: 'Often', value: 4 },
    { label: 'Always', value: 5 },
];

export default function QuestionnaireScreen({ navigation }: any) {
    const { user } = useAuth();
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(false);
    const [currentQ, setCurrentQ] = useState(0);

    const q = QUESTIONS[currentQ];
    const progress = (currentQ + 1) / QUESTIONS.length;
    const currentAnswer = answers[q.id];

    const handleSelect = (value: number) => {
        setAnswers(prev => ({ ...prev, [q.id]: value }));
    };

    const handleNext = () => {
        if (currentQ < QUESTIONS.length - 1) {
            setCurrentQ(i => i + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentQ > 0) setCurrentQ(i => i - 1);
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < QUESTIONS.length) {
            Alert.alert('Incomplete', 'Please answer all questions before continuing.');
            return;
        }
        setLoading(true);
        try {
            // Calculate domain scores (same logic as website)
            const scores = { ADHD: 0, OCD: 0, Autism: 0, Anxiety: 0, Depression: 0 };
            Object.entries(answers).forEach(([qId, val]) => {
                const id = parseInt(qId);
                if (id >= 1 && id <= 5) scores.ADHD += val;
                else if (id >= 6 && id <= 10) scores.OCD += val;
                else if (id >= 11 && id <= 15) scores.Autism += val;
                else if (id >= 16 && id <= 20) scores.Anxiety += val;
                else if (id >= 21 && id <= 25) scores.Depression += val;
            });

            const maxScore = Math.max(...Object.values(scores));
            const primaryProfile = (Object.keys(scores) as (keyof typeof scores)[])
                .find(k => scores[k] === maxScore) || 'General';
            const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
            const secondaryProfile = sorted[1]?.[0] || null;

            if (user?.id) {
                const { error } = await supabase.from('profiles').upsert({
                    id: user.id,
                    profile_type: primaryProfile,
                    primary_profile: primaryProfile,
                    secondary_profile: secondaryProfile,
                    scores,
                    questionnaire_completed: true,
                    traits: ['New User'],
                    xp: 0,
                    level: 1,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' });

                if (error) {
                    console.error('Supabase upsert error:', error);
                }

                // Immediately save locally so Dashboard picks it up reliably
                await saveNeuroProfileResult(user.id, {
                    primaryProfile,
                    secondaryProfile,
                    categoryScores: scores,
                    questionnaireCompleted: true
                });
            }

            const scoreDetails = `ADHD: ${scores.ADHD}  |  OCD: ${scores.OCD}\nAutism: ${scores.Autism}  |  Anxiety: ${scores.Anxiety}\nDepression: ${scores.Depression}`;
            
            Alert.alert(
                'Assessment Complete ✨',
                `Primary Profile: ${primaryProfile}\n\nScores Breakdown:\n${scoreDetails}\n\nYour experience is now personalised. Welcome to NeuroNest.`,
                [{ text: 'Start My Journey', onPress: () => navigation.replace('Main') }]
            );
        } catch (error) {
            console.error('Questionnaire submit error:', error);
            navigation.replace('Main');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={s.container}>
            <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
            <View style={[s.orb, { top: -60, right: -60, backgroundColor: 'rgba(139,92,246,0.08)', width: 220, height: 220 }]} />
            <View style={[s.orb, { bottom: 80, left: -80, backgroundColor: 'rgba(99,102,241,0.06)', width: 260, height: 260 }]} />

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                    <View style={s.headerCenter}>
                        <Text style={s.headerTitle}>Initial Assessment</Text>
                        <Text style={s.headerSub}>Question {currentQ + 1} of {QUESTIONS.length}</Text>
                    </View>
                    <View style={{ width: 38 }} />
                </View>

                {/* Progress bar */}
                <View style={s.progressTrack}>
                    <LinearGradient
                        colors={['#6366F1', '#A855F7']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={[s.progressFill, { width: `${progress * 100}%` }]}
                    />
                </View>
                <Text style={s.progressPct}>{Math.round(progress * 100)}% complete</Text>

                {/* Question card */}
                <View style={s.questionCard}>
                    <Text style={s.questionText}>{q.text}</Text>
                </View>

                {/* Options */}
                <View style={s.optionsContainer}>
                    {OPTIONS.map(opt => {
                        const isSelected = currentAnswer === opt.value;
                        return (
                            <TouchableOpacity
                                key={opt.value}
                                style={[s.optionBtn, isSelected && s.optionBtnSelected]}
                                onPress={() => handleSelect(opt.value)}
                                activeOpacity={0.8}
                            >
                                {isSelected && (
                                    <LinearGradient
                                        colors={['rgba(99,102,241,0.3)', 'rgba(168,85,247,0.2)']}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        style={StyleSheet.absoluteFill}
                                    />
                                )}
                                <View style={[s.optionDot, isSelected && s.optionDotSelected]}>
                                    {isSelected && <Ionicons name="checkmark" size={12} color="white" />}
                                </View>
                                <Text style={[s.optionText, isSelected && s.optionTextSelected]}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Navigation */}
                <View style={s.navRow}>
                    <TouchableOpacity
                        style={[s.backNavBtn, currentQ === 0 && { opacity: 0 }]}
                        onPress={handleBack}
                        disabled={currentQ === 0}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.6)" />
                        <Text style={s.backNavText}>Back</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[s.nextBtn, !currentAnswer && s.nextBtnDisabled]}
                        onPress={handleNext}
                        disabled={!currentAnswer || loading}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={GRADIENT_PRIMARY}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={s.nextBtnGrad}
                        >
                            <Text style={s.nextBtnText}>
                                {loading ? 'Saving...' : currentQ < QUESTIONS.length - 1 ? 'Next' : 'Complete'}
                            </Text>
                            <Ionicons
                                name={currentQ < QUESTIONS.length - 1 ? 'arrow-forward' : 'checkmark-circle'}
                                size={18} color="white"
                            />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <Text style={s.disclaimer}>
                    This assessment helps personalise your experience. It is not a clinical diagnosis.
                </Text>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    orb: { position: 'absolute', borderRadius: 999 },
    scroll: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 60 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    backBtn: { width: 38, height: 38, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    headerCenter: { alignItems: 'center' },
    headerTitle: { color: 'white', fontWeight: '700', fontSize: 17 },
    headerSub: { color: 'rgba(156,163,175,1)', fontSize: 12, marginTop: 2 },
    progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
    progressFill: { height: '100%', borderRadius: 3 },
    progressPct: { color: 'rgba(156,163,175,0.7)', fontSize: 11, textAlign: 'right', marginBottom: 20 },
    questionCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', marginBottom: 20 },
    questionText: { color: 'white', fontSize: 18, fontWeight: '700', lineHeight: 28 },
    optionsContainer: { gap: 10, marginBottom: 24 },
    optionBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
    optionBtnSelected: { borderColor: 'rgba(99,102,241,0.6)', borderWidth: 1.5 },
    optionDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    optionDotSelected: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
    optionText: { color: 'rgba(209,213,219,1)', fontSize: 15, flex: 1 },
    optionTextSelected: { color: 'white', fontWeight: '600' },
    navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    backNavBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    backNavText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
    nextBtn: { borderRadius: 14, overflow: 'hidden', shadowColor: '#6366F1', shadowOpacity: 0.4, shadowRadius: 10, elevation: 6, flex: 1, marginLeft: 12 },
    nextBtnDisabled: { opacity: 0.4 },
    nextBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
    nextBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },
    disclaimer: { color: 'rgba(156,163,175,0.5)', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
