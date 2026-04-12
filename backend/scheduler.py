"""
Background Job Scheduler for Free AI Agents
Runs pattern detection, reminders, and other automated tasks
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import asyncio
from typing import List
from database import supabase
from agents.pattern_detection import pattern_detector

# Initialize scheduler
scheduler = AsyncIOScheduler()

async def get_active_users() -> List[dict]:
    """Get list of active users for processing"""
    try:
        # Get users who have been active in last 30 days
        result = supabase.table("profiles").select("id, email, username").execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"❌ Error fetching active users: {e}")
        return []

async def send_notification(user_id: str, message: str, notification_type: str = "check_in"):
    """
    Send notification to user
    TODO: Implement push notifications, SMS, or email
    For now, just logs to database
    """
    try:
        # Log notification
        notification_data = {
            'user_id': user_id,
            'type': notification_type,
            'message': message,
            'sent_at': datetime.now().isoformat(),
            'status': 'sent'
        }
        
        # Store in wellness_checkins table
        pattern_detector.log_check_in(user_id, message, {'notification': True})
        
        print(f"📬 Notification sent to user {user_id}: {message[:50]}...")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send notification: {e}")
        return False

# ============================================
# SCHEDULED JOBS
# ============================================

async def daily_pattern_check():
    """
    Daily wellness check - runs every morning at 9 AM
    Analyzes all users for concerning patterns
    """
    print("🔍 Starting daily pattern check...")
    
    try:
        users = await get_active_users()
        check_ins_sent = 0
        encouragements_sent = 0
        
        for user in users:
            try:
                user_id = user['id']
                user_name = user.get('username') or user.get('email', '').split('@')[0]
                
                # Analyze patterns
                patterns = pattern_detector.analyze_activity_pattern(user_id, days=7)
                
                # Check if intervention needed
                if pattern_detector.should_send_check_in(patterns):
                    message = pattern_detector.generate_check_in_message(patterns, user_name)
                    await send_notification(user_id, message, "wellness_check")
                    check_ins_sent += 1
                    print(f"✅ Check-in sent to {user_name}")
                
                # Send encouragement for positive patterns
                elif patterns.get('positive_patterns'):
                    message = pattern_detector.generate_encouragement_message(patterns, user_name)
                    if message:
                        await send_notification(user_id, message, "encouragement")
                        encouragements_sent += 1
                        print(f"🌟 Encouragement sent to {user_name}")
                
                # Small delay to avoid rate limiting
                await asyncio.sleep(0.5)
                
            except Exception as e:
                print(f"❌ Error processing user {user.get('id')}: {e}")
                continue
        
        print(f"✅ Daily pattern check complete: {check_ins_sent} check-ins, {encouragements_sent} encouragements")
        
    except Exception as e:
        print(f"❌ Daily pattern check failed: {e}")

async def weekly_pattern_summary():
    """
    Weekly summary - runs every Sunday at 8 PM
    Sends weekly insights to users
    """
    print("📊 Starting weekly pattern summary...")
    
    try:
        users = await get_active_users()
        summaries_sent = 0
        
        for user in users:
            try:
                user_id = user['id']
                user_name = user.get('username') or user.get('email', '').split('@')[0]
                
                # Analyze full week
                patterns = pattern_detector.analyze_activity_pattern(user_id, days=7)
                
                # Generate summary message
                summary = generate_weekly_summary(patterns, user_name)
                
                if summary:
                    await send_notification(user_id, summary, "weekly_summary")
                    summaries_sent += 1
                    print(f"✅ Weekly summary sent to {user_name}")
                
                await asyncio.sleep(0.5)
                
            except Exception as e:
                print(f"❌ Error processing user {user.get('id')}: {e}")
                continue
        
        print(f"✅ Weekly summary complete: {summaries_sent} summaries sent")
        
    except Exception as e:
        print(f"❌ Weekly summary failed: {e}")

def generate_weekly_summary(patterns: dict, user_name: str) -> str:
    """Generate weekly summary message"""
    
    name = f"{user_name}, " if user_name else ""
    
    # Get key metrics
    games = patterns['data_points']['games']
    diary = patterns['data_points']['diary_entries']
    mood_trend = patterns['mood_trend']
    
    # Build summary
    summary_parts = [f"Hey {name}here's your week in review:"]
    
    # Activity
    if games > 0:
        summary_parts.append(f"🎮 You played {games} game session{'s' if games != 1 else ''}")
    
    if diary > 0:
        summary_parts.append(f"📔 You wrote {diary} diary entr{'ies' if diary != 1 else 'y'}")
    
    # Mood trend
    if mood_trend > 1:
        summary_parts.append(f"😊 Your mood has been improving (trend: +{mood_trend:.1f})")
    elif mood_trend < -1:
        summary_parts.append(f"💙 Your mood has been lower (trend: {mood_trend:.1f})")
    else:
        summary_parts.append("😌 Your mood has been stable")
    
    # Positive patterns
    if patterns.get('positive_patterns'):
        summary_parts.append("\n✨ Wins this week:")
        for pattern in patterns['positive_patterns'][:2]:
            summary_parts.append(f"  • {pattern['message']}")
    
    # Encouragement
    if games + diary > 5:
        summary_parts.append("\nKeep up the great work! 💪")
    elif games + diary > 0:
        summary_parts.append("\nYou're making progress! 🌱")
    else:
        summary_parts.append("\nLooking forward to seeing you more this week! 💙")
    
    return "\n".join(summary_parts)

# ============================================
# SCHEDULER CONFIGURATION
# ============================================

def start_scheduler():
    """Start the background scheduler"""
    
    # Daily pattern check at 9 AM
    scheduler.add_job(
        daily_pattern_check,
        CronTrigger(hour=9, minute=0),
        id='daily_pattern_check',
        name='Daily Pattern Detection Check',
        replace_existing=True
    )
    
    # Weekly summary on Sunday at 8 PM
    scheduler.add_job(
        weekly_pattern_summary,
        CronTrigger(day_of_week='sun', hour=20, minute=0),
        id='weekly_pattern_summary',
        name='Weekly Pattern Summary',
        replace_existing=True
    )
    
    # Start scheduler
    scheduler.start()
    print("✅ Background scheduler started")
    print("📅 Scheduled jobs:")
    print("  - Daily pattern check: Every day at 9:00 AM")
    print("  - Weekly summary: Every Sunday at 8:00 PM")

def stop_scheduler():
    """Stop the background scheduler"""
    scheduler.shutdown()
    print("🛑 Background scheduler stopped")

# For testing - run immediately
async def run_pattern_check_now():
    """Run pattern check immediately (for testing)"""
    print("🧪 Running pattern check now (test mode)...")
    await daily_pattern_check()

if __name__ == "__main__":
    # Test mode - run immediately
    asyncio.run(run_pattern_check_now())
