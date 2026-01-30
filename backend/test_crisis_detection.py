#!/usr/bin/env python3
"""
Test script for crisis detection system
"""

import os
from dotenv import load_dotenv
from crisis_detection import crisis_detector
from database import supabase

load_dotenv()

def test_crisis_keywords():
    """Test crisis keyword detection"""
    print("🧪 Testing Crisis Keyword Detection...")
    
    # Test messages with varying severity
    test_messages = [
        ("I'm feeling a bit down today", "test-user-1"),
        ("I can't take this anymore, I want to die", "test-user-2"),
        ("I've been thinking about suicide lately", "test-user-3"),
        ("Everyone would be better off without me", "test-user-4"),
        ("I'm going to kill myself tonight", "test-user-5"),
        ("Just having a normal day", "test-user-6"),
        ("I feel hopeless and trapped", "test-user-7"),
        ("Maybe I should just end it all", "test-user-8"),
    ]
    
    for message, user_id in test_messages:
        result = crisis_detector.analyze_message(message, user_id)
        
        print(f"\nMessage: '{message}'")
        print(f"Crisis Detected: {result['is_crisis']}")
        print(f"Severity: {result['severity']}")
        print(f"Keywords Found: {result['keywords_found']}")
        print(f"Should Alert: {result['should_alert']}")
        print("-" * 50)

def test_escalation_detection():
    """Test escalation detection (3 mentions in 10 minutes)"""
    print("\n🚨 Testing Escalation Detection...")
    
    user_id = "test-escalation-user"
    crisis_messages = [
        "I feel like giving up",
        "I don't want to be here anymore", 
        "I'm thinking about ending my life"
    ]
    
    print(f"Sending 3 crisis messages for user {user_id}...")
    
    for i, message in enumerate(crisis_messages, 1):
        result = crisis_detector.analyze_message(message, user_id)
        print(f"Message {i}: Crisis={result['is_crisis']}, Alert={result['should_alert']}")
        
        if result['should_alert']:
            print(f"🚨 EMERGENCY ALERT would be triggered after message {i}")
            break

def test_crisis_responses():
    """Test crisis response generation"""
    print("\n💬 Testing Crisis Response Generation...")
    
    severity_levels = [1, 2, 3, 4, 5]
    
    for severity in severity_levels:
        response = crisis_detector.get_crisis_response(severity)
        print(f"\nSeverity {severity} Response:")
        print(response)
        print("-" * 50)

def test_database_tables():
    """Test if crisis detection tables exist"""
    print("\n🗄️ Testing Database Tables...")
    
    if not supabase:
        print("❌ Database not connected")
        return
    
    try:
        # Test crisis_events table
        result = supabase.table("crisis_events").select("*").limit(1).execute()
        print("✅ crisis_events table exists")
        
        # Test emergency_alerts table  
        result = supabase.table("emergency_alerts").select("*").limit(1).execute()
        print("✅ emergency_alerts table exists")
        
    except Exception as e:
        print(f"❌ Database table test failed: {e}")
        print("💡 Run the SQL migration in backend/migrations/add_crisis_detection.sql")

def test_emergency_contact_retrieval():
    """Test emergency contact retrieval"""
    print("\n📞 Testing Emergency Contact Retrieval...")
    
    if not supabase:
        print("❌ Database not connected")
        return
    
    try:
        # Try to get a profile with emergency contact
        result = supabase.table("profiles").select("emergency_phone, email").limit(1).execute()
        
        if result.data:
            print("✅ Can retrieve profile data")
            profile = result.data[0]
            print(f"Sample profile: {profile}")
        else:
            print("⚠️ No profiles found in database")
            
    except Exception as e:
        print(f"❌ Emergency contact test failed: {e}")

def simulate_crisis_scenario():
    """Simulate a complete crisis scenario"""
    print("\n🎭 Simulating Complete Crisis Scenario...")
    
    user_id = "crisis-simulation-user"
    
    # Simulate conversation escalation
    messages = [
        "I'm having a really bad day",
        "I feel like nothing matters anymore", 
        "I keep thinking about dying",
        "I want to end my life"
    ]
    
    print("Simulating conversation escalation:")
    
    for i, message in enumerate(messages, 1):
        print(f"\nStep {i}: User says: '{message}'")
        
        result = crisis_detector.analyze_message(message, user_id)
        
        if result['is_crisis']:
            response = crisis_detector.get_crisis_response(result['severity'])
            print(f"🤖 AI Response: {response[:100]}...")
            
            if result['should_alert']:
                print("🚨 EMERGENCY ALERT TRIGGERED!")
                print("📞 Emergency contact would be called")
                break
        else:
            print("💬 Normal conversation continues")

if __name__ == "__main__":
    print("🚀 NeuroNest Crisis Detection System Test")
    print("=" * 60)
    
    test_database_tables()
    print()
    test_crisis_keywords()
    print()
    test_escalation_detection()
    print()
    test_crisis_responses()
    print()
    test_emergency_contact_retrieval()
    print()
    simulate_crisis_scenario()
    
    print("\n✅ Crisis detection tests completed!")
    print("\n⚠️  IMPORTANT SAFETY NOTES:")
    print("- This system is designed to help, not replace professional intervention")
    print("- Always encourage users to contact 988 or emergency services")
    print("- Monitor system logs for crisis events")
    print("- Regularly review and update crisis keywords")
    print("- Test emergency contact calling functionality")