import { supabase } from "../lib/supabase";
import { logger } from "./logger";

export interface AuthUser {
    id: string;
    email: string;
    username?: string;
    avatar_url?: string;
    provider?: string;
}

interface ProfileData {
    username?: string;
    avatar_url?: string;
}

interface UserMetadata {
    provider?: string;
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
}

/**
 * Get the current authenticated user
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            logger.error('Error getting user:', error);
            return null;
        }

        if (!user) return null;

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', user.id)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            logger.error('Error fetching profile:', profileError);
        }

        const metadata = user.app_metadata as UserMetadata;

        return {
            id: user.id,
            email: user.email || '',
            username: profile?.username,
            avatar_url: profile?.avatar_url,
            provider: metadata?.provider
        };
    } catch (error) {
        logger.error('Error getting current user:', error);
        return null;
    }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        localStorage.clear();
    } catch (error) {
        logger.error('Error signing out:', error);
        throw error;
    }
};

/**
 * Check if user has completed onboarding
 */
export const hasCompletedOnboarding = async (userId: string): Promise<boolean> => {
    if (!userId) {
        logger.warn('hasCompletedOnboarding called without userId');
        return false;
    }

    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('profile_type')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            logger.error('Error checking onboarding status:', error);
        }

        return !!profile?.profile_type;
    } catch (error) {
        logger.error('Error checking onboarding status:', error);
        return false;
    }
};

interface UserData {
    id: string;
    email?: string;
    user_metadata?: UserMetadata;
}

/**
 * Create or update user profile after OAuth login
 */
export const createOrUpdateProfile = async (user: UserData): Promise<void> => {
    if (!user?.id) {
        throw new Error('User ID is required');
    }

    try {
        const metadata = user.user_metadata || {};
        const username = metadata.full_name ||
            metadata.name ||
            user.email?.split('@')[0] ||
            'NeuroExplorer';

        const profileData = {
            id: user.id,
            username: username,
            email: user.email || '',
            avatar_url: metadata.avatar_url || metadata.picture || null,
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
            logger.error('Error creating/updating profile:', error);
            throw error;
        }
    } catch (error) {
        logger.error('Error in createOrUpdateProfile:', error);
        throw error;
    }
};

/**
 * Get OAuth provider display name
 */
export const getProviderDisplayName = (provider: string): string => {
    if (!provider) return 'Unknown';

    switch (provider.toLowerCase()) {
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