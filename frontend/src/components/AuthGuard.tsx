import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthGuard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // 1. Check if a session exists (Are you logged in?)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
        return;
      }

      // --- THE CRITICAL FIX ---
      // We check LocalStorage FIRST. If this is "true", we stop checking and let you in.
      const localCompletion = localStorage.getItem('hasCompletedQuestionnaire');
      
      if (localCompletion === 'true') {
        setLoading(false); // Stop loading
        return;            // Render the Dashboard (Outlet)
      }

      // 2. Fallback: Only check Database if LocalStorage was empty
      console.log("Checking database for profile...");
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_type')
        .eq('id', session.user.id)
        .single();

      // If DB says we have a profile, update LocalStorage for next time
      if (profile && profile.profile_type) {
        localStorage.setItem('hasCompletedQuestionnaire', 'true');
        setLoading(false);
        return;
      }

      // 3. If BOTH failed, then go to Questionnaire
      console.log("⚠️ No profile found. Redirecting to Questionnaire...");
      navigate("/questionnaire");

    } catch (error) {
      console.error("Auth Guard Error:", error);
      // If error, better to be safe and go to login
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0616] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-purple-300 font-medium animate-pulse">Loading NeuroNest...</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}