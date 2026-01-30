import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface OAuthButtonsProps {
    mode: "login" | "signup";
}

export default function OAuthButtons({ mode }: OAuthButtonsProps) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState<string | null>(null);

    const handleOAuthLogin = async (provider: 'google' | 'azure') => {
        setLoading(provider);

        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            });

            if (error) {
                console.error(`${provider} OAuth error:`, error);
                throw error;
            }

            // The redirect will happen automatically
            // The callback will handle the rest of the flow
        } catch (error: any) {
            console.error(`${provider} login failed:`, error);
            alert(`${provider} login failed: ${error.message}`);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Divider */}
            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 text-gray-400 glass rounded-full">
                        or {mode === "login" ? "sign in" : "sign up"} with
                    </span>
                </div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Google Button */}
                <button
                    onClick={() => handleOAuthLogin('google')}
                    disabled={loading !== null}
                    className="flex items-center justify-center gap-3 w-full py-3 px-4 glass rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 text-white font-medium disabled:opacity-50 hover-lift"
                >
                    {loading === 'google' ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    )}
                    <span>Google</span>
                </button>

                {/* Microsoft Button */}
                <button
                    onClick={() => handleOAuthLogin('azure')}
                    disabled={loading !== null}
                    className="flex items-center justify-center gap-3 w-full py-3 px-4 glass rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 text-white font-medium disabled:opacity-50 hover-lift"
                >
                    {loading === 'azure' ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#f25022" d="M1 1h10v10H1z" />
                            <path fill="#00a4ef" d="M13 1h10v10H13z" />
                            <path fill="#7fba00" d="M1 13h10v10H1z" />
                            <path fill="#ffb900" d="M13 13h10v10H13z" />
                        </svg>
                    )}
                    <span>Microsoft</span>
                </button>
            </div>
        </div>
    );
}