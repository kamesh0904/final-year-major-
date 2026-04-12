"""
Test script for Pattern Detection Agent
Run this to test the free AI agent
"""

import asyncio
from agents.pattern_detection import pattern_detector
from database import supabase

async def test_pattern_detection():
    """Test pattern detection on real users"""
    
    print("🧪 Testing Pattern Detection Agent")
    print("=" * 50)
    
    try:
        # Get a test user
        result = supabase.table("profiles").select("id, email, username").limit(5).execute()
        
        if not result.data:
            print("❌ No users found in database")
            return
        
        users = result.data
        print(f"✅ Found {len(users)} users to test\n")
        
        for user in users:
            user_id = user['id']
            user_name = user.get('username') or user.get('email', '').split('@')[0]
            
            print(f"\n{'='*50}")
            print(f"Testing User: {user_name}")
            print(f"User ID: {user_id}")
            print(f"{'='*50}\n")
            
            # Analyze patterns
            print("🔍 Analyzing activity patterns...")
            patterns = pattern_detector.analyze_activity_pattern(user_id, days=7)
            
            # Display results
            print("\n📊 Pattern Analysis Results:")
            print(f"  Activity Level: {patterns['activity_level']:.2f} (1.0 = normal)")
            print(f"  Mood Trend: {patterns['mood_trend']:.2f} (negative = declining)")
            print(f"  Engagement Trend: {patterns['engagement_trend']:.2f}")
            print(f"  Days Inactive: {patterns['days_inactive']}")
            
            print(f"\n📈 Data Points:")
            print(f"  Games Played: {patterns['data_points']['games']}")
            print(f"  Diary Entries: {patterns['data_points']['diary_entries']}")
            print(f"  Chat Messages: {patterns['data_points']['chat_messages']}")
            
            # Concerning patterns
            if patterns['concerning_patterns']:
                print(f"\n⚠️  Concerning Patterns Detected:")
                for pattern in patterns['concerning_patterns']:
                    print(f"  • {pattern['severity'].upper()}: {pattern['message']}")
            else:
                print(f"\n✅ No concerning patterns detected")
            
            # Positive patterns
            if patterns['positive_patterns']:
                print(f"\n🌟 Positive Patterns Detected:")
                for pattern in patterns['positive_patterns']:
                    print(f"  • {pattern['message']}")
            
            # Check-in recommendation
            needs_check_in = pattern_detector.should_send_check_in(patterns)
            print(f"\n💬 Check-in Recommended: {'YES' if needs_check_in else 'NO'}")
            
            if needs_check_in:
                message = pattern_detector.generate_check_in_message(patterns, user_name)
                print(f"\n📬 Suggested Check-in Message:")
                print(f"  \"{message}\"")
            elif patterns['positive_patterns']:
                message = pattern_detector.generate_encouragement_message(patterns, user_name)
                if message:
                    print(f"\n🎉 Suggested Encouragement:")
                    print(f"  \"{message}\"")
            
            print(f"\n{'='*50}\n")
            
            # Small delay between users
            await asyncio.sleep(1)
        
        print("\n✅ Pattern detection test complete!")
        print("\n💡 Next Steps:")
        print("  1. Review the patterns detected above")
        print("  2. Adjust thresholds in pattern_detection.py if needed")
        print("  3. Run 'python scheduler.py' to test scheduled jobs")
        print("  4. Check wellness_checkins table in database")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_pattern_detection())
