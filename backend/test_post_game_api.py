#!/usr/bin/env python3
"""
Test the post-game questionnaire API endpoints
"""

import requests
import json
from database import supabase

# Test configuration
API_BASE = "http://localhost:8000"
TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000"  # Valid UUID format for testing

def test_database_tables():
    """Test if the required tables exist"""
    print("🗄️ Testing Database Tables...")
    
    try:
        # Test if post_game_responses table exists
        result = supabase.table("post_game_responses").select("*").limit(1).execute()
        print("✅ post_game_responses table exists")
        
        # Test if used_questions table exists  
        result = supabase.table("used_questions").select("*").limit(1).execute()
        print("✅ used_questions table exists")
        
        # Test if daily_session_tracking table exists
        result = supabase.table("daily_session_tracking").select("*").limit(1).execute()
        print("✅ daily_session_tracking table exists")
        
        return True
        
    except Exception as e:
        print(f"❌ Database table error: {e}")
        return False

def test_add_session_time():
    """Test the add session time endpoint"""
    print("\n⏱️ Testing Add Session Time API...")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {TEST_USER_ID}"
    }
    
    data = {
        "game_name": "Pattern Release",
        "session_duration": 360  # 6 minutes - should trigger questionnaire
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/api/questionnaire/add-session-time",
            headers=headers,
            json=data
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ API call successful")
            print(f"   Should trigger: {result.get('should_trigger_questionnaire')}")
            print(f"   Total duration: {result.get('total_duration')} seconds")
            print(f"   Available questions: {result.get('available_questions_count')}")
            return True
        else:
            print(f"❌ API call failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ API test error: {e}")
        return False

def test_get_questions():
    """Test getting unused questions"""
    print("\n❓ Testing Get Questions API...")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {TEST_USER_ID}"
    }
    
    data = {
        "category": "OCD"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/api/questionnaire/get-unused-questions",
            headers=headers,
            json=data
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Questions API successful")
            print(f"   Eligible: {result.get('eligible')}")
            print(f"   Category: {result.get('category')}")
            print(f"   Questions count: {len(result.get('questions', []))}")
            return True
        else:
            print(f"❌ Questions API failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Questions test error: {e}")
        return False

def main():
    print("🚀 Starting Post-Game API Tests")
    print("=" * 50)
    
    # Test database tables
    db_ok = test_database_tables()
    
    if not db_ok:
        print("\n❌ Database tables missing. Please run the migration:")
        print("   backend/migrations/add_post_game_questionnaire.sql")
        return
    
    # Test API endpoints
    session_ok = test_add_session_time()
    questions_ok = test_get_questions()
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"   Database Tables: {'✅' if db_ok else '❌'}")
    print(f"   Add Session Time: {'✅' if session_ok else '❌'}")
    print(f"   Get Questions: {'✅' if questions_ok else '❌'}")
    
    if all([db_ok, session_ok, questions_ok]):
        print("\n🎉 All tests passed! Post-game system is working.")
    else:
        print("\n⚠️ Some tests failed. Check the issues above.")

if __name__ == "__main__":
    main()