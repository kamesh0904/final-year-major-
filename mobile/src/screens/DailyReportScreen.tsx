/**
 * DailyReportScreen
 * Generates a PDF daily report with:
 *  - Today's mood
 *  - Game-specific graphs (only for games played today):
 *    • Chromatic Rush  → Focus Score graph
 *    • Impulse Guard   → Reaction Time graph
 *    • Pattern Release → Memory Accuracy graph
 *    • Order Shift     → Cognitive Reflex graph
 *    • Calm Path       → Flow State graph
 */
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BG_GRADIENT } from '../config/theme';

const TODAY = new Date().toISOString().slice(0, 10);

// Games we generate graphs for
const TRACKED_GAMES: Record<string, { label: string; metric: string; color: string; unit: string; lowerIsBetter?: boolean }> = {
    'Chromatic Rush': { label: 'Focus Score', metric: 'score', color: '#3B82F6', unit: 'pts' },
    'Impulse Guard': { label: 'Reaction Time', metric: 'score', color: '#EF4444', unit: 'ms', lowerIsBetter: true },
    'Pattern Release': { label: 'Memory Accuracy', metric: 'score', color: '#10B981', unit: 'pts' },
    'Order Shift': { label: 'Cognitive Reflex', metric: 'score', color: '#8B5CF6', unit: 'pts' },
    'Calm Path': { label: 'Flow State', metric: 'score', color: '#06B6D4', unit: 'pts' },
};

const MOOD_LABELS: Record<number, string> = {
    1: 'Very Low 😞', 2: 'Low 😔', 3: 'Neutral 😐', 4: 'Okay 🙂',
    5: 'Good 😊', 6: 'Pretty Good 😄', 7: 'Great 😁', 8: 'Amazing 🤩',
    9: 'Excellent 🥳', 10: 'Perfect ✨',
};

interface GameData { name: string; scores: number[]; times: string[] }

// ─── SVG bar chart as HTML string ────────────────────────────────────────────
function buildBarChart(scores: number[], color: string, label: string, unit: string): string {
    const W = 480; const H = 140; const PAD = 40;
    const max = Math.max(...scores, 1);
    const barW = Math.floor((W - PAD * 2) / scores.length) - 6;

    const bars = scores.map((s, i) => {
        const bh = Math.round(((s / max) * (H - 40)));
        const x = PAD + i * (barW + 6);
        const y = H - 20 - bh;
        return `
      <rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="4" fill="${color}" opacity="0.85"/>
      <text x="${x + barW / 2}" y="${H - 4}" text-anchor="middle" font-size="10" fill="#9CA3AF">${i + 1}</text>
      <text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" font-size="10" fill="${color}">${s}</text>`;
    }).join('');

    return `
    <div style="margin-bottom:24px;">
      <div style="font-size:13px;font-weight:700;color:#E5E7EB;margin-bottom:8px;">${label} <span style="color:#6B7280;font-weight:400;">(${unit})</span></div>
      <svg width="${W}" height="${H}" style="background:#111827;border-radius:12px;padding:4px;">
        ${bars}
        <line x1="${PAD}" y1="${H - 20}" x2="${W - PAD}" y2="${H - 20}" stroke="#374151" stroke-width="1"/>
      </svg>
      <div style="font-size:11px;color:#6B7280;margin-top:4px;">Session number →</div>
    </div>`;
}

