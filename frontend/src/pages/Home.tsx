import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Play, Brain } from "lucide-react";
import DiaryAccess from "../components/DiaryAccess";
import TodaysGentleGoal from "../components/TodaysGentleGoal";
import { logger } from "../utils/logger";

// --- Types ---
interface GameInfo {
  path: string;
  desc: string;
  color: string;
  border: string;
}

type ScoresMap = Record<string, number>;

// --- 1. CONFIGURATION: Game Data & Recommendations ---
const GAME_LIBRARY: Record<string, GameInfo> = {
  "Chromatic Rush": { path: "/game", desc: "Train your focus and reaction speed.", color: "from-blue-900/50 to-purple-900/50", border: "hover:border-purple-500/50" },
  "Impulse Guard": { path: "/impulse-guard", desc: "Resist the urge. Train impulse control.", color: "from-red-900/50 to-orange-900/50", border: "hover:border-red-500/50" },
  "Pattern Release": { path: "/pattern-release", desc: "Challenge your urge for perfection.", color: "from-emerald-900/50 to-teal-900/50", border: "hover:border-emerald-500/50" },
  "Order Shift": { path: "/order-shift", desc: "Adapt quickly to changing rules.", color: "from-purple-900/50 to-pink-900/50", border: "hover:border-purple-500/50" },
  "Sensory Flow": { path: "/sensory-flow", desc: "Calm visual drift without pressure.", color: "from-teal-500/20 to-cyan-500/20", border: "hover:border-teal-500/50" },
  "Emotion Match": { path: "/emotion-match", desc: "Practice identifying facial expressions.", color: "from-rose-500/20 to-red-500/20", border: "hover:border-rose-500/50" },
  "Breath Sync": { path: "/breath-sync", desc: "Regulate anxiety with visual breathing.", color: "from-cyan-900/50 to-blue-900/50", border: "hover:border-cyan-500/50" },
  "Calm Path": { path: "/calm-path", desc: "Find your center in a chaotic world.", color: "from-blue-500/20 to-indigo-500/20", border: "hover:border-blue-500/50" },
  "Light Builder": { path: "/light-builder", desc: "Restore light to the world, one step at a time.", color: "from-yellow-500/20 to-orange-500/20", border: "hover:border-yellow-500/50" },
  "Momentum Steps": { path: "/momentum-steps", desc: "Build motivation through small wins.", color: "from-indigo-500/20 to-violet-500/20", border: "hover:border-indigo-500/50" },
};

const PROFILE_MAP: Record<string, string[]> = {
  "ADHD": ["Chromatic Rush", "Impulse Guard"],
  "OCD": ["Pattern Release", "Order Shift"],
  "Autism": ["Sensory Flow", "Emotion Match"],
  "Anxiety": ["Breath Sync", "Calm Path"],
  "Depression": ["Light Builder", "Momentum Steps"],
  "General": ["Calm Path", "Chromatic Rush"]
};

