import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { createOrUpdateProfile, hasCompletedOnboarding } from "../utils/auth";

export default function AuthCallback() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Processing your authentication...");

    useEffect(() => {
        handleAuthCallback();
    }, []);

    const handleAuthCallback = async () => {
        try {
            // Get the session from the URL hash
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                console.error("Auth callback error:", error);
                setStatus("error");
                setMessage("Authentication failed. Please try again.");
                setTimeout(() => navigate("/login"), 3000);
                return;
            }

            if (data.session && data.session.user) {
                const user = data.session.user;

                // Save session data
                localStorage.setItem("user", JSON.stringify(user));
                localStorage.setItem("token", data.session.access_token);

                // Create or update user profile
                await createOrUpdateProfile(user);

                // Check if user has completed onboarding
                const completedOnboarding = await hasCompletedOnboarding(user.id);

                if (completedOnboarding) {
                    setStatus("success");
                    setMessage("Welcome back! Redirecting to dashboard...");
                    setTimeout(() => navigate("/dashboard"), 2000);
                } else {
                    // Clear any old questionnaire data for new OAuth users
                    localStorage.removeItem('hasCompletedQuestionnaire');
                    localStorage.removeItem('activeProfile');

                    setStatus("success");
                    setMessage("Account ready! Let's complete your profile...");
                    setTimeout(() => navigate("/questionnaire"), 2000);
                }
            } else {
                setStatus("error");
                setMessage("No authentication session found. Redirecting to login...");
                setTimeout(() => navigate("/login"), 3000);
            }
        } catch (error: any) {
            console.error("Auth callback error:", error);
            setStatus("error");
            setMessage("Something went wrong. Please try logging in again.");
            setTimeout(() => navigate("/login"), 3000);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative">
            {/* Gentle background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="card-calm animate-fade-in relative z-10 max-w-md w-full text-center">
                <div className="mb-6">
                    {status === "loading" && (
                        <div className="w-16 h-16 mx-auto mb-4">
                            <div className="w-full h-full border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/20 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    )}
                </div>

                <h2 className="text-2xl font-bold text-white mb-4">
                    {status === "loading" && "Authenticating..."}
                    {status === "success" && "Success!"}
                    {status === "error" && "Authentication Failed"}
                </h2>

                <p className="text-gray-300 leading-relaxed">
                    {message}
                </p>

                {status === "error" && (
                    <button
                        onClick={() => navigate("/login")}
                        className="btn-calm mt-6"
                    >
                        Back to Login
                    </button>
                )}
            </div>
        </div>
    );
}