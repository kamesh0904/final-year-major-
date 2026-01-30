import { supabase } from "../lib/supabase";

export interface AuthUser {
    id: string;
    email: string;
    username?: string;
    avatar_url?: string;
    provider?: string;
}

/**
 * Get the current authenticated user
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        // Get additional profile data
        const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', user.id)
            .single();

        return {
            id: user.id,
            email: user.email || '',
            username: profile?.username,
            avatar_url: profile?.avatar_url,
            provider: user.app_metadata?.provider
        };
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
    try {
        await supabase.auth.signOut();
        localStorage.clear();
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
};

/**
 * Check if user has completed onboarding
 */
export const hasCompletedOnboarding = async (userId: string): Promise<boolean> => {
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('profile_type')
            .eq('id', userId)
            .single();

        return !!profile?.profile_type;
    } catch (error) {
        console.error('Error checking onboarding status:', error);
        return false;
    }
};

/**
 * Create or update user profile after OAuth login
 */
export const createOrUpdateProfile = async (user: any): Promise<void> => {
    try {
        const username = user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'NeuroExplorer';

        const profileData = {
            id: user.id,
            username: username,
            email: user.email,
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            xp: 0,
            level: 1,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('profiles')
            .upsert(profileData, {
                onConflict: 'id',
                ignoreDuplicates: false
            });

        if (error) {
            console.error('Error creating/updating profile:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error in createOrUpdateProfile:', error);
        throw error;
    }
};

/**
 * Get OAuth provider display name
 */
export const getProviderDisplayName = (provider: string): string => {
    switch (provider) {
        case 'google':
            return 'Google';
        case 'azure':
            return 'Microsoft';
        case 'github':
            return 'GitHub';
        default:
            return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
};