export default function Home() {
  const [username, setUsername] = useState("Traveler");
  const [scores, setScores] = useState<ScoresMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>(PROFILE_MAP["General"]);
  const [userId, setUserId] = useState<string>("");

  // --- UPDATED RECOMMENDATION LOGIC ---
  const calculateRecommendations = useCallback((currentScores: ScoresMap) => {
    if (!currentScores || Object.keys(currentScores).length === 0) return;

    const sortedCategories = Object.entries(currentScores)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .map(([category]) => category);

    const primaryCat = sortedCategories[0];
    const secondaryCat = sortedCategories[1];

    const normalize = (key: string) => (key?.includes("Autism") ? "Autism" : key);

    const primaryGames = PROFILE_MAP[normalize(primaryCat)] || PROFILE_MAP["General"];
    const secondaryGames = PROFILE_MAP[normalize(secondaryCat)] || PROFILE_MAP["General"];

    const finalMix = [
      primaryGames[0],
      primaryGames[1],
      secondaryGames[0]
    ].filter(Boolean);

    const uniqueMix = [...new Set(finalMix)];
    setRecommendations(uniqueMix);
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setError(null);

      const localScores = localStorage.getItem("userScores");
      if (localScores) {
        try {
          const parsedScores = JSON.parse(localScores) as ScoresMap;
          setScores(parsedScores);
          calculateRecommendations(parsedScores);
          setLoading(false);
        } catch (parseError) {
          logger.error("Failed to parse local scores", parseError);
        }
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (user) {
        const name = user.email?.split("@")[0] || "Traveler";
        setUsername(name);
        setUserId(user.id);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('scores, profile_type')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          logger.error("Profile fetch error", profileError);
        }

        if (profile?.scores) {
          setScores(profile.scores);
          calculateRecommendations(profile.scores);
          localStorage.setItem("userScores", JSON.stringify(profile.scores));
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      logger.error("Home Load Error:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [calculateRecommendations]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse-slow mx-auto mb-4"></div>
        <p className="text-gray-400 animate-fade-in">Preparing your personalized space...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card-calm text-center max-w-md">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Brain className="text-red-400" size={24} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Unable to load profile</h2>
        <p className="text-gray-300 mb-4">{error}</p>
        <button onClick={loadProfile} className="btn-calm">
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-8 px-6 md:px-12 flex flex-col gap-8 max-w-7xl mx-auto pb-24 relative">

      {/* Gentle background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Welcome Header */}
      <header className="flex flex-col gap-3 animate-fade-in relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-slow"></div>
          <span className="text-emerald-400 text-sm font-medium">You're in your safe space</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
          Welcome back, <span className="text-gradient bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent capitalize">{username}</span>
        </h1>
        <p className="text-gray-300 text-lg leading-relaxed">
          Take a deep breath. You're here, you're safe, and you're ready to grow.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">

        {/* Neuro Profile Section */}
        <div className="lg:col-span-2 card-calm group animate-slide-up relative overflow-hidden">
          {/* Subtle animated background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>

          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <div className="w-10 h-10 glass rounded-2xl flex items-center justify-center">
                <Brain className="text-purple-400" size={20} />
              </div>
              Your Neuro Profile
            </h2>

            <div className="space-y-8">
              {Object.entries(scores).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 glass rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="text-purple-400" size={24} />
                  </div>
                  <p className="text-gray-400 mb-4">Your profile is waiting to be discovered</p>
                  <Link to="/questionnaire" className="btn-calm inline-flex items-center gap-2">
                    Complete Assessment
                  </Link>
                </div>
              ) : (
                Object.entries(scores).map(([domain, score]) => (
                  <div key={domain} className="group/item">
                    <div className="flex justify-between items-center text-sm mb-3">
                      <span className="text-gray-200 font-medium flex items-center gap-2">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                        {domain}
                      </span>
                      <span className="text-purple-300 font-mono">{score}/25</span>
                    </div>
                    <div className="h-4 glass rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 transition-all duration-1000 ease-out rounded-full shadow-lg"
                        style={{ width: `${(score / 25) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Today's Gentle Goal */}
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <TodaysGentleGoal userId={userId} />
          </div>

          {/* Diary Access */}
          <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <DiaryAccess />
          </div>
        </div>
      </div>

      {/* Recommended Games */}
      <div className="animate-slide-up relative z-10" style={{ animationDelay: '0.6s' }}>
        <h2 className="text-3xl font-bold text-white mb-8 text-center">
          <span className="text-gradient">Chosen just for you</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {recommendations.map((gameName, index) => {
            const game = GAME_LIBRARY[gameName] || GAME_LIBRARY["Calm Path"];

            return (
              <Link
                key={gameName}
                to={game.path}
                className={`group relative h-64 rounded-3xl overflow-hidden border border-white/10 ${game.border} transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-slide-up`}
                style={{ animationDelay: `${0.8 + index * 0.1}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${game.color} group-hover:scale-110 transition-transform duration-700`} />

                {/* Gentle overlay */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />

                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-2xl font-bold text-white mb-2">{gameName}</h3>
                    <p className="text-sm text-gray-200 opacity-90 leading-relaxed">{game.desc}</p>
                  </div>

                  <div className="absolute top-6 right-6 w-12 h-12 glass rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <Play size={20} className="text-white" fill="white" />
                  </div>
                </div>
              </Link>
            );
          })}

        </div>
      </div>

    </div>
  );
}