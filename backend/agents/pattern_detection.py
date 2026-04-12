"""
Pattern Detection Agent - 100% Free, Rule-Based
Analyzes user behavior patterns and triggers proactive interventions
NO AI API COSTS - Pure logic and statistics
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
import random
from database import supabase

class PatternDetectionAgent:
    """
    Free rule-based pattern detection agent
    Monitors user behavior and triggers proactive check-ins
    """
    
    def __init__(self):
        self.activity_threshold = 0.3  # 70% decrease triggers alert
        self.mood_decline_threshold = -2  # 2-point mood drop
        self.isolation_days = 3  # Days without activity
        
    def analyze_activity_pattern(self, user_id: str, days: int = 7) -> Dict:
        """
        Analyze user activity patterns over specified days
        Returns comprehensive pattern analysis
        """
        
        try:
            # Get all user data
            game_sessions = self._get_game_sessions(user_id, days)
            diary_entries = self._get_diary_entries(user_id, days)
            chat_messages = self._get_chat_messages(user_id, days)
            
            # Calculate metrics
            patterns = {
                'activity_level': self._calculate_activity_level(user_id, game_sessions, diary_entries),
                'mood_trend': self._calculate_mood_trend(diary_entries),
                'engagement_trend': self._calculate_engagement_trend(game_sessions),
                'days_inactive': self._calculate_days_inactive(game_sessions, diary_entries, chat_messages),
                'concerning_patterns': [],
                'positive_patterns': [],
                'data_points': {
                    'games': len(game_sessions),
                    'diary_entries': len(diary_entries),
                    'chat_messages': len(chat_messages)
                }
            }
            
            # Detect concerning patterns
            self._detect_concerning_patterns(patterns)
            
            # Detect positive patterns
            self._detect_positive_patterns(patterns)
            
            return patterns
            
        except Exception as e:
            print(f"❌ Pattern analysis error for user {user_id}: {e}")
            return self._get_default_patterns()
    
    def _get_game_sessions(self, user_id: str, days: int) -> List[Dict]:
        """Get game sessions from last N days"""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            
            result = supabase.table("game_sessions").select(
                "game_name, score, duration_seconds, created_at"
            ).eq("user_id", user_id).gte("created_at", cutoff_date).execute()
            
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching game sessions: {e}")
            return []
    
    def _get_diary_entries(self, user_id: str, days: int) -> List[Dict]:
        """Get diary entries from last N days"""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            
            result = supabase.table("diary_entries").select(
                "mood_rating, entry_date, created_at"
            ).eq("user_id", user_id).gte("created_at", cutoff_date).execute()
            
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching diary entries: {e}")
            return []
    
    def _get_chat_messages(self, user_id: str, days: int) -> List[Dict]:
        """Get chat messages from last N days"""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            
            result = supabase.table("chat_messages").select(
                "role, created_at"
            ).eq("user_id", user_id).eq("role", "user").gte("created_at", cutoff_date).execute()
            
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching chat messages: {e}")
            return []
    
    def _calculate_activity_level(self, user_id: str, games: List, diary: List) -> float:
        """
        Calculate activity level compared to baseline (0-1)
        1.0 = normal activity, <0.5 = concerning
        """
        current_week_activity = len(games) + len(diary)
        
        # Get previous week for comparison
        try:
            previous_games = self._get_game_sessions(user_id, 14)  # Last 2 weeks
            previous_diary = self._get_diary_entries(user_id, 14)
            
            # Filter to get only week 2 (days 8-14)
            cutoff = (datetime.now() - timedelta(days=7)).isoformat()
            previous_week_games = [g for g in previous_games if g['created_at'] < cutoff]
            previous_week_diary = [d for d in previous_diary if d['created_at'] < cutoff]
            
            previous_week_activity = len(previous_week_games) + len(previous_week_diary)
            
            if previous_week_activity == 0:
                return 1.0  # No baseline, assume normal
            
            return min(current_week_activity / previous_week_activity, 2.0)
            
        except Exception as e:
            print(f"Error calculating activity level: {e}")
            return 1.0
    
    def _calculate_mood_trend(self, diary_entries: List[Dict]) -> float:
        """
        Calculate mood trend (-5 to +5)
        Negative = declining, Positive = improving
        """
        if not diary_entries or len(diary_entries) < 2:
            return 0.0
        
        try:
            # Sort by date
            sorted_entries = sorted(diary_entries, key=lambda x: x['created_at'])
            moods = [e['mood_rating'] for e in sorted_entries if e.get('mood_rating')]
            
            if len(moods) < 2:
                return 0.0
            
            # Compare first half to second half
            mid = len(moods) // 2
            first_half_avg = sum(moods[:mid]) / mid
            second_half_avg = sum(moods[mid:]) / (len(moods) - mid)
            
            return second_half_avg - first_half_avg
            
        except Exception as e:
            print(f"Error calculating mood trend: {e}")
            return 0.0
    
    def _calculate_engagement_trend(self, game_sessions: List[Dict]) -> float:
        """
        Calculate game engagement trend
        Positive = increasing engagement
        """
        if not game_sessions or len(game_sessions) < 2:
            return 0.0
        
        try:
            # Sort by date
            sorted_sessions = sorted(game_sessions, key=lambda x: x['created_at'])
            
            # Compare first half to second half
            mid = len(sorted_sessions) // 2
            first_half = len(sorted_sessions[:mid])
            second_half = len(sorted_sessions[mid:])
            
            if first_half == 0:
                return 1.0
            
            return (second_half - first_half) / first_half
            
        except Exception as e:
            print(f"Error calculating engagement trend: {e}")
            return 0.0
    
    def _calculate_days_inactive(self, games: List, diary: List, chats: List) -> int:
        """Calculate consecutive days without any activity"""
        
        if not games and not diary and not chats:
            return 7  # Full week inactive
        
        try:
            # Get all activity dates
            all_dates = []
            
            for g in games:
                all_dates.append(datetime.fromisoformat(g['created_at'].replace('Z', '+00:00')).date())
            for d in diary:
                all_dates.append(datetime.fromisoformat(d['created_at'].replace('Z', '+00:00')).date())
            for c in chats:
                all_dates.append(datetime.fromisoformat(c['created_at'].replace('Z', '+00:00')).date())
            
            if not all_dates:
                return 7
            
            # Find most recent activity
            most_recent = max(all_dates)
            days_since = (datetime.now().date() - most_recent).days
            
            return days_since
            
        except Exception as e:
            print(f"Error calculating inactive days: {e}")
            return 0
    
    def _detect_concerning_patterns(self, patterns: Dict):
        """Detect and add concerning patterns"""
        
        # Low activity
        if patterns['activity_level'] < self.activity_threshold:
            severity = 'high' if patterns['activity_level'] < 0.2 else 'medium'
            patterns['concerning_patterns'].append({
                'type': 'low_activity',
                'severity': severity,
                'message': f"Activity decreased by {int((1 - patterns['activity_level']) * 100)}%",
                'metric': patterns['activity_level']
            })
        
        # Declining mood
        if patterns['mood_trend'] < self.mood_decline_threshold:
            patterns['concerning_patterns'].append({
                'type': 'declining_mood',
                'severity': 'high',
                'message': f"Mood declining (trend: {patterns['mood_trend']:.1f})",
                'metric': patterns['mood_trend']
            })
        
        # Isolation
        if patterns['days_inactive'] >= self.isolation_days:
            severity = 'critical' if patterns['days_inactive'] >= 5 else 'high'
            patterns['concerning_patterns'].append({
                'type': 'isolation',
                'severity': severity,
                'message': f"No activity for {patterns['days_inactive']} days",
                'metric': patterns['days_inactive']
            })
        
        # Declining engagement
        if patterns['engagement_trend'] < -0.5:
            patterns['concerning_patterns'].append({
                'type': 'declining_engagement',
                'severity': 'medium',
                'message': "Game engagement decreasing",
                'metric': patterns['engagement_trend']
            })
    
    def _detect_positive_patterns(self, patterns: Dict):
        """Detect and add positive patterns"""
        
        # Increasing activity
        if patterns['activity_level'] > 1.3:
            patterns['positive_patterns'].append({
                'type': 'increased_activity',
                'message': f"Activity increased by {int((patterns['activity_level'] - 1) * 100)}%"
            })
        
        # Improving mood
        if patterns['mood_trend'] > 1.5:
            patterns['positive_patterns'].append({
                'type': 'improving_mood',
                'message': f"Mood improving (trend: +{patterns['mood_trend']:.1f})"
            })
        
        # Consistent engagement
        if patterns['days_inactive'] == 0 and patterns['data_points']['games'] >= 3:
            patterns['positive_patterns'].append({
                'type': 'consistent_engagement',
                'message': "Maintaining consistent activity"
            })
    
    def should_send_check_in(self, patterns: Dict) -> bool:
        """
        Determine if proactive check-in is needed
        Returns True if intervention recommended
        """
        
        if not patterns.get('concerning_patterns'):
            return False
        
        # Critical severity - always check in
        critical = [p for p in patterns['concerning_patterns'] if p['severity'] == 'critical']
        if critical:
            return True
        
        # Multiple high severity issues
        high_severity = [p for p in patterns['concerning_patterns'] if p['severity'] == 'high']
        if len(high_severity) >= 2:
            return True
        
        # Low activity + declining mood
        has_low_activity = any(p['type'] == 'low_activity' for p in patterns['concerning_patterns'])
        has_declining_mood = any(p['type'] == 'declining_mood' for p in patterns['concerning_patterns'])
        if has_low_activity and has_declining_mood:
            return True
        
        # Isolation
        has_isolation = any(p['type'] == 'isolation' for p in patterns['concerning_patterns'])
        if has_isolation:
            return True
        
        return False
    
    def generate_check_in_message(self, patterns: Dict, user_name: str = None) -> str:
        """
        Generate personalized check-in message
        Uses templates - no AI needed
        """
        
        name_prefix = f"{user_name}, " if user_name else ""
        
        # Get primary concern
        if not patterns.get('concerning_patterns'):
            return f"Hey {name_prefix}just checking in. How are you doing today?"
        
        primary_concern = patterns['concerning_patterns'][0]
        concern_type = primary_concern['type']
        
        # Message templates by concern type
        templates = {
            'low_activity': [
                f"Hey {name_prefix}I noticed you haven't been around much lately. Everything okay?",
                f"{name_prefix}I've missed seeing you here. Want to talk about what's going on?",
                f"You've been quieter than usual, {name_prefix}Just checking in on you.",
                f"{name_prefix}it's been a bit quiet. How are you really doing?"
            ],
            'declining_mood': [
                f"{name_prefix}I've noticed your mood has been lower lately. What's been weighing on you?",
                f"Things seem tough right now, {name_prefix}Want to share what's on your mind?",
                f"Your recent entries show you're struggling, {name_prefix}I'm here if you need to talk.",
                f"{name_prefix}I can see things have been hard. Want to talk about it?"
            ],
            'isolation': [
                f"I haven't heard from you in {primary_concern['metric']} days, {name_prefix}Are you doing alright?",
                f"{name_prefix}just wanted to reach out - you've been away for a bit. Everything okay?",
                f"Checking in because I care, {name_prefix}How are you really doing?",
                f"Hey {name_prefix}it's been a few days. Just making sure you're okay."
            ],
            'declining_engagement': [
                f"{name_prefix}I noticed you've been playing less. Feeling overwhelmed?",
                f"You seem less engaged lately, {name_prefix}What's going on?",
                f"{name_prefix}is everything alright? You've been less active with the games."
            ]
        }
        
        # Select random template for variety
        template_list = templates.get(concern_type, templates['low_activity'])
        return random.choice(template_list)
    
    def generate_encouragement_message(self, patterns: Dict, user_name: str = None) -> str:
        """Generate encouragement for positive patterns"""
        
        if not patterns.get('positive_patterns'):
            return None
        
        name_prefix = f"{user_name}, " if user_name else ""
        positive = patterns['positive_patterns'][0]
        
        templates = {
            'increased_activity': [
                f"Love seeing you more active, {name_prefix}Keep it up! 🌟",
                f"{name_prefix}you're really showing up for yourself lately. That's awesome!",
                f"Your increased engagement is inspiring, {name_prefix}Way to go! 💪"
            ],
            'improving_mood': [
                f"I can see your mood improving, {name_prefix}That's wonderful! 😊",
                f"{name_prefix}things seem to be looking up. So happy for you!",
                f"Your positive trend is beautiful to see, {name_prefix}Keep going!"
            ],
            'consistent_engagement': [
                f"Your consistency is impressive, {name_prefix}You're building great habits! 🎯",
                f"{name_prefix}I love your dedication. You're doing amazing!",
                f"You're showing up every day, {name_prefix}That takes real strength! 💪"
            ]
        }
        
        template_list = templates.get(positive['type'], templates['consistent_engagement'])
        return random.choice(template_list)
    
    def _get_default_patterns(self) -> Dict:
        """Return default patterns on error"""
        return {
            'activity_level': 1.0,
            'mood_trend': 0.0,
            'engagement_trend': 0.0,
            'days_inactive': 0,
            'concerning_patterns': [],
            'positive_patterns': [],
            'data_points': {'games': 0, 'diary_entries': 0, 'chat_messages': 0}
        }
    
    def log_check_in(self, user_id: str, message: str, patterns: Dict):
        """Log wellness check-in to database"""
        try:
            check_in_data = {
                'user_id': user_id,
                'check_in_type': 'proactive_pattern_detection',
                'message': message,
                'patterns_detected': patterns,
                'created_at': datetime.now().isoformat()
            }
            
            supabase.table('wellness_checkins').insert(check_in_data).execute()
            print(f"✅ Wellness check-in logged for user {user_id}")
            
        except Exception as e:
            print(f"❌ Failed to log check-in: {e}")


# Global instance
pattern_detector = PatternDetectionAgent()
