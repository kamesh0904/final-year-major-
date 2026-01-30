import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const games = [
    {
        id: 'chromatic-rush',
        name: 'Chromatic Rush',
        description: 'Color-based cognitive training',
        icon: 'color-palette',
        colors: ['#FF6B6B', '#4ECDC4'],
    },
    {
        id: 'sensory-flow',
        name: 'Sensory Flow',
        description: 'Sensory processing exercises',
        icon: 'water',
        colors: ['#A8E6CF', '#3EECAC'],
    },
    {
        id: 'order-shift',
        name: 'Order Shift',
        description: 'Pattern recognition',
        icon: 'grid',
        colors: ['#FFD93D', '#FFA500'],
    },
    {
        id: 'impulse-guard',
        name: 'Impulse Guard',
        description: 'Impulse control training',
        icon: 'shield',
        colors: ['#6C5CE7', '#A29BFE'],
    },
    {
        id: 'emotion-match',
        name: 'Emotion Match',
        description: 'Emotional recognition',
        icon: 'happy',
        colors: ['#FD79A8', '#FDCB6E'],
    },
    {
        id: 'pattern-release',
        name: 'Pattern Release',
        description: 'Stress relief patterns',
        icon: 'infinite',
        colors: ['#74B9FF', '#0984E3'],
    },
    {
        id: 'momentum-steps',
        name: 'Momentum Steps',
        description: 'Progressive achievement',
        icon: 'trending-up',
        colors: ['#00B894', '#00CEC9'],
    },
    {
        id: 'calm-path',
        name: 'Calm Path',
        description: 'Mindfulness journey',
        icon: 'leaf',
        colors: ['#81C784', '#4CAF50'],
    },
    {
        id: 'breath-sync',
        name: 'Breath Sync',
        description: 'Breathing exercises',
        icon: 'pulse',
        colors: ['#64B5F6', '#2196F3'],
    },
    {
        id: 'light-builder',
        name: 'Light Builder',
        description: 'Creative expression',
        icon: 'bulb',
        colors: ['#FFB74D', '#FF9800'],
    },
];

export default function GamesScreen({ navigation }: any) {
    const handleGamePress = (gameId: string) => {
        navigation.navigate('GamePlay', { gameId });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Therapeutic Games</Text>
                <Text style={styles.subtitle}>Choose a game to play</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.gamesGrid}>
                    {games.map((game) => (
                        <TouchableOpacity
                            key={game.id}
                            style={styles.gameCard}
                            onPress={() => handleGamePress(game.id)}
                        >
                            <LinearGradient
                                colors={game.colors}
                                style={styles.gameGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name={game.icon as any} size={40} color="white" />
                            </LinearGradient>
                            <Text style={styles.gameName}>{game.name}</Text>
                            <Text style={styles.gameDescription}>{game.description}</Text>
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
        backgroundColor: '#F3F4F6',
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#8B5CF6',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    scrollView: {
        flex: 1,
    },
    gamesGrid: {
        padding: 15,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gameCard: {
        width: (width - 45) / 2,
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    gameGradient: {
        width: '100%',
        height: 100,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    gameName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 5,
    },
    gameDescription: {
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 16,
    },
});
