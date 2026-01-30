#!/usr/bin/env python3
"""
Test script for diary functionality
"""

import os
import bcrypt
from dotenv import load_dotenv
from database import supabase

load_dotenv()

def test_diary_password():
    """Test diary password creation and verification"""
    
    if not supabase:
        print("❌ Database not connected. Check your .env file.")
        return
    
    print("🧪 Testing Diary Password System...")
    
    # Test data
    test_user_id = "test-user-diary-123"  # Replace with actual user ID for testing
    test_password = "MySecretDiary123!"
    
    try:
        # 1. Test password hashing
        password_bytes = test_password.encode('utf-8')
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
        
        print(f"✅ Password hashed successfully: {password_hash[:20]}...")
        
        # 2. Test password verification
        is_valid = bcrypt.checkpw(password_bytes, password_hash.encode('utf-8'))
        print(f"✅ Password verification: {'PASS' if is_valid else 'FAIL'}")
        
        # 3. Test wrong password
        wrong_password = "WrongPassword123!"
        wrong_bytes = wrong_password.encode('utf-8')
        is_invalid = bcrypt.checkpw(wrong_bytes, password_hash.encode('utf-8'))
        print(f"✅ Wrong password rejection: {'PASS' if not is_invalid else 'FAIL'}")
        
    except Exception as e:
        print(f"❌ Password test failed: {e}")

def test_diary_entries():
    """Test diary entries table structure"""
    
    if not supabase:
        print("❌ Database not connected.")
        return
        
    try:
        # Try to select from diary_entries to see if table exists
        result = supabase.table("diary_entries").select("*").limit(1).execute()
        print("✅ diary_entries table exists and is accessible")
        
        # Check if we can insert a test entry (uncomment to test)
        # test_entry = {
        #     "user_id": "test-user-123",
        #     "title": "Test Entry",
        #     "content": "This is a test diary entry.",
        #     "mood_rating": 7,
        #     "tags": ["test", "mood"]
        # }
        # result = supabase.table("diary_entries").insert(test_entry).execute()
        # print("✅ Test diary entry inserted successfully")
        
    except Exception as e:
        print(f"❌ Diary entries table test failed: {e}")
        print("💡 Run the SQL migration in backend/migrations/add_diary_system.sql")

def test_profiles_columns():
    """Test if profiles table has diary columns"""
    
    if not supabase:
        print("❌ Database not connected.")
        return
        
    try:
        # Try to select the new diary columns
        result = supabase.table("profiles").select("diary_password_hash, diary_created_at").limit(1).execute()
        print("✅ Diary columns exist in profiles table")
        
    except Exception as e:
        print(f"❌ Diary columns might not exist: {e}")
        print("💡 Run the SQL migration in backend/migrations/add_diary_system.sql")

if __name__ == "__main__":
    print("🚀 NeuroNest Diary System Test")
    print("=" * 40)
    
    test_profiles_columns()
    print()
    test_diary_entries()
    print()
    test_diary_password()
    
    print("\n✅ Diary system tests completed!")
    print("\n📝 Next steps:")
    print("1. Run the SQL migration if any tests failed")
    print("2. Test the frontend diary components")
    print("3. Test diary password creation in the UI")
    print("4. Test AI companion diary access")