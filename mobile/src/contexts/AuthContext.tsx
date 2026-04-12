import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '../config/supabase';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Linking } from 'react-native';

// Required for Google OAuth WebBrowser flow on iOS
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    signIn: async () => { },
    signUp: async () => { },
    signOut: async () => { },
    signInWithGoogle: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Restore session on startup
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth state changes (covers OAuth deep link callback)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        // Handle deep links when app is already open (cold start handled by Linking.getInitialURL)
        const linkingListener = Linking.addEventListener('url', ({ url }) => {
            if (url && url.includes('neuronest://')) {
                handleDeepLink(url);
            }
        });

        // Handle deep link that launched the app from background/closed state
        Linking.getInitialURL().then((url) => {
            if (url && url.includes('neuronest://')) {
                handleDeepLink(url);
            }
        });

        return () => {
            subscription.unsubscribe();
            linkingListener.remove();
        };
    }, []);

    /**
     * Parse access_token / refresh_token from an OAuth callback deep link
     * and manually set the Supabase session.
     *
     * Supabase returns tokens in the URL fragment (#) which gets
     * converted to query params by the redirect URI handler.
     */
    const handleDeepLink = async (url: string) => {
        try {
            // Parse both query params and hash fragments
            const fullUrl = url.replace('#', '?');
            const parsed = new URL(fullUrl);
            const access_token = parsed.searchParams.get('access_token');
            const refresh_token = parsed.searchParams.get('refresh_token');

            if (access_token && refresh_token) {
                const { data, error } = await supabase.auth.setSession({
                    access_token,
                    refresh_token,
                });
                if (error) {
                    console.error('Error setting session from deep link:', error.message);
                } else {
                    setSession(data.session);
                    setUser(data.session?.user ?? null);
                }
            }
        } catch (error) {
            console.error('Error handling deep link:', error);
        }
    };

    const signInWithGoogle = async () => {
        try {
            // Build the redirect URI using the app's custom scheme
            // This generates: neuronest://auth/callback
            // which Android/iOS will intercept and return to the app
            const redirectUrl = makeRedirectUri({
                scheme: 'neuronest',
                path: 'auth/callback',
            });

            console.log('OAuth redirect URL:', redirectUrl);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true, // We handle the browser ourselves
                },
            });

            if (error) throw error;

            if (data?.url) {
                // Open Google's auth page in an in-app browser session.
                // Pass the redirectUrl so the system knows which URL to watch for
                // and automatically close the browser + return to app.
                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    redirectUrl,
                );

                if (result.type === 'success' && result.url) {
                    await handleDeepLink(result.url);
                } else if (result.type === 'cancel' || result.type === 'dismiss') {
                    // User cancelled — do nothing
                    console.log('Google Sign-In cancelled by user');
                }
            }
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            throw error;
        }
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signUp = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut, signInWithGoogle }}>
            {children}
        </AuthContext.Provider>
    );
};