// ─── Full PDF HTML ────────────────────────────────────────────────────────────
function buildPdfHtml(
    username: string,
    mood: number | null,
    games: GameData[],
    date: string,
): string {
    const moodSection = `
    <div style="background:#1F2937;border-radius:16px;padding:20px;margin-bottom:24px;border-left:4px solid #A855F7;">
      <div style="font-size:13px;color:#9CA3AF;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">Today's Mood</div>
      ${mood
            ? `<div style="font-size:28px;font-weight:800;color:#E5E7EB;">${MOOD_LABELS[mood] ?? `${mood}/10`}</div>
           <div style="margin-top:10px;background:#374151;border-radius:8px;height:10px;overflow:hidden;">
             <div style="width:${mood * 10}%;height:100%;background:linear-gradient(90deg,#8B5CF6,#EC4899);border-radius:8px;"></div>
           </div>
           <div style="font-size:11px;color:#6B7280;margin-top:4px;">${mood}/10</div>`
            : `<div style="font-size:16px;color:#6B7280;">No mood check-in recorded today.</div>`
        }
    </div>`;

    const gameSection = games.length === 0
        ? `<div style="background:#1F2937;border-radius:16px;padding:24px;text-align:center;color:#6B7280;font-size:15px;">
             🎮 No games played today.<br/>
             <span style="font-size:13px;">Play games to see your performance graphs here.</span>
           </div>`
        : games.map(g => {
            const cfg = TRACKED_GAMES[g.name];
            if (!cfg) return '';
            return `
            <div style="background:#1F2937;border-radius:16px;padding:20px;margin-bottom:20px;border-left:4px solid ${cfg.color};">
              <div style="font-size:16px;font-weight:700;color:#E5E7EB;margin-bottom:4px;">${g.name}</div>
              <div style="font-size:12px;color:#6B7280;margin-bottom:16px;">${g.scores.length} session${g.scores.length > 1 ? 's' : ''} today</div>
              ${buildBarChart(g.scores, cfg.color, cfg.label, cfg.unit)}
              <div style="display:flex;gap:16px;margin-top:8px;">
                <div style="background:#111827;border-radius:10px;padding:10px 16px;text-align:center;flex:1;">
                  <div style="font-size:18px;font-weight:800;color:${cfg.color};">${cfg.lowerIsBetter ? Math.min(...g.scores) : Math.max(...g.scores)}</div>
                  <div style="font-size:11px;color:#6B7280;">Best</div>
                </div>
                <div style="background:#111827;border-radius:10px;padding:10px 16px;text-align:center;flex:1;">
                  <div style="font-size:18px;font-weight:800;color:${cfg.color};">${Math.round(g.scores.reduce((a, b) => a + b, 0) / g.scores.length)}</div>
                  <div style="font-size:11px;color:#6B7280;">Average</div>
                </div>
                <div style="background:#111827;border-radius:10px;padding:10px 16px;text-align:center;flex:1;">
                  <div style="font-size:18px;font-weight:800;color:${cfg.color};">${g.scores.length}</div>
                  <div style="font-size:11px;color:#6B7280;">Sessions</div>
                </div>
              </div>
            </div>`;
        }).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0F172A; color: #E5E7EB; font-family: -apple-system, sans-serif; padding: 32px 24px; }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #1F2937;">
    <div>
      <div style="font-size:22px;font-weight:800;color:#A855F7;">NeuroNest</div>
      <div style="font-size:13px;color:#6B7280;margin-top:2px;">Daily Performance Report</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:15px;font-weight:700;color:#E5E7EB;">${username}</div>
      <div style="font-size:12px;color:#6B7280;">${new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </div>
  </div>

  ${moodSection}

  <!-- Games section -->
  <div style="font-size:16px;font-weight:700;color:#E5E7EB;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
    🎮 Today's Game Performance
  </div>
  ${gameSection}

  <!-- Footer -->
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #1F2937;text-align:center;font-size:11px;color:#374151;">
    Generated by NeuroNest · Not a clinical diagnosis · ${new Date().toLocaleTimeString()}
  </div>
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DailyReportScreen({ navigation }: any) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [mood, setMood] = useState<number | null>(null);
    const [games, setGames] = useState<GameData[]>([]);

    const username = user?.email?.split('@')[0] || 'User';

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Mood from AsyncStorage (user-scoped)
            const moodRaw = await AsyncStorage.getItem(`mood_checkin_${user?.id ?? 'anon'}_${TODAY}`);
            if (moodRaw) setMood(parseInt(moodRaw, 10));

            // 2. Game sessions today from Supabase
            if (!user?.id) return;
            const todayStart = `${TODAY}T00:00:00`;
            const { data: sessions } = await supabase
                .from('game_sessions')
                .select('game_name, score, created_at')
                .eq('user_id', user.id)
                .gte('created_at', todayStart)
                .in('game_name', Object.keys(TRACKED_GAMES))
                .order('created_at', { ascending: true });

            if (sessions && sessions.length > 0) {
                // Group by game
                const map: Record<string, GameData> = {};
                sessions.forEach(s => {
                    if (!map[s.game_name]) map[s.game_name] = { name: s.game_name, scores: [], times: [] };
                    map[s.game_name].scores.push(s.score ?? 0);
                    map[s.game_name].times.push(new Date(s.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
                });
                setGames(Object.values(map));
            }
        } catch (e) {
            console.error('DailyReport load error:', e);
        } finally {
            setLoading(false);
        }
    };

    const generatePdf = async () => {
        setGenerating(true);
        try {
            const html = buildPdfHtml(username, mood, games, TODAY);
            const { uri } = await Print.printToFileAsync({ html, base64: false });
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Save or Share Daily Report',
                UTI: 'com.adobe.pdf',
            });
        } catch (e: any) {
            Alert.alert('Error', 'Could not generate PDF: ' + (e.message || 'Unknown error'));
        } finally {
            setGenerating(false);
        }
    };

    return (
        <View style={s.container}>
            <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
            <View style={[s.orb, { top: -60, right: -60, backgroundColor: 'rgba(168,85,247,0.07)', width: 220, height: 220 }]} />

            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Daily Report</Text>
                <View style={{ width: 38 }} />
            </View>

            {loading ? (
                <View style={s.centered}>
                    <ActivityIndicator size="large" color="#A855F7" />
                    <Text style={s.loadingText}>Loading today's data...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                    {/* Date */}
                    <Text style={s.dateText}>
                        {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>

                    {/* Mood card */}
                    <View style={s.card}>
                        <View style={s.cardHeader}>
                            <View style={[s.cardIcon, { backgroundColor: 'rgba(168,85,247,0.15)', borderColor: 'rgba(168,85,247,0.3)' }]}>
                                <Ionicons name="happy" size={18} color="#A855F7" />
                            </View>
                            <Text style={s.cardTitle}>Today's Mood</Text>
                        </View>
                        {mood ? (
                            <>
                                <Text style={s.moodValue}>{MOOD_LABELS[mood]}</Text>
                                <View style={s.moodBar}>
                                    <View style={[s.moodFill, { width: `${mood * 10}%` }]}>
                                        <LinearGradient colors={['#8B5CF6', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                                    </View>
                                </View>
                                <Text style={s.moodScore}>{mood}/10</Text>
                            </>
                        ) : (
                            <Text style={s.emptyText}>No mood check-in today. Open the app tomorrow morning to log your mood.</Text>
                        )}
                    </View>

                    {/* Games preview */}
                    <View style={s.card}>
                        <View style={s.cardHeader}>
                            <View style={[s.cardIcon, { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)' }]}>
                                <Ionicons name="game-controller" size={18} color="#818CF8" />
                            </View>
                            <Text style={s.cardTitle}>Game Sessions Today</Text>
                        </View>
                        {games.length === 0 ? (
                            <Text style={s.emptyText}>No tracked games played today. Play Chromatic Rush, Impulse Guard, Pattern Release, Order Shift, or Calm Path to see graphs.</Text>
                        ) : (
                            games.map(g => {
                                const cfg = TRACKED_GAMES[g.name];
                                return (
                                    <View key={g.name} style={s.gameRow}>
                                        <View style={[s.gameDot, { backgroundColor: cfg.color }]} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.gameName}>{g.name}</Text>
                                            <Text style={s.gameMeta}>{g.scores.length} session{g.scores.length > 1 ? 's' : ''} · Best: {cfg.lowerIsBetter ? Math.min(...g.scores) : Math.max(...g.scores)} {cfg.unit}</Text>
                                        </View>
                                        <Text style={[s.gameMetric, { color: cfg.color }]}>{cfg.label}</Text>
                                    </View>
                                );
                            })
                        )}
                    </View>

                    {/* What's in the PDF */}
                    <View style={s.infoCard}>
                        <Ionicons name="document-text" size={18} color="#FBBF24" />
                        <Text style={s.infoText}>
                            The PDF includes your mood, {games.length > 0 ? `${games.length} game graph${games.length > 1 ? 's' : ''}` : 'and a prompt to play games'}, and session stats.
                        </Text>
                    </View>

                    {/* Generate button */}
                    <TouchableOpacity style={s.generateBtn} onPress={generatePdf} disabled={generating} activeOpacity={0.85}>
                        <LinearGradient colors={['#8B5CF6', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.generateBtnGrad}>
                            {generating
                                ? <ActivityIndicator size="small" color="white" />
                                : <Ionicons name="download" size={20} color="white" />
                            }
                            <Text style={s.generateBtnText}>{generating ? 'Generating PDF...' : 'Download Daily Report PDF'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity style={s.refreshBtn} onPress={loadData} activeOpacity={0.7}>
                        <Ionicons name="refresh" size={15} color="rgba(156,163,175,0.6)" />
                        <Text style={s.refreshText}>Refresh data</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    orb: { position: 'absolute', borderRadius: 999 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 58, paddingBottom: 12 },
    backBtn: { width: 38, height: 38, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: 'white', fontWeight: '700', fontSize: 18 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
    loadingText: { color: 'rgba(156,163,175,1)', fontSize: 14 },
    scroll: { paddingHorizontal: 20, paddingBottom: 60 },
    dateText: { color: 'rgba(156,163,175,0.7)', fontSize: 13, fontWeight: '600', marginBottom: 16, letterSpacing: 0.3 },
    card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 14 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    cardIcon: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    cardTitle: { color: 'white', fontWeight: '700', fontSize: 16 },
    moodValue: { color: 'white', fontSize: 22, fontWeight: '800', marginBottom: 10 },
    moodBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
    moodFill: { height: '100%', borderRadius: 4, overflow: 'hidden' },
    moodScore: { color: 'rgba(156,163,175,0.7)', fontSize: 12 },
    emptyText: { color: 'rgba(156,163,175,0.7)', fontSize: 13, lineHeight: 20 },
    gameRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
    gameDot: { width: 10, height: 10, borderRadius: 5 },
    gameName: { color: 'white', fontSize: 14, fontWeight: '600' },
    gameMeta: { color: 'rgba(156,163,175,0.7)', fontSize: 12, marginTop: 2 },
    gameMetric: { fontSize: 11, fontWeight: '700' },
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(251,191,36,0.08)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)', marginBottom: 20 },
    infoText: { color: 'rgba(251,191,36,0.8)', fontSize: 13, lineHeight: 19, flex: 1 },
    generateBtn: { borderRadius: 16, overflow: 'hidden', shadowColor: '#8B5CF6', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8, marginBottom: 12 },
    generateBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
    generateBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },
    refreshBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
    refreshText: { color: 'rgba(156,163,175,0.5)', fontSize: 13 },
});
