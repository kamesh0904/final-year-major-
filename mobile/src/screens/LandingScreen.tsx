import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Image,
    Dimensions,
    StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { BG_GRADIENT, GRADIENT_PRIMARY, COLOR, GLASS, ORB } from '../config/theme';

const { width, height } = Dimensions.get('window');

interface LandingScreenProps {
    navigation: any;
}

export default function LandingScreen({ navigation }: LandingScreenProps) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        } catch (error) {
            console.error('Error checking user:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <LinearGradient
                colors={BG_GRADIENT}
                style={styles.container}
            >
                <View style={styles.loadingContainer}>
                    <View style={styles.loadingCircle} />
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#0a0514', '#1a0b2e', '#0f0619']}
            style={styles.container}
        >
            {/* Floating Background Elements */}
            <View style={styles.floatingElement1} />
            <View style={styles.floatingElement2} />
            <View style={styles.floatingElement3} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {user ? (
                    // Welcome Back Section
                    <View style={styles.welcomeContainer}>
                        <View style={styles.welcomeBadge}>
                            <Ionicons name="heart" size={16} color="#10b981" />
                            <Text style={styles.welcomeBadgeText}>Welcome back to your safe space</Text>
                        </View>

                        <Text style={styles.welcomeTitle}>
                            Ready to continue{'\n'}
                            <Text style={styles.gradientText}>your journey?</Text>
                        </Text>

                        <Text style={styles.welcomeSubtitle}>
                            Your personalized therapeutic space is waiting. Continue building resilience,
                            discovering strengths, and growing at your own pace.
                        </Text>

                        <TouchableOpacity
                            style={styles.continueButton}
                            onPress={() => navigation.navigate('Main')}
                        >
                            <LinearGradient
                                colors={[COLOR.emerald500, '#059669', '#047857']}
                                style={styles.buttonGradient}
                            >
                                <Ionicons name="heart" size={20} color="white" />
                                <Text style={styles.buttonText}>Continue Your Journey</Text>
                                <Ionicons name="arrow-forward" size={20} color="white" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    // Get Started Section
                    <View style={styles.getStartedContainer}>
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <View style={styles.logoGlow} />
                            <Image
                                source={require('../../assets/logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>

                        <Text style={styles.mainTitle}>
                            <Text style={styles.gradientText}>NeuroNest</Text>
                        </Text>

                        <Text style={styles.tagline}>Your safe space to grow</Text>

                        <Text style={styles.description}>
                            A gentle, supportive platform designed for neurodivergent minds.
                            Discover your unique strengths through therapeutic games, personalized insights,
                            and an AI companion who truly understands you.
                        </Text>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => navigation.navigate('Signup')}
                            >
                                <LinearGradient
                                    colors={GRADIENT_PRIMARY}
                                    style={styles.buttonGradient}
                                >
                                    <Ionicons name="sparkles" size={20} color="white" />
                                    <Text style={styles.buttonText}>Start Your Journey</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => navigation.navigate('Login')}
                            >
                                <Text style={styles.secondaryButtonText}>Welcome Back</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Features Grid */}
                <View style={styles.featuresContainer}>
                    <View style={styles.featureCard}>
                        <Image
                            source={require('../../assets/Gamified.png')}
                            style={styles.featureImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.featureTitle}>AI That Understands</Text>
                        <Text style={styles.featureDescription}>
                            Our companion learns your patterns, celebrates your progress, and adapts to your needs.
                            It's like having a therapist who never judges and is always available.
                        </Text>
                    </View>

                    <View style={styles.featureCard}>
                        <Image
                            source={require('../../assets/Personalized.png')}
                            style={styles.featureImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.featureTitle}>Built with Care</Text>
                        <Text style={styles.featureDescription}>
                            Every feature is designed with neurodivergent experiences in mind.
                            From calming colors to gentle feedback, we prioritize your comfort and wellbeing.
                        </Text>
                    </View>

                    <View style={styles.featureCard}>
                        <Image
                            source={require('../../assets/Safe.png')}
                            style={styles.featureImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.featureTitle}>Clinically Grounded</Text>
                        <Text style={styles.featureDescription}>
                            Based on proven therapeutic approaches like CBT and ERP.
                            Our games aren't just fun—they're designed to genuinely help you grow.
                        </Text>
                    </View>
                </View>

                {/* Additional Features */}
                <View style={styles.additionalFeaturesContainer}>
                    <Text style={styles.sectionTitle}>Why NeuroNest feels different</Text>

                    <View style={styles.smallFeaturesGrid}>
                        <View style={styles.smallFeatureCard}>
                            <Ionicons name="flash" size={24} color="#fbbf24" />
                            <Text style={styles.smallFeatureTitle}>No Pressure</Text>
                            <Text style={styles.smallFeatureDescription}>
                                Go at your own pace. No timers, no stress, no judgment.
                            </Text>
                        </View>

                        <View style={styles.smallFeatureCard}>
                            <Ionicons name="people" size={24} color="#3b82f6" />
                            <Text style={styles.smallFeatureTitle}>You're Not Alone</Text>
                            <Text style={styles.smallFeatureDescription}>
                                Your AI companion is always here, understanding your unique journey.
                            </Text>
                        </View>

                        <View style={styles.smallFeatureCard}>
                            <Ionicons name="sparkles" size={24} color="#8b5cf6" />
                            <Text style={styles.smallFeatureTitle}>Celebrate Small Wins</Text>
                            <Text style={styles.smallFeatureDescription}>
                                Every step forward matters. We help you see your progress.
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#8B5CF6',
        opacity: 0.8,
    },
    floatingElement1: {
        position: 'absolute',
        top: height * 0.25,
        left: width * 0.25,
        width: 256,
        height: 256,
        borderRadius: 128,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        opacity: 0.6,
    },
    floatingElement2: {
        position: 'absolute',
        top: height * 0.75,
        right: width * 0.25,
        width: 384,
        height: 384,
        borderRadius: 192,
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        opacity: 0.6,
    },
    floatingElement3: {
        position: 'absolute',
        top: height * 0.5,
        left: width * 0.5,
        width: 320,
        height: 320,
        borderRadius: 160,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        opacity: 0.6,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    welcomeContainer: {
        alignItems: 'center',
        marginBottom: 80,
    },
    welcomeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.2)',
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 32,
    },
    welcomeBadgeText: {
        color: '#10b981',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
    },
    welcomeTitle: {
        fontSize: 48,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 56,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: '#D1D5DB',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        paddingHorizontal: 16,
    },
    getStartedContainer: {
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 80,
    },
    logoContainer: {
        position: 'relative',
        marginBottom: 48,
    },
    logoGlow: {
        position: 'absolute',
        top: -20,
        left: -20,
        right: -20,
        bottom: -20,
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderRadius: 80,
        opacity: 0.6,
    },
    logo: {
        width: 160,
        height: 160,
    },
    mainTitle: {
        fontSize: 56,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
    },
    gradientText: {
        color: '#8B5CF6',
    },
    tagline: {
        fontSize: 24,
        fontWeight: '300',
        color: '#c4b5fd',
        textAlign: 'center',
        marginBottom: 32,
    },
    description: {
        fontSize: 18,
        color: '#d1d5db',
        textAlign: 'center',
        lineHeight: 28,
        marginBottom: 48,
        paddingHorizontal: 16,
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
    },
    primaryButton: {
        borderRadius: 25,
        overflow: 'hidden',
    },
    continueButton: {
        borderRadius: 25,
        overflow: 'hidden',
        marginTop: 32,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 40,
        gap: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderRadius: 25,
        paddingVertical: 16,
        paddingHorizontal: 40,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    featuresContainer: {
        gap: 32,
        marginBottom: 80,
    },
    featureCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
    },
    featureImage: {
        width: 80,
        height: 80,
        marginBottom: 32,
    },
    featureTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 16,
    },
    featureDescription: {
        fontSize: 16,
        color: '#d1d5db',
        textAlign: 'center',
        lineHeight: 24,
    },
    additionalFeaturesContainer: {
        marginBottom: 40,
    },
    sectionTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#8B5CF6',
        textAlign: 'center',
        marginBottom: 64,
    },
    smallFeaturesGrid: {
        gap: 24,
    },
    smallFeatureCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    smallFeatureTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    smallFeatureDescription: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 20,
    },
});