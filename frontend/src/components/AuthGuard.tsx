import { useEffect, useState, useCallback } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { logger } from "../utils/logger";

export default function AuthGuard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkUser = useCallback(async () => {
    try {
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        navigate("/login");
        return;
      }

      const localCompletion = localStorage.getItem('hasCompletedQuestionnaire');

      if (localCompletion === 'true') {
        setLoading(false);
        return;
      }

      logger.debug("Checking database for profile...");

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('profile_type')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        logger.error("Profile check error", profileError);
      }

      if (profile?.profile_type) {
        localStorage.setItem('hasCompletedQuestionnaire', 'true');
        setLoading(false);
        return;
      }

      logger.debug("No profile found. Redirecting to Questionnaire...");
      navigate("/questionnaire");

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication error';
      logger.error("Auth Guard Error:", err);
      setError(errorMessage);
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

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

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0616] flex items-center justify-center p-6">
        <div className="card-calm text-center max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">Authentication Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button onClick={checkUser} className="btn-calm">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
