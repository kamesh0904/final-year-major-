"""
Crisis Detection System for NeuroNest
Monitors conversations for suicide ideation and triggers emergency protocols
"""

import re
import time
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import requests
from database import supabase

class CrisisDetector:
    def __init__(self):
        # Suicide ideation keywords and phrases
        self.crisis_keywords = [
            # Direct expressions
            "kill myself", "end my life", "want to die", "suicide", "suicidal",
            "not worth living", "better off dead", "end it all", "take my own life",
            
            # Indirect expressions
            "can't go on", "no point in living", "everyone would be better without me",
            "tired of living", "don't want to be here", "wish I was dead",
            "nothing to live for", "ready to give up", "can't take it anymore",
            
            # Method-related
            "pills", "bridge", "rope", "gun", "knife", "overdose", "hanging",
            "jumping", "cutting", "bleeding", "poison",
            
            # Hopelessness indicators
            "no hope", "hopeless", "pointless", "worthless", "burden",
            "trapped", "escape", "way out", "final solution"
        ]
        
        # Compile regex patterns for better matching
        self.crisis_patterns = [
            re.compile(r'\b(?:kill|end|take)\s+(?:my|own)\s+life\b', re.IGNORECASE),
            re.compile(r'\bwant\s+to\s+die\b', re.IGNORECASE),
            re.compile(r'\bsuicid[ae]l?\b', re.IGNORECASE),
            re.compile(r'\bbetter\s+off\s+dead\b', re.IGNORECASE),
            re.compile(r'\bend\s+it\s+all\b', re.IGNORECASE),
            re.compile(r'\bno\s+point\s+(?:in\s+)?living\b', re.IGNORECASE),
            re.compile(r'\btired\s+of\s+living\b', re.IGNORECASE),
            re.compile(r'\bwish\s+I\s+was\s+dead\b', re.IGNORECASE),
        ]

    def analyze_message(self, message: str, user_id: str) -> Dict:
        """
        Analyze a message for crisis indicators
        Returns: {
            'is_crisis': bool,
            'severity': int (1-5),
            'keywords_found': list,
            'should_alert': bool
        }
        """
        message_lower = message.lower()
        keywords_found = []
        severity = 0
        
        # Check for direct keyword matches
        for keyword in self.crisis_keywords:
            if keyword in message_lower:
                keywords_found.append(keyword)
                # Weight more severe keywords higher
                if keyword in ["kill myself", "suicide", "end my life", "want to die"]:
                    severity += 3
                elif keyword in ["better off dead", "no point in living", "end it all"]:
                    severity += 2
                else:
                    severity += 1
        
        # Check for pattern matches (higher weight)
        for pattern in self.crisis_patterns:
            if pattern.search(message):
                severity += 2
                keywords_found.append(f"pattern: {pattern.pattern}")
        
        # Determine crisis level - be more nuanced
        is_crisis = severity >= 1 or len(keywords_found) >= 1
        
        # Only escalate for very severe cases or clear escalation pattern
        should_alert = self._check_escalation(user_id, is_crisis and severity >= 3)
        
        return {
            'is_crisis': is_crisis,
            'severity': min(severity, 5),
            'keywords_found': keywords_found,
            'should_alert': should_alert,
            'timestamp': datetime.now().isoformat()
        }

    def _check_escalation(self, user_id: str, current_crisis: bool) -> bool:
        """
        Check if user has mentioned crisis topics 3+ times in last 10 minutes
        """
        if not current_crisis:
            return False
            
        try:
            # Get crisis events from last 10 minutes
            ten_minutes_ago = datetime.now() - timedelta(minutes=10)
            
            result = supabase.table("crisis_events").select("*").eq(
                "user_id", user_id
            ).gte("created_at", ten_minutes_ago.isoformat()).execute()
            
            crisis_events = result.data if result.data else []
            
            # Count current event
            total_events = len(crisis_events) + 1
            
            # Log current event
            self._log_crisis_event(user_id, current_crisis)
            
            # Trigger alert if 3+ events in 10 minutes
            return total_events >= 3
            
        except Exception as e:
            print(f"❌ Crisis escalation check failed: {e}")
            return False

    def _log_crisis_event(self, user_id: str, is_crisis: bool):
        """Log crisis event to database"""
        try:
            event_data = {
                "user_id": user_id,
                "is_crisis": is_crisis,
                "created_at": datetime.now().isoformat()
            }
            
            supabase.table("crisis_events").insert(event_data).execute()
            print(f"📝 Crisis event logged for user {user_id}")
            
        except Exception as e:
            print(f"❌ Failed to log crisis event: {e}")

    def trigger_emergency_alert(self, user_id: str) -> bool:
        """
        Trigger emergency alert - call emergency contact
        """
        try:
            # Get user's emergency contact
            result = supabase.table("profiles").select(
                "emergency_phone, email"
            ).eq("id", user_id).single().execute()
            
            if not result.data:
                print(f"❌ No profile found for user {user_id}")
                return False
                
            emergency_phone = result.data.get("emergency_phone")
            user_email = result.data.get("email")
            
            if not emergency_phone:
                print(f"⚠️ No emergency contact for user {user_id}")
                return False
            
            # Log the emergency alert
            alert_data = {
                "user_id": user_id,
                "emergency_phone": emergency_phone,
                "alert_type": "suicide_ideation",
                "status": "triggered",
                "created_at": datetime.now().isoformat()
            }
            
            supabase.table("emergency_alerts").insert(alert_data).execute()
            
            # In a real implementation, you would integrate with:
            # - Twilio for SMS/calls
            # - Emergency services API
            # - Mental health crisis hotlines
            
            print(f"🚨 EMERGENCY ALERT TRIGGERED for user {user_id}")
            print(f"📞 Emergency contact: {emergency_phone}")
            
            # For now, we'll simulate the call
            self._simulate_emergency_call(emergency_phone, user_email)
            
            return True
            
        except Exception as e:
            print(f"❌ Emergency alert failed: {e}")
            return False

    def _simulate_emergency_call(self, phone: str, user_email: str):
        """
        Simulate emergency call (replace with real implementation)
        In production, integrate with Twilio or similar service
        """
        message = f"""
        URGENT: Mental Health Crisis Alert
        
        A user of NeuroNest ({user_email}) has shown signs of suicide ideation 
        in their conversation. They mentioned self-harm or suicide 3 times 
        within 10 minutes.
        
        Please check on them immediately.
        
        If this is a false alarm, please disregard.
        
        Crisis Hotline: 988 (US)
        Emergency: 911
        """
        
        print(f"📞 SIMULATED CALL TO {phone}:")
        print(message)
        
        # In production, replace with:
        # twilio_client.calls.create(
        #     to=phone,
        #     from_=TWILIO_PHONE,
        #     twiml=f'<Response><Say>{message}</Say></Response>'
        # )

    def get_crisis_response(self, severity: int, user_context: dict = None) -> str:
        """
        Get varied, human-like crisis responses based on severity
        """
        import random
        
        # Get user's name or use a warm default
        user_name = user_context.get('name', '') if user_context else ''
        name_prefix = f"{user_name}, " if user_name else ""
        
        if severity >= 4:
            responses = [
                f"Hey {name_prefix}I'm really worried about you right now. What you're going through sounds incredibly painful, and I can hear how much you're hurting. But I need you to know - you matter, and your life has value.\n\nCan you please reach out to someone right now? Call 988 - they're really good at helping people through moments like this. Or if you're in immediate danger, please call 911. You don't have to face this alone.",
                
                f"{name_prefix}I can feel how much pain you're in through your words, and I'm genuinely concerned about you. This level of suffering is real, and it makes sense that you'd want it to stop - but ending your life isn't the answer.\n\nPlease, please call 988 right now. They have people who understand exactly what you're going through. You deserve support, not more pain.",
                
                f"Whoa, {name_prefix}that's some really heavy stuff you're sharing with me. I'm honestly scared for you right now, and I care about what happens to you. These feelings you're having - they're temporary, even though they feel permanent.\n\nI need you to pick up your phone and call 988. Like, right now. They're trained for exactly this moment. Can you do that for me?"
            ]
            
        elif severity >= 2:
            responses = [
                f"{name_prefix}I hear you, and what you're describing sounds really, really hard. When everything feels this overwhelming, it's natural for our minds to go to dark places.\n\nHave you talked to anyone about feeling this way? Sometimes just getting these thoughts out of our head and into the open air can help. The 988 lifeline is there 24/7 if you need someone to talk to who really gets it.",
                
                f"That sounds exhausting, {name_prefix}carrying all of that weight. I'm glad you felt safe enough to share this with me. These kinds of thoughts can feel so isolating, but you're not alone in having them.\n\nWhat's one small thing that's helped you get through difficult moments before? And hey, 988 is always there if you need to talk to someone who specializes in this stuff.",
                
                f"{name_prefix}I can tell you're going through something really tough right now. Sometimes when we're in that much emotional pain, our brain starts suggesting things that aren't actually solutions.\n\nWhat would it look like to get through just today? Not tomorrow, not next week - just today. And if today feels too big, what about the next hour? You can text HOME to 741741 if talking on the phone feels like too much."
            ]
            
        else:
            responses = [
                f"It sounds like you're having a really rough time, {name_prefix}and I want you to know that makes complete sense given what you're dealing with. Sometimes life just feels heavy, you know?\n\nWhat's been the hardest part about today? I'm here to listen, and if things ever feel too overwhelming, remember that 988 is always available.",
                
                f"{name_prefix}I can hear that you're struggling, and I appreciate you being honest about that. It takes courage to admit when things aren't okay.\n\nIs there anything that usually helps you feel a little more grounded when you're going through tough times? And just so you know, if you ever need more support than I can provide, 988 has people who are really good at this.",
                
                f"Thanks for trusting me with how you're feeling, {name_prefix}That kind of honesty isn't always easy. It sounds like you're carrying a lot right now.\n\nWhat's one thing that's felt even slightly okay today? Sometimes when everything feels dark, those tiny moments of 'not terrible' can be important to notice."
            ]
        
        return random.choice(responses)

# Global instance
crisis_detector = CrisisDetector()