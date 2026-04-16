/**
 * WeeklyReportScreen
 * Fetches and displays the AI-generated weekly report from the backend.
 */
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Dimensions, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
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

const getDatesForPastWeek = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push({ iso: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en-IN', { weekday: 'short' }) });
    }
    return dates;
};

const TRACKED_GAMES: Record<string, { label: string; color: string; unit: string; lowerIsBetter?: boolean }> = {
    'Chromatic Rush': { label: 'Focus Score', color: '#3B82F6', unit: 'pts' },
    'Impulse Guard': { label: 'Reaction Time', color: '#EF4444', unit: 'ms', lowerIsBetter: true },
    'Pattern Release': { label: 'Memory Accuracy', color: '#10B981', unit: 'pts' },
    'Order Shift': { label: 'Cognitive Reflex', color: '#8B5CF6', unit: 'pts' },
    'Calm Path': { label: 'Flow State', color: '#06B6D4', unit: 'pts' },
};

function buildWeeklyBarChart(days: string[], values: number[], color: string, label: string, unit: string) {
    const W = 480; const H = 140; const PAD = 40;
    const maxVal = Math.max(...values, 1);
    const barW = Math.floor((W - PAD * 2) / 7) - 6;

    const bars = values.map((s, i) => {
        const bh = Math.round(((s / maxVal) * (H - 40)));
        const x = PAD + i * (barW + 6);
        const y = H - 20 - bh;
        return `
      <rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="4" fill="${color}" opacity="0.85"/>
      <text x="${x + barW / 2}" y="${H - 4}" text-anchor="middle" font-size="10" fill="#9CA3AF">${days[i]}</text>
      ${s > 0 ? `<text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" font-size="10" fill="${color}">${s}</text>` : ''}`;
    }).join('');

    return `
    <div style="margin-bottom:24px;">
      <div style="font-size:13px;font-weight:700;color:#E5E7EB;margin-bottom:8px;">${label} <span style="color:#6B7280;font-weight:400;">(${unit})</span></div>
      <svg width="${W}" height="${H}" style="background:#111827;border-radius:12px;padding:4px;">
        ${bars}
        <line x1="${PAD}" y1="${H - 20}" x2="${W - PAD}" y2="${H - 20}" stroke="#374151" stroke-width="1"/>
      </svg>
    </div>`;
}

function buildWeeklyPdfHtml(username: string, weekDates: { label: string }[], moodData: number[], timeSpentData: number[], gameData: Record<string, number[]>) {
    const labels = weekDates.map(d => d.label);
    const moodChart = buildWeeklyBarChart(labels, moodData, '#A855F7', 'Average Daily Mood', 'out of 10');
    const timeChart = buildWeeklyBarChart(labels, timeSpentData, '#F59E0B', 'Daily Time Spent', 'mins');

    let gamesHtml = '';
    Object.keys(TRACKED_GAMES).forEach(game => {
        if (gameData[game] && gameData[game].some(s => s > 0)) {
            const cfg = TRACKED_GAMES[game];
            gamesHtml += `
            <div style="background:#1F2937;border-radius:16px;padding:20px;margin-bottom:20px;border-left:4px solid ${cfg.color};">
              <div style="font-size:16px;font-weight:700;color:#E5E7EB;margin-bottom:16px;">${game}</div>
              ${buildWeeklyBarChart(labels, gameData[game], cfg.color, cfg.label, cfg.unit)}
            </div>`;
        }
    });
    if (!gamesHtml) gamesHtml = `<div style="color:#6B7280;font-size:14px;text-align:center;padding:20px;">No games tracked this week.</div>`;

    return `<!DOCTYPE html>
<html><head><style> * { box-sizing: border-box; margin: 0; padding: 0; } body { background: #0F172A; color: #E5E7EB; font-family: sans-serif; padding: 32px 24px; } </style></head>
<body>
  <div style="display:flex;justify-content:space-between;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #1F2937;">
    <div><div style="font-size:22px;font-weight:800;color:#A855F7;">NeuroNest</div><div style="color:#6B7280;font-size:13px;margin-top:2px;">Weekly Analytics Report</div></div>
    <div style="text-align:right;"><div style="font-size:15px;font-weight:700;color:#E5E7EB;">${username}</div><div style="font-size:12px;color:#6B7280;">Past 7 Days</div></div>
  </div>
  ${moodChart}
  ${timeChart}
  <div style="font-size:16px;font-weight:700;color:#E5E7EB;margin-bottom:16px;margin-top:24px;">🎮 Game Performance Trends</div>
  ${gamesHtml}
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #1F2937;text-align:center;font-size:11px;color:#374151;">Generated by NeuroNest</div>
</body></html>`;
}

