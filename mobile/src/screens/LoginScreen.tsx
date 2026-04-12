import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { BG_GRADIENT, GRADIENT_PRIMARY, COLOR } from '../config/theme';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signInWithGoogle, session } = useAuth();

    // Navigate to Main once session is available after Google sign-in
    React.useEffect(() => {
        if (session) {
            navigation.replace('Main');
        }
    }, [session]);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await signIn(email, password);
            navigation.replace('Main');
        } catch (error: any) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
            // Navigation happens automatically via the session useEffect above
        } catch (error: any) {
            Alert.alert('Google Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={BG_GRADIENT}
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Back Button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            {/* Floating Background Elements */}
            <View style={[styles.floatingElement, styles.floatingElement1]} />
            <View style={[styles.floatingElement, styles.floatingElement2]} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.content}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>Continue your journey of growth and discovery</Text>
                        </View>

                        {/* Card Container */}
                        <View style={styles.card}>
                            <View style={styles.form}>
                                {/* Email Input */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Email Address</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter your email"
                                            placeholderTextColor="rgba(156, 163, 175, 0.7)"
                                            value={email}
                                            onChangeText={setEmail}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                        />
                                    </View>
                                </View>

                                {/* Password Input */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Password</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter your password"
                                            placeholderTextColor="rgba(156, 163, 175, 0.7)"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                        />
                                    </View>
                                </View>

                                {/* Login Button */}
                                <TouchableOpacity
                                    style={[styles.loginButton, loading && styles.buttonDisabled]}
                                    onPress={handleLogin}
                                    disabled={loading}
                                >
                                    <LinearGradient
                                        colors={GRADIENT_PRIMARY}
                                        style={styles.buttonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        {loading ? (
                                            <View style={styles.loadingContainer}>
                                                <Ionicons name="refresh" size={20} color="white" style={styles.loadingIcon} />
                                                <Text style={styles.buttonText}>Logging In...</Text>
                                            </View>
                                        ) : (
                                            <Text style={styles.buttonText}>Login</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Divider */}
                                <View style={styles.dividerContainer}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>OR</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                {/* Google Login Button */}
                                <TouchableOpacity
                                    style={[styles.googleButton, loading && styles.buttonDisabled]}
                                    onPress={handleGoogleLogin}
                                    disabled={loading}
                                >
                                    <Ionicons name="logo-google" size={22} color="#1F2937" />
                                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                                </TouchableOpacity>

                                {/* Sign Up Link */}
                                <View style={styles.linkContainer}>
                                    <Text style={styles.linkText}>
                                        Don't have an account?{' '}
                                        <Text
                                            style={styles.linkHighlight}
                                            onPress={() => navigation.navigate('Signup')}
                                        >
                                            Sign Up Free
                                        </Text>
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
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
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
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
        right: width * 0.33,
    },
    floatingElement2: {
        width: 320,
        height: 320,
        backgroundColor: '#6366F1',
        bottom: height * 0.25,
        left: width * 0.33,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        maxWidth: 400,
        alignSelf: 'center',
        width: '100%',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(209, 213, 219, 1)',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 25,
        elevation: 20,
    },
    form: {
        gap: 24,
    },
    inputContainer: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(209, 213, 219, 1)',
    },
    inputWrapper: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    input: {
        padding: 16,
        fontSize: 16,
        color: 'white',
    },
    loginButton: {
        marginTop: 16,
        borderRadius: 16,
        overflow: 'hidden',
    },
    buttonGradient: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loadingIcon: {
        transform: [{ rotate: '360deg' }],
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    dividerText: {
        color: 'rgba(156, 163, 175, 1)',
        paddingHorizontal: 16,
        fontSize: 14,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 12,
    },
    googleButtonText: {
        color: '#1F2937',
        fontSize: 16,
        fontWeight: '600',
    },
    linkContainer: {
        marginTop: 24,
        alignItems: 'center',
    },
    linkText: {
        color: 'rgba(209, 213, 219, 1)',
        fontSize: 14,
        lineHeight: 20,
    },
    linkHighlight: {
        color: 'rgba(196, 181, 253, 1)',
        fontWeight: '500',
    },
});