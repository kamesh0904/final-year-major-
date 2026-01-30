import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import OAuthButtons from "../components/OAuthButtons";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Create Auth User
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        // 2. Create Profile Entry in Database
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              username: username,
              xp: 0,
              level: 1
            }
          ]);

        if (profileError) throw profileError;

        // 3. Save session locally
        localStorage.setItem("user", JSON.stringify(data.user));

        // 4. Clear any old questionnaire data
        localStorage.removeItem('hasCompletedQuestionnaire');
        localStorage.removeItem('activeProfile');

        // 5. FORCE REDIRECT to Questionnaire
        navigate("/questionnaire");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {/* Gentle background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-4xl card-calm animate-fade-in relative z-10">

        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-3 text-center">Create Account</h2>
          <p className="text-gray-300 text-center mb-10 text-lg leading-relaxed">Begin your journey of self-discovery with NeuroNest</p>

          {error && <div className="glass rounded-2xl p-4 mb-6 text-sm text-red-300 border border-red-500/20 bg-red-500/10">{error}</div>}

          {/* OAuth Buttons */}
          <OAuthButtons mode="signup" />

          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-calm"
                placeholder="NeuroExplorer"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-calm"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-calm"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              disabled={loading}
              className="btn-calm w-full py-4 text-lg disabled:opacity-50 mt-8"
            >
              {loading ? "Creating Account..." : "Sign Up & Start Journey"}
            </button>
          </form>

          <p className="mt-10 text-center text-gray-300 leading-relaxed">
            Already have an account? <Link to="/login" className="text-purple-300 hover:text-purple-200 font-medium transition-colors duration-300">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}