export default function WeeklyReportScreen({ navigation }: any) {
    const { user } = useAuth();
    const [report, setReport] = useState<WeeklyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reportType, setReportType] = useState<'weekly' | 'daily'>('weekly');
    const [generatingPdf, setGeneratingPdf] = useState(false);

    const handleDownloadPdf = async () => {
        setGeneratingPdf(true);
        try {
            const weekDates = getDatesForPastWeek();
            const moodData = [0, 0, 0, 0, 0, 0, 0];
            const timeSpentData = [0, 0, 0, 0, 0, 0, 0];
            const gameData: Record<string, number[]> = {};
            Object.keys(TRACKED_GAMES).forEach(g => { gameData[g] = [0, 0, 0, 0, 0, 0, 0]; });

            for (let i = 0; i < 7; i++) {
                const raw = await AsyncStorage.getItem(`mood_checkin_${user?.id ?? 'anon'}_${weekDates[i].iso}`);
                if (raw) moodData[i] = parseInt(raw, 10);
            }

            if (user?.id) {
                const startIso = weekDates[0].iso + "T00:00:00";
                const { data: sessions } = await supabase.from('game_sessions').select('game_name, score, duration_seconds, created_at')
                    .eq('user_id', user.id).gte('created_at', startIso).in('game_name', Object.keys(TRACKED_GAMES));

                if (sessions) {
                    const timeAgg: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
                    const gamesAgg: Record<string, Record<number, number[]>> = {};

                    sessions.forEach(s => {
                        const sDate = s.created_at.slice(0, 10);
                        const dIndex = weekDates.findIndex(w => w.iso === sDate);
                        if (dIndex >= 0) {
                            timeAgg[dIndex] += (s.duration_seconds || 0);
                            if (!gamesAgg[s.game_name]) gamesAgg[s.game_name] = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
                            if (s.score != null) gamesAgg[s.game_name][dIndex].push(s.score);
                        }
                    });

                    for (let i = 0; i < 7; i++) {
                        timeSpentData[i] = Math.round(timeAgg[i] / 60);
                        Object.keys(TRACKED_GAMES).forEach(g => {
                            const arr = gamesAgg[g]?.[i];
                            if (arr && arr.length > 0) gameData[g][i] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
                        });
                    }
                }
            }

            const username = user?.email?.split('@')[0] || 'User';
            const html = buildWeeklyPdfHtml(username, weekDates, moodData, timeSpentData, gameData);
            const { uri } = await Print.printToFileAsync({ html, base64: false });
            await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Save Weekly Report', UTI: 'com.adobe.pdf' });
        } catch (e: any) {
            Alert.alert('Error', 'Could not generate PDF');
        } finally {
            setGeneratingPdf(false);
        }
    };

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
            { icon: '🏆', title: 'Key Achievement', content: report.key_achievement, color: '#F59E0B' },
            { icon: '🎯', title: 'Focus for Next Week', content: report.focus_area, color: '#10B981' },
        ]
        : [
            { icon: '📋', title: "Today's Observation", content: report.daily_observation, color: '#3B82F6' },
            { icon: '⭐', title: 'Key Moment', content: report.key_moment, color: '#F59E0B' },
            { icon: '🌅', title: 'Focus for Tomorrow', content: report.focus_area, color: '#10B981' },
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

                        <TouchableOpacity onPress={handleDownloadPdf} style={styles.pdfBtn} disabled={generatingPdf}>
                            <LinearGradient colors={['#8B5CF6', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.pdfBtnGrad}>
                                {generatingPdf ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="download" size={18} color="white" />}
                                <Text style={styles.pdfText}>{generatingPdf ? 'Generating PDF...' : 'Download Weekly Graphs PDF'}</Text>
                            </LinearGradient>
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
    pdfBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 12, shadowColor: '#8B5CF6', shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    pdfBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14 },
    pdfText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
    rateNote: { color: '#4B5563', fontSize: 11, textAlign: 'center', marginTop: 10 },
});
