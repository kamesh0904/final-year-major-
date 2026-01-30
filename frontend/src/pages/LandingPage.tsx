import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Brain, Sparkles, Shield, ArrowRight, Heart, Zap, Users } from "lucide-react";

export default function Landing() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse-slow">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-glow"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-white selection:bg-purple-500/30 overflow-hidden">

      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative container mx-auto px-6 pt-24 pb-12 flex flex-col items-center text-center">

        {user ? (
          // Welcome Back Section
          <div className="animate-fade-in max-w-4xl flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-emerald-400/20 text-sm font-medium text-emerald-300 mb-8 animate-glow">
              <Heart size={16} className="text-emerald-400" />
              <span>Welcome back to your safe space</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tight">
              Ready to continue <br />
              <span className="text-gradient bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                your journey?
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-12 leading-relaxed max-w-3xl">
              Your personalized therapeutic space is waiting. Continue building resilience,
              discovering strengths, and growing at your own pace.
            </p>

            <Link
              to="/dashboard"
              className="group relative inline-flex items-center gap-3 px-10 py-5 btn-nature text-white rounded-full font-bold text-xl shadow-2xl hover:shadow-emerald-500/25"
            >
              <Heart size={20} />
              Continue Your Journey
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        ) : (
          // Get Started Section
          <div className="animate-fade-in max-w-4xl flex flex-col items-center mt-8">

            {/* Logo with gentle glow */}
            <div className="mb-12 relative">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl animate-pulse-slow"></div>
              <img
                src="/logo.png"
                alt="NeuroNest Logo"
                className="relative w-40 h-40 object-contain drop-shadow-2xl animate-float"
              />
            </div>

            <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
              <span className="text-gradient">NeuroNest</span>
            </h1>

            <p className="text-3xl font-light text-purple-200 mb-8 animate-slide-up">
              Your safe space to grow
            </p>

            <p className="text-xl text-gray-300 mb-12 leading-relaxed max-w-3xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
              A gentle, supportive platform designed for neurodivergent minds.
              Discover your unique strengths through therapeutic games, personalized insights,
              and an AI companion who truly understands you.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <Link
                to="/signup"
                className="group px-10 py-4 btn-calm text-white rounded-full font-bold text-xl shadow-2xl text-center relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Sparkles size={20} />
                  Start Your Journey
                </span>
              </Link>
              <Link
                to="/login"
                className="px-10 py-4 glass hover:glass-dark border-white/20 hover:border-white/40 text-white rounded-full font-bold text-xl transition-all text-center hover-lift"
              >
                Welcome Back
              </Link>
            </div>
          </div>
        )}

        {/* Enhanced Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full max-w-7xl">

          <div className="card-calm group animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="w-16 h-16 glass rounded-3xl flex items-center justify-center mb-8 text-indigo-400 group-hover:scale-110 transition-all duration-500 mx-auto">
              <Brain size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 text-center">AI That Understands</h3>
            <p className="text-gray-300 leading-relaxed text-center">
              Our companion learns your patterns, celebrates your progress, and adapts to your needs.
              It's like having a therapist who never judges and is always available.
            </p>
          </div>

          <div className="card-warm group animate-slide-up" style={{ animationDelay: '0.8s' }}>
            <div className="w-16 h-16 glass rounded-3xl flex items-center justify-center mb-8 text-pink-400 group-hover:scale-110 transition-all duration-500 mx-auto">
              <Heart size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 text-center">Built with Care</h3>
            <p className="text-gray-300 leading-relaxed text-center">
              Every feature is designed with neurodivergent experiences in mind.
              From calming colors to gentle feedback, we prioritize your comfort and wellbeing.
            </p>
          </div>

          <div className="card-calm group animate-slide-up" style={{ animationDelay: '1s' }}>
            <div className="w-16 h-16 glass rounded-3xl flex items-center justify-center mb-8 text-emerald-400 group-hover:scale-110 transition-all duration-500 mx-auto">
              <Shield size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 text-center">Clinically Grounded</h3>
            <p className="text-gray-300 leading-relaxed text-center">
              Based on proven therapeutic approaches like CBT and ERP.
              Our games aren't just fun—they're designed to genuinely help you grow.
            </p>
          </div>

        </div>

        {/* Additional calming features section */}
        <div className="mt-32 max-w-6xl w-full">
          <h2 className="text-4xl font-bold text-center mb-16 text-gradient">
            Why NeuroNest feels different
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            <div className="glass rounded-2xl p-6 text-center hover-lift animate-slide-up" style={{ animationDelay: '1.2s' }}>
              <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">No Pressure</h4>
              <p className="text-gray-400 text-sm">Go at your own pace. No timers, no stress, no judgment.</p>
            </div>

            <div className="glass rounded-2xl p-6 text-center hover-lift animate-slide-up" style={{ animationDelay: '1.4s' }}>
              <Users className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">You're Not Alone</h4>
              <p className="text-gray-400 text-sm">Your AI companion is always here, understanding your unique journey.</p>
            </div>

            <div className="glass rounded-2xl p-6 text-center hover-lift animate-slide-up" style={{ animationDelay: '1.6s' }}>
              <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Celebrate Small Wins</h4>
              <p className="text-gray-400 text-sm">Every step forward matters. We help you see your progress.</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}