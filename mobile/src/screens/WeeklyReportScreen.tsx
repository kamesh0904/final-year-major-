/**
 * WeeklyReportScreen
 * Fetches and displays the AI-generated weekly report from the backend.
 */
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';

const { width } = Dimensions.get('window');

interface WeeklyReport {
    clinical_observation?: string;
    key_achievement?: string;
    focus_area?: string;
    daily_observation?: string;
    key_moment?: string;
    generated_at?: string;
    report_type?: 'weekly' | 'daily';
}

export default function WeeklyReportScreen({ navigation }: any) {
    const { user } = useAuth();
    const [report, setReport] = useState<WeeklyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reportType, setReportType] = useState<'weekly' | 'daily'>('weekly');

    useEffect(() => {
        if (user?.id) loadReport('weekly');
    }, [user?.id]);

    const loadReport = async (type: 'weekly' | 'daily') => {
        setLoading(true);
        setError(null);
        setReportType(type);
        try {
            const endpoint = type === 'weekly' ? '/weekly-report' : '/daily-report';
            const response = await api.post(endpoint, {
                userId: user?.id,
                checkinData: { mood: 'Checked in today' },
            });
            setReport({ ...response.data, report_type: type });
        } catch (e: any) {
            if (e.response?.status === 429) {
                setError('Report generation is rate-limited (max 3/hour). Try again later.');
            } else {
                setError('Could not load your report right now. Make sure you have some game sessions and diary entries first.');
            }
        } finally {
            setLoading(false);
        }
    };

    const sections = report ? (reportType === 'weekly'
        ? [
            { icon: '🧠', title: 'Clinical Observation', content: report.clinical_observation, color: '#8B5CF6' },
            { icon: '🏆', title: 'Key Achievement',      content: report.key_achievement,      color: '#F59E0B' },
            { icon: '🎯', title: 'Focus for Next Week',  content: report.focus_area,           color: '#10B981' },
        ]
        : [
            { icon: '📋', title: "Today's Observation",  content: report.daily_observation, color: '#3B82F6' },
            { icon: '⭐', title: 'Key Moment',           content: report.key_moment,        color: '#F59E0B' },
            { icon: '🌅', title: 'Focus for Tomorrow',   content: report.focus_area,        color: '#10B981' },
        ]
    ) : [];

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0a0514', '#1a0b2e', '#0f0619']} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Therapy Report</Text>
                <View style={{ width: 38 }} />
            </View>

            {/* Toggle weekly / daily */}
            <View style={styles.toggleRow}>
                {(['weekly', 'daily'] as const).map(t => (
                    <TouchableOpacity
                        key={t}
                        onPress={() => loadReport(t)}
                        style={[styles.toggleBtn, reportType === t && styles.toggleBtnActive]}
                    >
                        <Text style={[styles.toggleText, reportType === t && styles.toggleTextActive]}>
                            {t === 'weekly' ? '📅 Weekly' : '🌤 Today'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {loading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color="#A855F7" />
                        <Text style={styles.loadingText}>Dr. Nexus is analyzing your week...</Text>
                        <Text style={styles.loadingHint}>This may take 15–20 seconds</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorEmoji}>⚠️</Text>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={() => loadReport(reportType)} style={styles.retryBtn}>
                            <Text style={styles.retryText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Report header */}
                        <View style={styles.reportBanner}>
                            <LinearGradient colors={['rgba(139,92,246,0.2)', 'rgba(168,85,247,0.05)']} style={styles.reportBannerGrad}>
                                <Text style={styles.bannerEmoji}>🤖</Text>
                                <Text style={styles.bannerTitle}>Dr. Nexus — NeuroNest AI</Text>
                                <Text style={styles.bannerSub}>
                                    {reportType === 'weekly' ? 'Weekly Clinical Synthesis' : "Today's Clinical Observation"}
                                </Text>
                                {report?.generated_at && (
                                    <Text style={styles.bannerDate}>
                                        Generated {new Date(report.generated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </Text>
                                )}
                            </LinearGradient>
                        </View>

                        {/* Report sections */}
                        {sections.map((sec, i) => sec.content ? (
                            <View key={i} style={styles.sectionCard}>
                                <LinearGradient
                                    colors={[sec.color + '14', 'transparent']}
                                    style={styles.sectionGrad}
                                >
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionEmoji}>{sec.icon}</Text>
                                        <Text style={[styles.sectionTitle, { color: sec.color }]}>{sec.title}</Text>
                                    </View>
                                    <Text style={styles.sectionContent}>{sec.content}</Text>
                                </LinearGradient>
                            </View>
                        ) : null)}

                        <TouchableOpacity onPress={() => loadReport(reportType)} style={styles.regenerateBtn}>
                            <Ionicons name="refresh" size={16} color="#A855F7" />
                            <Text style={styles.regenerateText}>Regenerate Report</Text>
                        </TouchableOpacity>
                        <Text style={styles.rateNote}>Rate limited to 3 reports/hour to manage AI costs.</Text>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
    backBtn: { width: 38, height: 38, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    toggleRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, gap: 10 },
    toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
    toggleBtnActive: { backgroundColor: 'rgba(139,92,246,0.2)', borderColor: '#8B5CF6' },
    toggleText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
    toggleTextActive: { color: '#A855F7' },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    loadingBox: { alignItems: 'center', paddingTop: 80, gap: 16 },
    loadingText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '600' },
    loadingHint: { color: '#6B7280', fontSize: 13 },
    errorBox: { alignItems: 'center', paddingTop: 80, gap: 16, paddingHorizontal: 20 },
    errorEmoji: { fontSize: 48 },
    errorText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', lineHeight: 20 },
    retryBtn: { backgroundColor: 'rgba(139,92,246,0.2)', borderRadius: 20, paddingHorizontal: 28, paddingVertical: 12, borderWidth: 1, borderColor: '#8B5CF6' },
    retryText: { color: '#A855F7', fontWeight: '700' },
    reportBanner: { borderRadius: 20, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' },
    reportBannerGrad: { padding: 20, alignItems: 'center', gap: 4 },
    bannerEmoji: { fontSize: 40, marginBottom: 6 },
    bannerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    bannerSub: { color: '#A855F7', fontSize: 13, fontWeight: '600' },
    bannerDate: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 },
    sectionCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    sectionGrad: { padding: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    sectionEmoji: { fontSize: 22 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold' },
    sectionContent: { color: 'rgba(229,231,235,0.85)', fontSize: 14, lineHeight: 22 },
    regenerateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(139,92,246,0.1)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)' },
    regenerateText: { color: '#A855F7', fontWeight: '700', fontSize: 15 },
    rateNote: { color: '#4B5563', fontSize: 11, textAlign: 'center', marginTop: 10 },
});
