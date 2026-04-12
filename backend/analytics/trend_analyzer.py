"""
Trend Analyzer
Analyzes trends, calculates week-over-week changes, and generates insights
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from database import supabase
import statistics


class TrendAnalyzer:
    """Analyze trends and generate comparative insights"""
    
    def __init__(self):
        self.db = supabase
    
    def compare_with_previous_period(
        self,
        current_metrics: Dict[str, Any],
        previous_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate week-over-week or day-over-day comparisons
        
        Args:
            current_metrics: Current period metrics
            previous_metrics: Previous period metrics
            
        Returns:
            Dictionary with percentage changes and insights
        """
        
        comparisons = {
            "engagement": self._compare_engagement(current_metrics, previous_metrics),
            "mood": self._compare_mood(current_metrics, previous_metrics),
            "performance": self._compare_performance(current_metrics, previous_metrics),
            "therapeutic": self._compare_therapeutic(current_metrics, previous_metrics)
        }
        
        # Generate overall insights
        insights = self._generate_comparative_insights(comparisons)
        
        return {
            "comparisons": comparisons,
            "insights": insights,
            "overall_trend": self._determine_overall_trend(comparisons)
        }
    
    def _compare_engagement(
        self,
        current: Dict[str, Any],
        previous: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Compare engagement metrics"""
        
        curr_eng = current.get("engagement", {})
        prev_eng = previous.get("engagement", {})
        
        return {
            "sessions_change": self._calculate_change(
                curr_eng.get("total_sessions", 0),
                prev_eng.get("total_sessions", 0)
            ),
            "playtime_change": self._calculate_change(
                curr_eng.get("total_playtime_seconds", 0),
                prev_eng.get("total_playtime_seconds", 0)
            ),
            "streak_change": self._calculate_absolute_change(
                curr_eng.get("streak_days", 0),
                prev_eng.get("streak_days", 0)
            )
        }
    
    def _compare_mood(
        self,
        current: Dict[str, Any],
        previous: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Compare mood metrics"""
        
        curr_mood = current.get("mood", {})
        prev_mood = previous.get("mood", {})
        
        return {
            "mood_change": self._calculate_absolute_change(
                curr_mood.get("average_mood", 0),
                prev_mood.get("average_mood", 0)
            ),
            "stability_change": self._calculate_absolute_change(
                curr_mood.get("mood_stability", 0),
                prev_mood.get("mood_stability", 0)
            ),
            "entries_change": self._calculate_change(
                curr_mood.get("mood_entries_count", 0),
                prev_mood.get("mood_entries_count", 0)
            )
        }
    
    def _compare_performance(
        self,
        current: Dict[str, Any],
        previous: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Compare performance metrics"""
        
        curr_perf = current.get("performance", {})
        prev_perf = previous.get("performance", {})
        
        return {
            "score_change": self._calculate_change(
                curr_perf.get("avg_game_score", 0),
                prev_perf.get("avg_game_score", 0)
            ),
            "focus_change": self._calculate_change(
                curr_perf.get("focus_score", 0),
                prev_perf.get("focus_score", 0)
            ),
            "memory_change": self._calculate_change(
                curr_perf.get("memory_score", 0),
                prev_perf.get("memory_score", 0)
            ),
            "emotional_change": self._calculate_change(
                curr_perf.get("emotional_score", 0),
                prev_perf.get("emotional_score", 0)
            )
        }
    
    def _compare_therapeutic(
        self,
        current: Dict[str, Any],
        previous: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Compare therapeutic metrics"""
        
        curr_ther = current.get("therapeutic_progress", {})
        prev_ther = previous.get("therapeutic_progress", {})
        
        return {
            "positivity_change": self._calculate_change(
                curr_ther.get("questionnaire_positivity", 0),
                prev_ther.get("questionnaire_positivity", 0)
            ),
            "diary_change": self._calculate_change(
                curr_ther.get("diary_entries_count", 0),
                prev_ther.get("diary_entries_count", 0)
            ),
            "chat_change": self._calculate_change(
                curr_ther.get("chat_messages_count", 0),
                prev_ther.get("chat_messages_count", 0)
            )
        }
    
    def _calculate_change(self, current: float, previous: float) -> Dict[str, Any]:
        """Calculate percentage change"""
        
        if previous == 0:
            if current > 0:
                return {
                    "value": current,
                    "percentage": 100,
                    "formatted": "+100%",
                    "direction": "up"
                }
            else:
                return {
                    "value": 0,
                    "percentage": 0,
                    "formatted": "0%",
                    "direction": "neutral"
                }
        
        change = ((current - previous) / abs(previous)) * 100
        
        return {
            "value": round(current - previous, 2),
            "percentage": round(change, 2),
            "formatted": f"{'+' if change >= 0 else ''}{round(change, 1)}%",
            "direction": "up" if change > 0 else ("down" if change < 0 else "neutral")
        }
    
    def _calculate_absolute_change(self, current: float, previous: float) -> Dict[str, Any]:
        """Calculate absolute change (not percentage)"""
        
        change = current - previous
        
        return {
            "value": round(change, 2),
            "formatted": f"{'+' if change >= 0 else ''}{round(change, 2)}",
            "direction": "up" if change > 0 else ("down" if change < 0 else "neutral")
        }
    
    def _generate_comparative_insights(self, comparisons: Dict[str, Any]) -> List[str]:
        """Generate human-readable insights from comparisons"""
        
        insights = []
        
        # Engagement insights
        engagement = comparisons.get("engagement", {})
        sessions_change = engagement.get("sessions_change", {})
        if abs(sessions_change.get("percentage", 0)) >= 10:
            direction = "increased" if sessions_change.get("direction") == "up" else "decreased"
            insights.append(
                f"Your engagement {direction} by {abs(sessions_change.get('percentage', 0)):.0f}% this period."
            )
        
        # Mood insights
        mood = comparisons.get("mood", {})
        mood_change = mood.get("mood_change", {})
        if abs(mood_change.get("value", 0)) >= 0.5:
            direction = "improved" if mood_change.get("direction") == "up" else "decreased"
            insights.append(
                f"Your mood {direction} by {abs(mood_change.get('value', 0)):.1f} points."
            )
        
        # Performance insights
        performance = comparisons.get("performance", {})
        score_change = performance.get("score_change", {})
        if abs(score_change.get("percentage", 0)) >= 5:
            direction = "improved" if score_change.get("direction") == "up" else "declined"
            insights.append(
                f"Your game performance {direction} by {abs(score_change.get('percentage', 0)):.0f}%."
            )
        
        # Therapeutic insights
        therapeutic = comparisons.get("therapeutic", {})
        positivity = therapeutic.get("positivity_change", {})
        if abs(positivity.get("percentage", 0)) >= 10:
            direction = "increased" if positivity.get("direction") == "up" else "decreased"
            insights.append(
                f"Your therapeutic positivity {direction} by {abs(positivity.get('percentage', 0)):.0f}%."
            )
        
        return insights if insights else ["Your metrics remain stable compared to the previous period."]
    
    def _determine_overall_trend(self, comparisons: Dict[str, Any]) -> str:
        """Determine overall trend direction"""
        
        scores = []
        
        # Score each category (-1, 0, 1)
        for category in ["engagement", "mood", "performance", "therapeutic"]:
            category_data = comparisons.get(category, {})
            
            for key, value in category_data.items():
                direction = value.get("direction")
                if direction == "up":
                    scores.append(1)
                elif direction == "down":
                    scores.append(-1)
                else:
                    scores.append(0)
        
        if not scores:
            return "stable"
        
        avg_score = sum(scores) / len(scores)
        
        if avg_score > 0.3:
            return "improving"
        elif avg_score < -0.3:
            return "declining"
        else:
            return "stable"
    
    async def predict_mood_forecast(
        self,
        user_id: str,
        days_ahead: int = 7
    ) -> List[Dict[str, Any]]:
        """
        Simple mood forecasting using moving average
        
        Args:
            user_id: User UUID
            days_ahead: Number of days to forecast
            
        Returns:
            List of predicted mood values
        """
        
        try:
            # Get last 30 days of mood data
            thirty_days_ago = datetime.now() - timedelta(days=30)
            
            diary_result = self.db.table("diary_entries").select(
                "mood_rating, entry_date, created_at"
            ).eq("user_id", user_id).gte(
                "created_at", thirty_days_ago.isoformat()
            ).order("created_at", desc=False).execute()
            
            entries = diary_result.data or []
            
            if len(entries) < 3:
                return []  # Not enough data for forecasting
            
            # Extract mood ratings
            moods = [e["mood_rating"] for e in entries if e.get("mood_rating")]
            
            # Calculate moving average (simple forecast)
            forecast = []
            window_size = min(7, len(moods))
            
            for i in range(days_ahead):
                # Use last window_size values to predict next
                recent_moods = moods[-window_size:]
                predicted_mood = round(statistics.mean(recent_moods), 1)
                
                forecast_date = datetime.now().date() + timedelta(days=i+1)
                forecast.append({
                    "date": forecast_date.isoformat(),
                    "predicted_mood": predicted_mood,
                    "confidence": self._calculate_confidence(moods)
                })
                
                # Add predicted value to moods for next iteration
                moods.append(predicted_mood)
            
            return forecast
            
        except Exception as e:
            print(f"Error generating mood forecast: {e}")
            return []
    
    def _calculate_confidence(self, mood_data: List[float]) -> str:
        """Calculate confidence level for forecast"""
        
        if len(mood_data) < 7:
            return "low"
        
        # Calculate variance
        variance = statistics.variance(mood_data[-14:]) if len(mood_data) >= 14 else statistics.variance(mood_data)
        
        # Lower variance = higher confidence
        if variance < 1:
            return "high"
        elif variance < 3:
            return "medium"
        else:
            return "low"
