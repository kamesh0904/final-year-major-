"""
Chart Data Generator
Generates chart-ready data structures for frontend visualizations
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from database import supabase
from collections import defaultdict


class ChartDataGenerator:
    """Generate chart-ready data for frontend visualizations"""
    
    def __init__(self):
        self.db = supabase
    
    async def generate_all_chart_data(
        self,
        user_id: str,
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Generate all chart data for reports
        
        Args:
            user_id: User UUID
            days: Number of days to include
            
        Returns:
            Dictionary containing all chart data structures
        """
        
        mood_timeline = await self.generate_mood_timeline(user_id, days)
        performance_by_game = await self.generate_performance_by_game(user_id, days)
        engagement_heatmap = await self.generate_engagement_heatmap(user_id, days)
        daily_activity = await self.generate_daily_activity(user_id, days)
        
        return {
            "mood_timeline": mood_timeline,
            "game_performance": performance_by_game,
            "engagement_heatmap": engagement_heatmap,
            "daily_activity": daily_activity
        }
    
    async def generate_mood_timeline(
        self,
        user_id: str,
        days: int = 7
    ) -> List[Dict[str, Any]]:
        """
        Generate mood timeline data for line chart
        
        Returns format:
        [
            {"date": "Mon", "mood": 7, "baseline": 6.5},
            ...
        ]
        """
        
        try:
            start_date = datetime.now() - timedelta(days=days)
            
            # Query diary entries
            diary_result = self.db.table("diary_entries").select(
                "mood_rating, entry_date, created_at"
            ).eq("user_id", user_id).gte(
                "created_at", start_date.isoformat()
            ).order("created_at", desc=False).execute()
            
            entries = diary_result.data or []
            
            # Group by date
            mood_by_date = defaultdict(list)
            for entry in entries:
                if entry.get("mood_rating"):
                    date_key = entry.get("entry_date") or entry["created_at"][:10]
                    mood_by_date[date_key].append(entry["mood_rating"])
            
            # Calculate baseline (overall average)
            all_moods = [e["mood_rating"] for e in entries if e.get("mood_rating")]
            baseline = round(sum(all_moods) / len(all_moods), 1) if all_moods else 0
            
            # Generate timeline
            timeline = []
            for i in range(days):
                date = (datetime.now().date() - timedelta(days=days-1-i))
                date_str = date.isoformat()
                day_name = date.strftime("%a")  # Mon, Tue, etc.
                
                moods_for_day = mood_by_date.get(date_str, [])
                avg_mood = round(sum(moods_for_day) / len(moods_for_day), 1) if moods_for_day else None
                
                timeline.append({
                    "date": day_name,
                    "full_date": date_str,
                    "mood": avg_mood,
                    "baseline": baseline,
                    "has_data": avg_mood is not None
                })
            
            return timeline
            
        except Exception as e:
            print(f"Error generating mood timeline: {e}")
            return []
    
    async def generate_performance_by_game(
        self,
        user_id: str,
        days: int = 7
    ) -> List[Dict[str, Any]]:
        """
        Generate game performance data for bar chart
        
        Returns format:
        [
            {"game": "Focus", "thisWeek": 88, "lastWeek": 76, "sessions": 5},
            ...
        ]
        """
        
        try:
            # This week
            this_week_start = datetime.now() - timedelta(days=days)
            this_week_result = self.db.table("game_sessions").select(
                "game_name, score"
            ).eq("user_id", user_id).gte(
                "created_at", this_week_start.isoformat()
            ).execute()
            
            # Last week (for comparison)
            last_week_start = this_week_start - timedelta(days=days)
            last_week_end = this_week_start
            last_week_result = self.db.table("game_sessions").select(
                "game_name, score"
            ).eq("user_id", user_id).gte(
                "created_at", last_week_start.isoformat()
            ).lt(
                "created_at", last_week_end.isoformat()
            ).execute()
            
            # Group by game type
            this_week_scores = defaultdict(list)
            last_week_scores = defaultdict(list)
            
            for session in (this_week_result.data or []):
                if session.get("score") is not None:
                    game_type = self._categorize_game(session["game_name"])
                    this_week_scores[game_type].append(session["score"])
            
            for session in (last_week_result.data or []):
                if session.get("score") is not None:
                    game_type = self._categorize_game(session["game_name"])
                    last_week_scores[game_type].append(session["score"])
            
            # Calculate averages
            performance_data = []
            for game_type in set(list(this_week_scores.keys()) + list(last_week_scores.keys())):
                this_week_avg = round(sum(this_week_scores[game_type]) / len(this_week_scores[game_type]), 1) if this_week_scores[game_type] else 0
                last_week_avg = round(sum(last_week_scores[game_type]) / len(last_week_scores[game_type]), 1) if last_week_scores[game_type] else 0
                
                performance_data.append({
                    "game": game_type.title(),
                    "thisWeek": this_week_avg,
                    "lastWeek": last_week_avg,
                    "sessions": len(this_week_scores[game_type]),
                    "improvement": round(this_week_avg - last_week_avg, 1) if last_week_avg > 0 else 0
                })
            
            # Sort by sessions (most played first)
            performance_data.sort(key=lambda x: x["sessions"], reverse=True)
            
            return performance_data
            
        except Exception as e:
            print(f"Error generating performance by game: {e}")
            return []
    
    async def generate_engagement_heatmap(
        self,
        user_id: str,
        days: int = 7
    ) -> List[Dict[str, Any]]:
        """
        Generate engagement heatmap data
        
        Returns format:
        [
            {"day": "Monday", "hour": 9, "activity": 3},
            ...
        ]
        """
        
        try:
            start_date = datetime.now() - timedelta(days=days)
            
            # Query all game sessions
            sessions_result = self.db.table("game_sessions").select(
                "created_at"
            ).eq("user_id", user_id).gte(
                "created_at", start_date.isoformat()
            ).execute()
            
            sessions = sessions_result.data or []
            
            # Group by day and hour
            heatmap_data = defaultdict(lambda: defaultdict(int))
            
            for session in sessions:
                dt = datetime.fromisoformat(session["created_at"].replace("Z", "+00:00"))
                day_name = dt.strftime("%A")
                hour = dt.hour
                heatmap_data[day_name][hour] += 1
            
            # Convert to list format
            heatmap_list = []
            days_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            
            for day in days_order:
                for hour in range(24):
                    activity = heatmap_data[day][hour]
                    if activity > 0:  # Only include hours with activity
                        heatmap_list.append({
                            "day": day,
                            "hour": hour,
                            "activity": activity,
                            "time": f"{hour:02d}:00"
                        })
            
            return heatmap_list
            
        except Exception as e:
            print(f"Error generating engagement heatmap: {e}")
            return []
    
    async def generate_daily_activity(
        self,
        user_id: str,
        days: int = 7
    ) -> List[Dict[str, Any]]:
        """
        Generate daily activity summary
        
        Returns format:
        [
            {"date": "Mon", "games": 3, "chats": 2, "diary": 1, "total": 6},
            ...
        ]
        """
        
        try:
            start_date = datetime.now() - timedelta(days=days)
            
            # Query games
            games_result = self.db.table("game_sessions").select(
                "created_at"
            ).eq("user_id", user_id).gte(
                "created_at", start_date.isoformat()
            ).execute()
            
            # Query chats
            chats_result = self.db.table("chat_messages").select(
                "created_at"
            ).eq("user_id", user_id).eq("role", "user").gte(
                "created_at", start_date.isoformat()
            ).execute()
            
            # Query diary
            diary_result = self.db.table("diary_entries").select(
                "created_at"
            ).eq("user_id", user_id).gte(
                "created_at", start_date.isoformat()
            ).execute()
            
            # Group by date
            activity_by_date = defaultdict(lambda: {"games": 0, "chats": 0, "diary": 0})
            
            for session in (games_result.data or []):
                date_key = session["created_at"][:10]
                activity_by_date[date_key]["games"] += 1
            
            for chat in (chats_result.data or []):
                date_key = chat["created_at"][:10]
                activity_by_date[date_key]["chats"] += 1
            
            for entry in (diary_result.data or []):
                date_key = entry["created_at"][:10]
                activity_by_date[date_key]["diary"] += 1
            
            # Generate timeline
            activity_timeline = []
            for i in range(days):
                date = (datetime.now().date() - timedelta(days=days-1-i))
                date_str = date.isoformat()
                day_name = date.strftime("%a")
                
                activity = activity_by_date[date_str]
                total = activity["games"] + activity["chats"] + activity["diary"]
                
                activity_timeline.append({
                    "date": day_name,
                    "full_date": date_str,
                    "games": activity["games"],
                    "chats": activity["chats"],
                    "diary": activity["diary"],
                    "total": total
                })
            
            return activity_timeline
            
        except Exception as e:
            print(f"Error generating daily activity: {e}")
            return []
    
    def _categorize_game(self, game_name: str) -> str:
        """Categorize game by type"""
        
        game_name_lower = game_name.lower()
        
        if any(word in game_name_lower for word in ["focus", "attention", "concentration"]):
            return "focus"
        elif any(word in game_name_lower for word in ["memory", "recall", "remember"]):
            return "memory"
        elif any(word in game_name_lower for word in ["emotion", "feeling", "mood"]):
            return "emotional"
        else:
            return "other"
