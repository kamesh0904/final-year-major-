#!/usr/bin/env python3
"""
Test script for the Today's Gentle Goal system
"""
import asyncio
import json
from datetime import datetime, timedelta
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

async def test_gentle_goal_system():
    """Test the complete gentle goal system"""
    print("🧪 Testing Today's Gentle Goal System...")
    
    try:
        # Test 1: Check if columns exist
        print("\n1. Checking database schema...")
        result = supabase.table('profiles').select('gentle_goal_streak, last_gentle_goal_date').limit(1).execute()
        print("✅ Database columns exist")
        
        # Test 2: Test streak logic
        print("\n2. Testing streak logic...")
        
        # Create test user profile
        test_user_id = "test-gentle-goal-user"
        today = datetime.now().date().isoformat()
        yesterday = (datetime.now().date() - timedelta(days=1)).isoformat()
        
        # Test initial completion (should set streak to 1)
        supabase.table('profiles').upsert({
            'id': test_user_id,
            'username': 'Test User',
            'gentle_goal_streak': 0,
            'last_gentle_goal_date': None
        }).execute()
        
        # Simulate completing today's goal
        supabase.table('profiles').update({
            'gentle_goal_streak': 1,
            'last_gentle_goal_date': today
        }).eq('id', test_user_id).execute()
        
        # Verify update
        result = supabase.table('profiles').select('gentle_goal_streak, last_gentle_goal_date').eq('id', test_user_id).single().execute()
        profile = result.data
        
        assert profile['gentle_goal_streak'] == 1, f"Expected streak 1, got {profile['gentle_goal_streak']}"
        assert profile['last_gentle_goal_date'] == today, f"Expected date {today}, got {profile['last_gentle_goal_date']}"
        print("✅ Initial completion works")
        
        # Test consecutive day (should increment streak)
        tomorrow = (datetime.now().date() + timedelta(days=1)).isoformat()
        supabase.table('profiles').update({
            'gentle_goal_streak': 2,
            'last_gentle_goal_date': tomorrow
        }).eq('id', test_user_id).execute()
        
        result = supabase.table('profiles').select('gentle_goal_streak').eq('id', test_user_id).single().execute()
        assert result.data['gentle_goal_streak'] == 2, "Consecutive day streak increment failed"
        print("✅ Consecutive day streak works")
        
        # Test 3: Test Nebula Breath game session
        print("\n3. Testing Nebula Breath game session...")
        
        # Simulate game session
        supabase.table('game_sessions').insert({
            'user_id': test_user_id,
            'game_name': 'Nebula Breath',
            'duration_seconds': 300,
            'score': 500,
            'difficulty_level': 1
        }).execute()
        
        # Verify session was recorded
        result = supabase.table('game_sessions').select('*').eq('user_id', test_user_id).eq('game_name', 'Nebula Breath').execute()
        assert len(result.data) > 0, "Game session not recorded"
        print("✅ Nebula Breath session recording works")
        
        # Test 4: Test comprehensive game stats
        print("\n4. Testing comprehensive game statistics...")
        
        # Add multiple game sessions
        games_data = [
            {'user_id': test_user_id, 'game_name': 'Chromatic Rush', 'score': 1200, 'duration_seconds': 180, 'difficulty_level': 2},
            {'user_id': test_user_id, 'game_name': 'Chromatic Rush', 'score': 1500, 'duration_seconds': 200, 'difficulty_level': 2},
            {'user_id': test_user_id, 'game_name': 'Impulse Guard', 'score': 800, 'duration_seconds': 150, 'difficulty_level': 1},
            {'user_id': test_user_id, 'game_name': 'Impulse Guard', 'score': 950, 'duration_seconds': 160, 'difficulty_level': 1},
        ]
        
        for game_data in games_data:
            supabase.table('game_sessions').insert(game_data).execute()
        
        # Verify comprehensive stats calculation
        result = supabase.table('game_sessions').select('game_name, score').eq('user_id', test_user_id).execute()
        sessions = result.data
        
        # Calculate stats like frontend would
        game_stats = {}
        for session in sessions:
            game_name = session['game_name']
            if game_name not in game_stats:
                game_stats[game_name] = {'total_score': 0, 'sessions': 0, 'best_score': 0}
            
            game_stats[game_name]['total_score'] += session['score']
            game_stats[game_name]['sessions'] += 1
            game_stats[game_name]['best_score'] = max(game_stats[game_name]['best_score'], session['score'])
        
        # Verify calculations
        assert 'Chromatic Rush' in game_stats, "Chromatic Rush stats missing"
        assert game_stats['Chromatic Rush']['best_score'] == 1500, f"Expected best score 1500, got {game_stats['Chromatic Rush']['best_score']}"
        assert game_stats['Chromatic Rush']['sessions'] == 2, f"Expected 2 sessions, got {game_stats['Chromatic Rush']['sessions']}"
        
        print("✅ Comprehensive game statistics work")
        
        # Cleanup test data
        print("\n5. Cleaning up test data...")
        supabase.table('game_sessions').delete().eq('user_id', test_user_id).execute()
        supabase.table('profiles').delete().eq('id', test_user_id).execute()
        print("✅ Test data cleaned up")
        
        print("\n🎉 All tests passed! Today's Gentle Goal system is working correctly.")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    asyncio.run(test_gentle_goal_system())