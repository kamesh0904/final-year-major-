import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { User, Trophy, Flame, MessageSquare, Camera, ArrowLeft, Loader2, MapPin, Phone, Edit3, Save, X, Gamepad2 } from "lucide-react";
import WeeklyReportButton from "../components/WeeklyReportButton";
import DailyReportButton from "../components/DailyReportButton";
import { updateContactInfo } from "../api/neuroNestApi";
import DiarySection from "../components/DiarySection";
import TodaysGentleGoal from "../components/TodaysGentleGoal";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [highScores, setHighScores] = useState<any[]>([]);
  const [allGameScores, setAllGameScores] = useState<any[]>([]);
  const [editingContact, setEditingContact] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    address: "",
    emergency_phone: ""
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // 1. Get Profile & Streak
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      // Set contact info from profile data
      setContactInfo({
        address: profileData?.address || "",
        emergency_phone: profileData?.emergency_phone || ""
      });

      // 2. Get High Scores (Best score per game)
      const { data: sessions } = await supabase
        .from('game_sessions')
        .select('game_name, score, created_at')
        .eq('user_id', user.id)
        .order('score', { ascending: false });

      if (sessions) {
        // Get best scores per game
        const bests: Record<string, number> = {};
        sessions.forEach((s: any) => {
          if (!bests[s.game_name] || s.score > bests[s.game_name]) {
            bests[s.game_name] = s.score;
          }
        });
        setHighScores(Object.entries(bests).map(([game, score]) => ({ game, score })));

        // Get all game scores for comprehensive view
        const gameStats: Record<string, { totalScore: number, sessions: number, bestScore: number }> = {};
        sessions.forEach((s: any) => {
          if (!gameStats[s.game_name]) {
            gameStats[s.game_name] = { totalScore: 0, sessions: 0, bestScore: 0 };
          }
          gameStats[s.game_name].totalScore += s.score;
          gameStats[s.game_name].sessions += 1;
          gameStats[s.game_name].bestScore = Math.max(gameStats[s.game_name].bestScore, s.score);
        });

        setAllGameScores(
          Object.entries(gameStats).map(([game, stats]) => ({
            game,
            ...stats,
            averageScore: Math.round(stats.totalScore / stats.sessions)
          }))
        );
      }

    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update Profile Database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      alert("Avatar updated successfully!");

    } catch (error: any) {
      console.error(error);
      alert("Error uploading avatar: " + (error.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  const handleSaveContactInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update in Supabase directly (since we have the client)
      const { error } = await supabase
        .from('profiles')
        .update({
          address: contactInfo.address,
          emergency_phone: contactInfo.emergency_phone
        })
        .eq('id', user.id);

      if (error) throw error;

      // Also call the backend API for any additional processing
      try {
        await updateContactInfo({
          address: contactInfo.address,
          emergency_phone: contactInfo.emergency_phone
        });
      } catch (apiError) {
        console.warn("Backend API call failed, but Supabase update succeeded:", apiError);
      }

      setProfile({ ...profile, ...contactInfo });
      setEditingContact(false);
      alert("Contact information updated successfully!");

    } catch (error: any) {
      console.error("Error updating contact info:", error);
      alert("Error updating contact information: " + (error.message || "Unknown error"));
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse-slow mx-auto mb-4"></div>
        <p className="text-gray-400 animate-fade-in">Loading your sanctuary...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-8 px-6 md:px-12 pb-24">
      {/* Gentle background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300 group hover-lift"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to your space
        </button>

        {/* Profile Header */}
        <div className="card-calm mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-2 border-purple-400/30 overflow-hidden glass flex items-center justify-center shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-purple-300/70" />
                )}
              </div>
              <label className={`absolute inset-0 glass-dark rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${uploading ? "opacity-100" : "opacity-0 hover:opacity-100"}`}>
                {uploading ? (
                  <Loader2 size={24} className="text-white animate-spin" />
                ) : (
                  <>
                    <Camera size={20} className="text-white mb-1" />
                    <span className="text-xs font-medium text-white">Change</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
              </label>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">{profile?.username || "Neuro Explorer"}</h1>
              <p className="text-purple-300 font-medium mb-4">Level {Math.floor((profile?.xp || 0) / 1000) + 1} • {profile?.xp || 0} XP</p>

              {/* Quick Stats */}
              <div className="flex justify-center md:justify-start gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame size={16} className="text-orange-400" />
                    <span className="text-xl font-bold text-white">{profile?.streak_count || 0}</span>
                  </div>
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Day Streak</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy size={16} className="text-yellow-400" />
                    <span className="text-xl font-bold text-white">{highScores.length}</span>
                  </div>
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Games</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate("/chat")}
                className="btn-calm flex items-center gap-3 px-6 py-3"
              >
                <MessageSquare size={18} /> Talk to Companion
              </button>
              <DailyReportButton />
              <WeeklyReportButton />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">

          {/* Today's Gentle Goal */}
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <TodaysGentleGoal userId={profile?.id || ""} />
          </div>

          {/* Personal Bests */}
          <div className="card-calm animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 glass rounded-2xl flex items-center justify-center">
                  <Trophy className="text-yellow-400" size={20} />
                </div>
                Personal Bests
              </h2>
            </div>

            {highScores.length === 0 ? (
              <div className="text-center py-12 glass rounded-3xl border border-white/10 border-dashed">
                <div className="w-16 h-16 glass rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="text-yellow-400/50" size={24} />
                </div>
                <p className="text-gray-400 text-lg mb-4">Your journey begins here</p>
                <button
                  onClick={() => navigate("/games")}
                  className="btn-warm"
                >
                  Start Your First Game
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {highScores.map((score, idx) => (
                  <div key={idx} className="glass rounded-2xl p-5 hover-lift group border border-white/10 hover:border-purple-400/30 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-200 group-hover:text-white transition-colors">{score.game}</span>
                      <span className="font-mono text-lg text-emerald-400 font-bold">{score.score.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Game Statistics */}
          {allGameScores.length > 0 && (
            <div className="card-calm animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 glass rounded-2xl flex items-center justify-center">
                    <Gamepad2 className="text-purple-400" size={20} />
                  </div>
                  Game Statistics
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {allGameScores.map((gameStats, idx) => (
                  <div key={idx} className="glass rounded-2xl p-5 border border-white/10 hover:border-purple-400/20 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-white">{gameStats.game}</h3>
                      <span className="text-sm text-gray-400">{gameStats.sessions} sessions</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-emerald-400 font-bold text-lg">{gameStats.bestScore.toLocaleString()}</div>
                        <div className="text-gray-400">Best</div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-400 font-bold text-lg">{gameStats.averageScore.toLocaleString()}</div>
                        <div className="text-gray-400">Average</div>
                      </div>
                      <div className="text-center">
                        <div className="text-purple-400 font-bold text-lg">{gameStats.totalScore.toLocaleString()}</div>
                        <div className="text-gray-400">Total</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          <div className="card-calm animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 glass rounded-2xl flex items-center justify-center">
                  <Phone className="text-emerald-400" size={20} />
                </div>
                Emergency Contact
              </h2>
              {!editingContact ? (
                <button
                  onClick={() => setEditingContact(true)}
                  className="p-2 text-gray-400 hover:text-white transition-all duration-300 rounded-xl hover:bg-white/10"
                >
                  <Edit3 size={16} />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveContactInfo}
                    className="p-2 text-emerald-400 hover:text-emerald-300 transition-all duration-300 rounded-xl hover:bg-emerald-400/10"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingContact(false);
                      setContactInfo({
                        address: profile?.address || "",
                        emergency_phone: profile?.emergency_phone || ""
                      });
                    }}
                    className="p-2 text-red-400 hover:text-red-300 transition-all duration-300 rounded-xl hover:bg-red-400/10"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <MapPin size={14} className="text-blue-400" /> Address
                </label>
                {editingContact ? (
                  <textarea
                    value={contactInfo.address}
                    onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                    placeholder="Enter your address..."
                    className="input-calm resize-none w-full"
                    rows={3}
                  />
                ) : (
                  <div className="glass rounded-2xl p-4 text-gray-200 min-h-[80px] flex items-center">
                    {profile?.address || "No address provided"}
                  </div>
                )}
              </div>

              {/* Emergency Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Phone size={14} className="text-emerald-400" /> Emergency Phone Number
                </label>
                {editingContact ? (
                  <input
                    type="tel"
                    value={contactInfo.emergency_phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, emergency_phone: e.target.value })}
                    placeholder="Enter emergency contact number..."
                    className="input-calm w-full"
                  />
                ) : (
                  <div className="glass rounded-2xl p-4 text-gray-200 flex items-center">
                    {profile?.emergency_phone || "No emergency contact provided"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Personal Diary */}
          <div className="animate-fade-in" style={{ animationDelay: '1.0s' }}>
            <DiarySection userId={profile?.id || ""} />
          </div>

        </div>
      </div>
    </div>
  );
}