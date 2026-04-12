import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BG_GRADIENT, ORB } from '../config/theme';

const { width, height } = Dimensions.get('window');

const GAMES = [
    {
        id: "chromatic-rush",
        title: "Chromatic Rush",
        desc: "Train your focus and reaction speed.",
        icon: "flash",
        colors: ['#3B82F6', '#6366F1'],
        tag: "ADHD Focus"
    },
    {
        id: "impulse-guard",
        title: "Impulse Guard",
        desc: "Resist the urge. Train impulse control.",
        icon: "shield",
        colors: ['#EF4444', '#F97316'],
        tag: "Impulse Control"
    },
    {
        id: "pattern-release",
        title: "Pattern Release",
        desc: "Challenge your urge for perfection.",
        icon: "grid",
        colors: ['#10B981', '#14B8A6'],
        tag: "OCD Exposure"
    },
    {
        id: "order-shift",
        title: "Order Shift",
        desc: "Adapt quickly to changing rules.",
        icon: "shuffle",
        colors: ['#8B5CF6', '#EC4899'],
        tag: "Cognitive Flex"
    },
    {
        id: "calm-path",
        title: "Calm Path",
        desc: "Find your center in a chaotic world.",
        icon: "leaf",
        colors: ['#3B82F6', '#6366F1'],
        tag: "Flow State"
    },
    {
        id: "breath-sync",
        title: "Breath Sync",
        desc: "Regulate anxiety with visual breathing.",
        icon: "pulse",
        colors: ['#06B6D4', '#0891B2'],
        tag: "Anxiety Relief"
    },
    {
        id: "emotion-match",
        title: "Emotion Match",
        desc: "Practice identifying facial expressions.",
        icon: "heart",
        colors: ['#F43F5E', '#EF4444'],
        tag: "Social Cues"
    },
    {
        id: "sensory-flow",
        title: "Sensory Flow",
        desc: "Calming visual drift without pressure.",
        icon: "water",
        colors: ['#14B8A6', '#06B6D4'],
        tag: "Sensory Rest"
    },
    {
        id: "light-builder",
        title: "Light Builder",
        desc: "Restore light to the world, one step at a time.",
        icon: "sunny",
        colors: ['#F59E0B', '#F97316'],
        tag: "Depression Uplift"
    },
    {
        id: "momentum-steps",
        title: "Momentum Steps",
        desc: "Build motivation through small wins.",
        icon: "trending-up",
        colors: ['#6366F1', '#8B5CF6'],
        tag: "Activation"
    }
];

export default function GamesScreen({ navigation }: any) {
    const handleGamePress = (gameId: string) => {
        const routes: Record<string, string> = {
            'chromatic-rush': 'ChromaticRush',
            'impulse-guard': 'ImpulseGuard',
            'pattern-release': 'PatternRelease',
            'order-shift': 'OrderShift',
            'light-builder': 'LightBuilder',
            'momentum-steps': 'MomentumSteps',
            'calm-path': 'CalmPath',
            'breath-sync': 'BreathSync',
            'emotion-match': 'EmotionMatch',
            'sensory-flow': 'SensoryFlow',
        };
        const route = routes[gameId];
        if (route) {
            navigation.navigate(route as never);
        }
    };


    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={BG_GRADIENT}
                style={styles.backgroundGradient}
            />

            {/* Floating Background Elements */}
            <View style={[styles.floatingElement, styles.floatingElement1]} />
            <View style={[styles.floatingElement, styles.floatingElement2]} />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Neuro Library</Text>
                    <Text style={styles.subtitle}>
                        A collection of gentle cognitive exercises designed to support your unique mind.
                        Choose a tool that resonates with your current need.
                    </Text>
                </View>

                {/* Games Grid */}
                <View style={styles.gamesGrid}>
                    {GAMES.map((game, index) => (
                        <TouchableOpacity
                            key={game.id}
                            style={styles.gameCard}
                            onPress={() => handleGamePress(game.id)}
                        >
                            <LinearGradient
                                colors={[game.colors[0], game.colors[1], 'rgba(0,0,0,0.1)'] as const}
                                style={styles.cardGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {/* Background Pattern */}
                                <View style={styles.cardBackground} />

                                <View style={styles.cardContent}>
                                    {/* Header */}
                                    <View style={styles.cardHeader}>
                                        <View style={styles.iconContainer}>
                                            <Ionicons name={game.icon as any} size={28} color="white" />
                                        </View>
                                        <View style={styles.tagContainer}>
                                            <Text style={styles.tagText}>{game.tag}</Text>
                                        </View>
                                    </View>

                                    {/* Content */}
                                    <View style={styles.gameInfo}>
                                        <Text style={styles.gameTitle}>{game.title}</Text>
                                        <Text style={styles.gameDesc}>{game.desc}</Text>
                                    </View>

                                    {/* Footer */}
                                    <View style={styles.cardFooter}>
                                        <Text style={styles.beginText}>Begin journey</Text>
                                        <Ionicons name="play" size={16} color="rgba(255,255,255,0.8)" />
                                    </View>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
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
        top: height * 0.25,
        right: width * 0.25,
    },
    floatingElement2: {
        width: 320,
        height: 320,
        backgroundColor: '#6366F1',
        bottom: height * 0.25,
        left: width * 0.25,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logo: {
        width: 80,
        height: 80,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 24,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(209, 213, 219, 1)',
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 320,
    },
    gamesGrid: {
        gap: 24,
    },
    gameCard: {
        height: 200,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    cardGradient: {
        flex: 1,
        position: 'relative',
    },
    cardBackground: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 128,
        height: 128,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 64,
        transform: [{ scale: 1.5 }],
        opacity: 0.3,
    },
    cardContent: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 56,
        height: 56,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tagContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '600',
        color: 'white',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    gameInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    gameTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    gameDesc: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    beginText: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.8)',
    },
});