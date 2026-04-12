// src/api/neuroNestApi.ts

import { supabase } from "../lib/supabase";
import { logger } from "../utils/logger";

// Use environment variable or fallback to same-origin (proxy mode)
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// --- Error Types ---
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// --- Interfaces ---
export interface QuestionnaireResponse {
  primary: string;
  secondary?: string | null;
  recommended_games: string[];
  scores: Record<string, number>;
}

export interface ChatResponse {
  response: string;
}

// --- Helper Functions ---
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new ApiError(
      `API request failed: ${response.statusText}`,
      response.status,
      errorText
    );
  }

  try {
    const data = await response.json();
    return data as T;
  } catch (error) {
    throw new ApiError('Failed to parse API response');
  }
}

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  retries = 2
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      return await handleApiResponse<T>(response);
    } catch (error) {
      lastError = error as Error;
      logger.warn(`API request failed (attempt ${i + 1}/${retries + 1})`, error);

      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  throw lastError || new ApiError('Request failed after retries');
}

// --- 1. Questionnaire ---
export async function submitQuestionnaire(
  answers: Record<number, number>
): Promise<QuestionnaireResponse> {
  if (!answers || Object.keys(answers).length === 0) {
    throw new ApiError('Invalid questionnaire answers');
  }

  return fetchWithRetry<QuestionnaireResponse>(
    `${API_BASE}/submit-questionnaire`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    }
  );
}

// --- 2. Chat (This was missing!) ---
export async function sendChatMessage(
  message: string,
  history: { role: string; content: string }[],
  profile: string,
  gameStats: string | Record<string, unknown>
): Promise<ChatResponse> {
  if (!message?.trim()) {
    throw new ApiError('Message cannot be empty');
  }

  return fetchWithRetry<ChatResponse>(
    `${API_BASE}/chat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: history || [],
        profile: profile || 'General',
        game_stats: gameStats
      }),
    }
  );
}

// --- 3. Game Session (This was missing!) ---
export async function submitGameSession(data: {
  user_id: string;
  game_name: string;
  duration_seconds: number;
  score: number;
  high_score?: number;
  mistakes?: number;
  difficulty_level?: number;
  feedback?: unknown;
}): Promise<{ success: boolean; message: string }> {
  if (!data.user_id || !data.game_name) {
    throw new ApiError('Missing required game session data');
  }

  return fetchWithRetry<{ success: boolean; message: string }>(
    `${API_BASE}/submit-game-session`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
}

export async function getPersonalBest(gameName: string): Promise<number> {
  if (!gameName) {
    logger.warn('getPersonalBest called without game name');
    return 0;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
      .from('game_sessions')
      .select('score')
      .eq('user_id', user.id)
      .eq('game_name', gameName)
      .order('score', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error("Error fetching personal best:", error);
      return 0;
    }

    return data?.score || 0;
  } catch (err) {
    logger.error("Error in getPersonalBest:", err);
    return 0;
  }
}

// --- 4. Contact Info Update ---
export async function updateContactInfo(data: {
  address: string;
  emergency_phone: string;
}): Promise<{ status: string; message: string }> {
  if (!data.address?.trim() || !data.emergency_phone?.trim()) {
    throw new ApiError('Address and emergency phone are required');
  }

  return fetchWithRetry<{ status: string; message: string }>(
    `${API_BASE}/update-contact-info`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
}

// --- 5. Post-Game Questionnaire ---
export interface PostGameQuestionnaireData {
  game_name: string;
  session_duration: number;
  profile_category: string;
  questions: string[];
  responses: boolean[];
}

export interface SessionTimeData {
  game_name: string;
  session_duration: number;
}

export interface SessionCheckResponse {
  should_trigger_questionnaire: boolean;
  total_duration: number;
  available_questions_count: number;
  category: string;
}

export interface UnusedQuestionsResponse {
  eligible: boolean;
  category: string;
  unused_questions: string[];
  available_count: number;
}

export async function addSessionTime(
  data: SessionTimeData
): Promise<SessionCheckResponse> {
  // Get the current user from Supabase
  const { data: { user } } = await supabase.auth.getUser();

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  // Add authorization header if user is authenticated
  if (user?.id) {
    headers["Authorization"] = `Bearer ${user.id}`;
  }

  const res = await fetch(`${API_BASE}/api/questionnaire/add-session-time`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to add session time");
  return res.json();
}

export async function getUnusedQuestions(
  category: string
): Promise<UnusedQuestionsResponse> {
  // Get the current user from Supabase
  const { data: { user } } = await supabase.auth.getUser();

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  // Add authorization header if user is authenticated
  if (user?.id) {
    headers["Authorization"] = `Bearer ${user.id}`;
  }

  const res = await fetch(`${API_BASE}/api/questionnaire/get-unused-questions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ category }),
  });

  if (!res.ok) throw new Error("Failed to get unused questions");
  return res.json();
}

export async function checkQuestionnaireEligibility(
  gameName: string
): Promise<{ eligible: boolean; category: string; last_completed?: string }> {
  const res = await fetch(`${API_BASE}/api/questionnaire/check-questionnaire-eligibility?game_name=${encodeURIComponent(gameName)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error("Failed to check questionnaire eligibility");
  return res.json();
}

export async function submitPostGameQuestionnaire(
  data: PostGameQuestionnaireData
): Promise<{ success: boolean; message: string }> {
  // Get the current user from Supabase
  const { data: { user } } = await supabase.auth.getUser();

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  // Add authorization header if user is authenticated
  if (user?.id) {
    headers["Authorization"] = `Bearer ${user.id}`;
  }

  const res = await fetch(`${API_BASE}/api/questionnaire/submit-post-game-questionnaire`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to submit post-game questionnaire");
  return res.json();
}

export async function getWeeklyReportData(
  days: number = 7
): Promise<{
  report_data: Record<string, any>;
  period_days: number;
  generated_at: string;
}> {
  const res = await fetch(`${API_BASE}/api/questionnaire/weekly-report-data?days=${days}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error("Failed to get weekly report data");
  return res.json();
}

// --- 6. Enhanced Weekly Reports ---
export interface WeeklyReportRequest {
  userId: string;
  checkinData: Record<string, string>;
}

export interface ClinicalSynthesis {
  clinical_observation: string;
  key_achievement: string;
  focus_area: string;
}

export interface WeeklyReportResponse {
  status: string;
  report: ClinicalSynthesis;
  raw_data: Record<string, any>;
}

export async function generateEnhancedWeeklyReport(
  data: WeeklyReportRequest
): Promise<WeeklyReportResponse> {
  const res = await fetch(`${API_BASE}/api/reports/generate-enhanced-weekly-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to generate enhanced weekly report");
  return res.json();
}

export async function getLatestWeeklyReport(): Promise<{
  status: string;
  report?: ClinicalSynthesis;
  raw_data?: Record<string, any>;
  report_date?: string;
  created_at?: string;
}> {
  const res = await fetch(`${API_BASE}/api/reports/get-latest-weekly-report`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error("Failed to get latest weekly report");
  return res.json();
}