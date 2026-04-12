import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Dimensions,
    Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BG_GRADIENT } from '../config/theme';
import Svg, { Circle, Line, G } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CANVAS = Math.min(width - 48, 320);
const CX = CANVAS / 2;
const RADIUS = CANVAS / 2 - 30;
const THICKNESS = 22;

const COLOR_PALETTE = [
    '#E63946', '#06FFA5', '#FFD60A',
    '#00B4D8', '#FF006E', '#7209B7', '#FF9E00', '#8338EC',
];

export default function ChromaticRushScreen({ navigation }: any) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    const rotationRef = useRef(0);
    const speedRef = useRef(0.9);
    const arcColorsRef = useRef(['#E63946', '#06FFA5', '#FFD60A']);
    const radiusColorRef = useRef('#E63946');
    const wasInMatchingArcRef = useRef(false);
    const animFrameRef = useRef<any>(null);
    const scoreRef = useRef(0);
    const isPlayingRef = useRef(false);
    const isGameOverRef = useRef(false);

    // Animated rotation value for re-render
    const [rotation, setRotation] = useState(0);
    const [arcColors, setArcColors] = useState(['#E63946', '#06FFA5', '#FFD60A']);
    const [radiusColor, setRadiusColor] = useState('#E63946');

    const getRandomDifferentColor = (current: string, colors: string[]) => {
        const others = colors.filter(c => c !== current);
        return others[Math.floor(Math.random() * others.length)];
    };

    const isInMatchingArc = (rot: number, colors: string[], rColor: string) => {
        const anglePerArc = 360 / colors.length;
        const normalized = ((rot % 360) + 360) % 360;
        const index = Math.floor(normalized / anglePerArc);
        return index < colors.length && colors[index] === rColor;
    };

    const endGame = useCallback(() => {
        isPlayingRef.current = false;
        isGameOverRef.current = true;
        setIsPlaying(false);
        setIsGameOver(true);
        if (animFrameRef.current) clearInterval(animFrameRef.current);
        if (scoreRef.current > highScore) setHighScore(scoreRef.current);
    }, [highScore]);

    const startGame = useCallback(() => {
        const baseColors = COLOR_PALETTE.slice(0, 3);
        const startColor = baseColors[Math.floor(Math.random() * baseColors.length)];

        rotationRef.current = 0;
        speedRef.current = 0.9;
        arcColorsRef.current = baseColors;
        radiusColorRef.current = startColor;
        wasInMatchingArcRef.current = false;
        scoreRef.current = 0;
        isPlayingRef.current = true;
        isGameOverRef.current = false;

        setArcColors(baseColors);
        setRadiusColor(startColor);
        setRotation(0);
        setScore(0);
        setIsPlaying(true);
        setIsGameOver(false);
    }, []);

    useEffect(() => {
        if (!isPlaying) return;

        animFrameRef.current = setInterval(() => {
            if (!isPlayingRef.current || isGameOverRef.current) return;

            const newRot = (rotationRef.current + speedRef.current) % 360;
            rotationRef.current = newRot;

            const nowInArc = isInMatchingArc(newRot, arcColorsRef.current, radiusColorRef.current);

            if (wasInMatchingArcRef.current && !nowInArc) {
                endGame();
                return;
            }
            wasInMatchingArcRef.current = nowInArc;
            setRotation(newRot);
        }, 16); // ~60fps

        return () => { if (animFrameRef.current) clearInterval(animFrameRef.current); };
    }, [isPlaying, endGame]);

    const handleTap = () => {
        if (!isPlaying || isGameOver) { startGame(); return; }

        if (isInMatchingArc(rotationRef.current, arcColorsRef.current, radiusColorRef.current)) {
            const newScore = scoreRef.current + 1;
            scoreRef.current = newScore;
            speedRef.current += 0.05;
            setScore(newScore);

            let newColors = arcColorsRef.current;
            if (newScore % 5 === 0 && arcColorsRef.current.length < COLOR_PALETTE.length) {
                newColors = [...arcColorsRef.current, COLOR_PALETTE[arcColorsRef.current.length]];
                arcColorsRef.current = newColors;
                setArcColors(newColors);
            }
            wasInMatchingArcRef.current = false;
            const newRColor = getRandomDifferentColor(radiusColorRef.current, newColors);
            radiusColorRef.current = newRColor;
            setRadiusColor(newRColor);
        } else {
            endGame();
        }
    };

    // Build SVG arc path for each color segment
    const buildArcPath = (index: number, total: number) => {
        const anglePerArc = (2 * Math.PI) / total;
        const startAngle = index * anglePerArc - Math.PI / 2;
        const endAngle = (index + 1) * anglePerArc - Math.PI / 2;
        const x1 = CX + RADIUS * Math.cos(startAngle);
        const y1 = CX + RADIUS * Math.sin(startAngle);
        const x2 = CX + RADIUS * Math.cos(endAngle);
        const y2 = CX + RADIUS * Math.sin(endAngle);
        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
        return { x1, y1, x2, y2, largeArc, startAngle, endAngle };
    };

    // Spinner tip position
    const tipAngle = (rotation * Math.PI) / 180 - Math.PI / 2;
    const tipX = CX + RADIUS * Math.cos(tipAngle);
    const tipY = CX + RADIUS * Math.sin(tipAngle);

    return (
        <View style={styles.container}>
            <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Ionicons name="close" size={22} color="white" />
                </TouchableOpacity>
                <View style={styles.scoreBox}>
                    <Ionicons name="trophy" size={18} color="#FBBF24" />
                    <Text style={styles.scoreText}>{score}</Text>
                </View>
                <Text style={styles.highText}>BEST: {highScore}</Text>
            </View>

            {/* Game Card */}
            <View style={styles.card}>
                <Text style={styles.title}>Chromatic Rush</Text>
                <Text style={styles.subtitle}>Tap when the dot matches the arc color</Text>

                {/* SVG Canvas */}
                <TouchableOpacity onPress={handleTap} activeOpacity={0.9}>
                    <Svg width={CANVAS} height={CANVAS}>
                        {/* Arc segments */}
                        {arcColors.map((color, i) => {
                            const anglePerArc = (2 * Math.PI) / arcColors.length;
                            const startAngle = i * anglePerArc - Math.PI / 2;
                            const endAngle = (i + 1) * anglePerArc - Math.PI / 2;
                            const x1 = CX + RADIUS * Math.cos(startAngle);
                            const y1 = CX + RADIUS * Math.sin(startAngle);
                            const x2 = CX + RADIUS * Math.cos(endAngle);
                            const y2 = CX + RADIUS * Math.sin(endAngle);
                            const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
                            return (
                                <React.Fragment key={i}>
                                    <Circle
                                        cx={CX} cy={CX} r={RADIUS}
                                        stroke={color} strokeWidth={THICKNESS}
                                        fill="none"
                                        strokeDasharray={`${(1 / arcColors.length) * 2 * Math.PI * RADIUS - 4} ${(arcColors.length - 1) / arcColors.length * 2 * Math.PI * RADIUS + 4}`}
                                        strokeDashoffset={-(i / arcColors.length) * 2 * Math.PI * RADIUS + Math.PI / 2 * RADIUS}
                                    />
                                </React.Fragment>
                            );
                        })}

                        {/* Spinner beam */}
                        <Line x1={CX} y1={CX} x2={tipX} y2={tipY} stroke="white" strokeWidth={3} strokeLinecap="round" />

                        {/* Spinner tip dot */}
                        <Circle cx={tipX} cy={tipY} r={12} fill={radiusColor} />

                        {/* Center hub */}
                        <Circle cx={CX} cy={CX} r={14} fill="#1e1b4b" />
                        <Circle cx={CX} cy={CX} r={14} stroke="rgba(255,255,255,0.1)" strokeWidth={2} fill="none" />
                    </Svg>

                    {/* Start overlay */}
                    {!isPlaying && !isGameOver && (
                        <View style={styles.overlay}>
                            <Ionicons name="play" size={48} color="white" />
                        </View>
                    )}
                </TouchableOpacity>

                {/* Footer */}
                <View style={styles.footer}>
                    {!isPlaying && !isGameOver && (
                        <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                            <LinearGradient colors={['#3B82F6', '#8B5CF6']} style={styles.startBtnGrad}>
                                <Ionicons name="flash" size={20} color="white" />
                                <Text style={styles.startBtnText}>START GAME</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                    {isGameOver && (
                        <View style={styles.gameOverBox}>
                            <Text style={styles.gameOverText}>🔥 GAME OVER — Score: {score}</Text>
                            <TouchableOpacity style={styles.retryBtn} onPress={startGame}>
                                <Ionicons name="refresh" size={18} color="white" />
                                <Text style={styles.retryText}>TRY AGAIN</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {isPlaying && <Text style={styles.hint}>Tap the circle when the dot matches!</Text>}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', paddingTop: 60 },
    header: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 16 },
    closeBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    scoreBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
    scoreText: { color: 'white', fontWeight: 'bold', fontSize: 22, fontFamily: 'monospace' },
    highText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
    card: { backgroundColor: '#120b22', borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', width: width - 32, position: 'relative' },
    title: { fontSize: 26, fontWeight: 'bold', color: 'white', marginBottom: 4 },
    subtitle: { fontSize: 13, color: '#9CA3AF', marginBottom: 24 },
    overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: CANVAS / 2, justifyContent: 'center', alignItems: 'center', width: CANVAS, height: CANVAS },
    footer: { marginTop: 24, width: '100%' },
    startBtn: { borderRadius: 14, overflow: 'hidden' },
    startBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14 },
    startBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    gameOverBox: { alignItems: 'center', gap: 12 },
    gameOverText: { color: '#F87171', fontWeight: 'bold', fontSize: 18 },
    retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
    retryText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
    hint: { color: '#6B7280', fontSize: 12, textAlign: 'center', marginTop: 8 },
});
