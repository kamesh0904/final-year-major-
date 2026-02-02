import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ArrowLeft, Lock, Mail, Key, Check } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function ForgotDiaryPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState<'method' | 'login_password' | 'otp' | 'new_password' | 'success'>('method');
    const [authMethod, setAuthMethod] = useState<'password' | 'google' | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form fields
    const [userId, setUserId] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [displayedOTP, setDisplayedOTP] = useState(""); // Store OTP to display
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Please log in first");
                navigate('/login');
                return;
            }

            setUserId(user.id);
            setUserEmail(user.email || "");

            // Detect authentication method
            const isGoogleAuth = user.app_metadata.provider === 'google';
            setAuthMethod(isGoogleAuth ? 'google' : 'password');

            // Skip method selection step
            if (isGoogleAuth) {
                setStep('otp');
            } else {
                setStep('login_password');
            }
        } catch (error) {
            console.error("Error checking user:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoginPasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword) {
            alert("Please fill in all fields");
            return;
        }
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/reset-diary-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    login_password: loginPassword,
                    new_diary_password: newPassword
                })
            });

            const result = await response.json();
            if (result.status === 'success') {
                setStep('success');
            } else {
                alert(result.message || "Failed to reset password");
            }
        } catch (error) {
            console.error("Reset error:", error);
            alert("Error resetting password");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendOTP = async () => {
        setSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/send-diary-reset-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    email: userEmail
                })
            });

            const result = await response.json();
            if (result.status === 'success') {
                // Display OTP on screen if available (development mode)
                if (result.otp) {
                    setDisplayedOTP(result.otp);
                    setOtp(result.otp); // Auto-fill the OTP
                    alert(`OTP Generated: ${result.otp}\n\nThe OTP has been auto-filled for you!`);
                } else {
                    alert("OTP sent to your email! Check your inbox.");
                }
            } else {
                alert(result.message || "Failed to send OTP");
            }
        } catch (error) {
            console.error("OTP error:", error);
            alert("Error sending OTP");
        } finally {
            setSubmitting(false);
        }
    };

    const handleOTPReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || !newPassword || !confirmPassword) {
            alert("Please fill in all fields");
            return;
        }
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/verify-otp-and-reset-diary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    otp: otp,
                    new_diary_password: newPassword
                })
            });

            const result = await response.json();
            if (result.status === 'success') {
                setStep('success');
            } else {
                alert(result.message || "Failed to reset password");
            }
        } catch (error) {
            console.error("Reset error:", error);
            alert("Error resetting password");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse-slow mx-auto mb-4" />
                    <p className="text-gray-400 animate-fade-in">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-8 px-6 md:px-12 pb-24">
            {/* Background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            </div>

            <div className="max-w-md mx-auto relative z-10">
                {/* Header */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300 group mb-8"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to dashboard
                </button>

                <div className="card-calm">
                    {/* Title */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Lock className="text-purple-400" size={32} />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Reset Diary Password
                        </h1>
                        <p className="text-gray-300">
                            {authMethod === 'google'
                                ? "We'll send you an OTP via email"
                                : "Verify your login password to reset"}
                        </p>
                    </div>

                    {/* Login Password Method */}
                    {step === 'login_password' && (
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            setStep('new_password');
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Login Password
                                </label>
                                <input
                                    type="password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    placeholder="Enter your login password"
                                    className="input-calm"
                                    required
                                    autoFocus
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    This is the password you use to log into your account
                                </p>
                            </div>

                            <button type="submit" className="btn-nature w-full" disabled={submitting}>
                                Continue
                            </button>
                        </form>
                    )}

                    {/* OTP Method */}
                    {step === 'otp' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <div className="flex items-center gap-2 px-4 py-3 glass rounded-2xl">
                                    <Mail size={18} className="text-purple-400" />
                                    <span className="text-gray-300">{userEmail}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleSendOTP}
                                className="btn-nature w-full"
                                disabled={submitting}
                            >
                                {submitting ? "Sending OTP..." : "Send OTP"}
                            </button>

                            {/* Display OTP if available */}
                            {displayedOTP && (
                                <div className="p-4 bg-purple-500/20 border border-purple-500/30 rounded-2xl">
                                    <p className="text-sm text-gray-300 mb-2 text-center">Your OTP Code:</p>
                                    <div className="text-3xl font-bold text-center text-purple-300 tracking-widest">
                                        {displayedOTP}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 text-center">
                                        Enter this code below to reset your password
                                    </p>
                                </div>
                            )}

                            <form onSubmit={handleOTPReset} className="space-y-4 pt-4 border-t border-white/10">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Enter OTP Code
                                    </label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="123456"
                                        maxLength={6}
                                        className="input-calm text-center text-2xl tracking-widest"
                                        required
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        {displayedOTP ? "Enter the code shown above" : "Check your email for the 6-digit code"}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        New Diary Password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new diary password"
                                        className="input-calm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className="input-calm"
                                        required
                                    />
                                </div>

                                <button type="submit" className="btn-nature w-full" disabled={submitting}>
                                    {submitting ? "Resetting..." : "Reset Password"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* New Password (for login password method) */}
                    {step === 'new_password' && authMethod === 'password' && (
                        <form onSubmit={handleLoginPasswordReset} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    New Diary Password
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new diary password"
                                    className="input-calm"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="input-calm"
                                    required
                                />
                            </div>

                            <button type="submit" className="btn-nature w-full" disabled={submitting}>
                                {submitting ? "Resetting..." : "Reset Password"}
                            </button>
                        </form>
                    )}

                    {/* Success */}
                    {step === 'success' && (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                                <Check className="text-green-400" size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Password Reset!</h2>
                            <p className="text-gray-300">
                                Your diary password has been reset successfully.
                            </p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="btn-nature w-full"
                            >
                                Go to Diary
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
