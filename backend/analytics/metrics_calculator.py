"""
Metrics Calculator
Calculates comprehensive metrics from raw user data
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta, date
from database import supabase
import statistics


class MetricsCalculator:
    """Calculate comprehensive metrics for user analytics"""
    
    def __init__(self):
        self.db = supabase
    
    async def calculate_all_metrics(
        self,
        user_id: str,
        start_date: datetime,
        end_date: datetime,
        metric_type: str = "weekly"
    ) -> Dict[str, Any]:
        """
        Calculate all metrics for a given period
        
        Args:
            user_id: User UUID
            start_date: Period start date
            end_date: Period end date
            metric_type: 'daily' or 'weekly'
            
        Returns:
            Dictionary containing all calculated metrics
        """
        
        engagement = await self.calculate_engagement_metrics(user_id, start_date, end_date)
        mood = await self.calculate_mood_metrics(user_id, start_date, end_date)
        performance = await self.calculate_performance_metrics(user_id, start_date, end_date)
        therapeutic = await self.calculate_therapeutic_progress(user_id, start_date, end_date)
        
        return {
            "engagement": engagement,
            "mood": mood,
            "performance": performance,
            "therapeutic_progress": therapeutic,
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
                "type": metric_type
            }
        }
    
    async def calculate_engagement_metrics(
        self,
        user_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Calculate user engagement metrics"""
        
        try:
            # Query game sessions
            sessions_result = self.db.table("game_sessions").select(
                "game_name, duration_seconds, created_at"
            ).eq("user_id", user_id).gte(
                "created_at", start_date.isoformat()
            ).lte(
                "created_at", end_date.isoformat()
            ).execute()
            
            sessions = sessions_result.data or []
            
            # Calculate metrics
            total_sessions = len(sessions)
            total_playtime = sum(s.get("duration_seconds", 0) for s in sessions)
            unique_games = len(set(s["game_name"] for s in sessions))
            
            # Calculate daily average
            days_in_period = (end_date - start_date).days + 1
            daily_average = round(total_sessions / days_in_period, 2) if days_in_period > 0 else 0
            
            # Calculate streak days (consecutive days with at least 1 session)
            streak_days = await self._calculate_streak(user_id, end_date)
            
            return {
                "total_sessions": total_sessions,
                "total_playtime_minutes": round(total_playtime / 60, 1),
                "total_playtime_seconds": total_playtime,
                "unique_games_played": unique_games,
                "daily_average": daily_average,
                "streak_days": streak_days,
                "games_list": list(set(s["game_name"] for s in sessions))
            }
            
        except Exception as e:
            print(f"Error calculating engagement metrics: {e}")
            return self._empty_engagement_metrics()
    
    async def calculate_mood_metrics(
        self,
        user_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Calculate mood-related metrics from diary entries"""
        
        try:
            # Query diary entries
            diary_result = self.db.table("diary_entries").select(
                "mood_rating, entry_date, created_at"
            ).eq("user_id", user_id).gte(
                "created_at", start_date.isoformat()
            ).lte(
                "created_at", end_date.isoformat()
            ).execute()
            
            entries = diary_result.data or []
            
            if not entries:
                return self._empty_mood_metrics()
            
            # Extract mood ratings
            mood_ratings = [e["mood_rating"] for e in entries if e.get("mood_rating")]
            
            if not mood_ratings:
                return self._empty_mood_metrics()
            
            # Calculate metrics
            avg_mood = round(statistics.mean(mood_ratings), 2)
            mood_variance = round(statistics.variance(mood_ratings), 2) if len(mood_ratings) > 1 else 0
            mood_stability = round(1 - (mood_variance / 100), 2)  # 0-1 scale
            
            # Find best and worst days
            entries_with_mood = [e for e in entries if e.get("mood_rating")]
            best_entry = max(entries_with_mood, key=lambda x: x["mood_rating"])
            worst_entry = min(entries_with_mood, key=lambda x: x["mood_rating"])
            
            # Determine trend
            if len(mood_ratings) >= 3:
                first_half = mood_ratings[:len(mood_ratings)//2]
                second_half = mood_ratings[len(mood_ratings)//2:]
                avg_first = statistics.mean(first_half)
                avg_second = statistics.mean(second_half)
                
                if avg_second > avg_first + 0.5:
                    trend = "improving"
                elif avg_second < avg_first - 0.5:
                    trend = "declining"
                else:
                    trend = "stable"
            else:
                trend = "insufficient_data"
            
            return {
                "average_mood": avg_mood,
                "mood_trend": trend,
                "mood_stability": mood_stability,
                "mood_variance": mood_variance,
                "mood_entries_count": len(entries),
                "best_day": {
                    "date": best_entry.get("entry_date"),
                    "mood": best_entry["mood_rating"]
                },
                "worst_day": {
                    "date": worst_entry.get("entry_date"),
                    "mood": worst_entry["mood_rating"]
                },
                "mood_range": {
                    "min": min(mood_ratings),
                    "max": max(mood_ratings)
                }
            }
            
        except Exception as e:
            print(f"Error calculating mood metrics: {e}")
            return self._empty_mood_metrics()
    
    async def calculate_performance_metrics(
        self,
        user_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Calculate game performance metrics"""
        
        try:
            # Query game sessions with scores
            sessions_result = self.db.table("game_sessions").select(
                "game_name, score, created_at"
            ).eq("user_id", user_id).gte(
                "created_at", start_date.isoformat()
            ).lte(
                "created_at", end_date.isoformat()
            ).execute()
            
            sessions = sessions_result.data or []
            
            if not sessions:
                return self._empty_performance_metrics()
            
            # Calculate overall average score
            scores = [s["score"] for s in sessions if s.get("score") is not None]
            avg_score = round(statistics.mean(scores), 2) if scores else 0
            
            # Group by game type and calculate averages
            by_game_type = {}
            for session in sessions:
                game_name = session["game_name"]
                score = session.get("score")
                
                if score is not None:
                    if game_name not in by_game_type:
                        by_game_type[game_name] = []
                    by_game_type[game_name].append(score)
            
            # Calculate category scores (focus, memory, emotional)
            game_categories = {
                "focus": ["Focus Game", "Attention Training", "Concentration Test"],
                "memory": ["Memory Game", "Memory Match", "Recall Challenge"],
                "emotional": ["Emotion Match", "Emotion Recognition", "Emotional Intelligence"]
            }
            
            category_scores = {}
            for category, game_names in game_categories.items():
                category_scores_list = []
                for game in game_names:
                    if game in by_game_type:
                        category_scores_list.extend(by_game_type[game])
                
                if category_scores_list:
                    category_scores[category] = round(statistics.mean(category_scores_list), 2)
                else:
                    category_scores[category] = 0
            
            # Determine trend
            if len(scores) >= 5:
                first_half = scores[:len(scores)//2]
                second_half = scores[len(scores)//2:]
                avg_first = statistics.mean(first_half)
                avg_second = statistics.mean(second_half)
                
                improvement = ((avg_second - avg_first) / avg_first * 100) if avg_first > 0 else 0
                
                if improvement > 5:
                    trend = "improving"
                elif improvement < -5:
                    trend = "declining"
                else:
                    trend = "stable"
            else:
                trend = "insufficient_data"
            
            return {
                "avg_game_score": avg_score,
                "score_trend": trend,
                "total_games_played": len(sessions),
                "focus_score": category_scores.get("focus", 0),
                "memory_score": category_scores.get("memory", 0),
                "emotional_score": category_scores.get("emotional", 0),
                "by_game_type": {
                    game: round(statistics.mean(scores), 2)
                    for game, scores in by_game_type.items()
                },
                "score_range": {
                    "min": min(scores) if scores else 0,
                    "max": max(scores) if scores else 0
                }
            }
            
        except Exception as e:
            print(f"Error calculating performance metrics: {e}")
            return self._empty_performance_metrics()
    
    async def calculate_therapeutic_progress(
        self,
        user_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Calculate therapeutic progress metrics"""
        
        try:
            # Query questionnaire responses
            try:
                questionnaire_result = self.db.table("post_game_responses").select(
                    "responses, created_at"
                ).eq("user_id", user_id).gte(
                    "created_at", start_date.isoformat()
                ).lte(
                    "created_at", end_date.isoformat()
                ).execute()
                
                questionnaires = questionnaire_result.data or []
                
                # Calculate positivity
                if questionnaires:
                    total_positive = 0
                    total_responses = 0
                    for q in questionnaires:
                        responses = q.get("responses", [])
                        if responses:
                            total_positive += sum(responses)
                            total_responses += len(responses)
                    
                    positivity = round((total_positive / total_responses * 100), 2) if total_responses > 0 else 0
                else:
                    positivity = 0
                    
            except Exception:
                positivity = 0
                questionnaires = []
            
            # Query diary entries
            diary_result = self.db.table("diary_entries").select(
                "id"
            ).eq("user_id", user_id).gte(
                "created_at", start_date.isoformat()
            ).lte(
                "created_at", end_date.isoformat()
            ).execute()
            
            diary_count = len(diary_result.data or [])
            
            # Query chat messages
            chat_result = self.db.table("chat_messages").select(
                "role"
            ).eq("user_id", user_id).eq(
                "role", "user"
            ).gte(
                "created_at", start_date.isoformat()
            ).lte(
                "created_at", end_date.isoformat()
            ).execute()
            
            chat_count = len(chat_result.data or [])
            
            return {
                "questionnaire_positivity": positivity,
                "questionnaires_completed": len(questionnaires),
                "diary_entries_count": diary_count,
                "chat_messages_count": chat_count,
                "total_therapeutic_interactions": len(questionnaires) + diary_count + chat_count
            }
            
        except Exception as e:
            print(f"Error calculating therapeutic progress: {e}")
            return self._empty_therapeutic_metrics()
    
    async def _calculate_streak(self, user_id: str, end_date: datetime) -> int:
        """Calculate current streak of consecutive days with activity"""
        
        try:
            current_date = end_date.date()
            streak = 0
            
            for i in range(365):  # Check up to 365 days back
                check_date = current_date - timedelta(days=i)
                
                # Check if there's any activity on this day
                sessions_result = self.db.table("game_sessions").select(
                    "id"
                ).eq("user_id", user_id).gte(
                    "created_at", datetime.combine(check_date, datetime.min.time()).isoformat()
                ).lt(
                    "created_at", datetime.combine(check_date + timedelta(days=1), datetime.min.time()).isoformat()
                ).limit(1).execute()
                
                if sessions_result.data:
                    streak += 1
                else:
                    break
            
            return streak
            
        except Exception as e:
            print(f"Error calculating streak: {e}")
            return 0
    
    # Empty metric templates
    def _empty_engagement_metrics(self) -> Dict[str, Any]:
        return {
            "total_sessions": 0,
            "total_playtime_minutes": 0,
            "total_playtime_seconds": 0,
            "unique_games_played": 0,
            "daily_average": 0,
            "streak_days": 0,
            "games_list": []
        }
    
    def _empty_mood_metrics(self) -> Dict[str, Any]:
        return {
            "average_mood": 0,
            "mood_trend": "no_data",
            "mood_stability": 0,
            "mood_variance": 0,
            "mood_entries_count": 0,
            "best_day": None,
            "worst_day": None,
            "mood_range": {"min": 0, "max": 0}
        }
    
    def _empty_performance_metrics(self) -> Dict[str, Any]:
        return {
            "avg_game_score": 0,
            "score_trend": "no_data",
            "total_games_played": 0,
            "focus_score": 0,
            "memory_score": 0,
            "emotional_score": 0,
            "by_game_type": {},
            "score_range": {"min": 0, "max": 0}
        }
    
    def _empty_therapeutic_metrics(self) -> Dict[str, Any]:
        return {
            "questionnaire_positivity": 0,
            "questionnaires_completed": 0,
            "diary_entries_count": 0,
            "chat_messages_count": 0,
            "total_therapeutic_interactions": 0
        }
