#!/usr/bin/env python3
"""
Test script for contact information functionality
"""

import os
from dotenv import load_dotenv
from database import update_contact_info, supabase

load_dotenv()

def test_contact_info_update():
    """Test the contact info update functionality"""
    
    if not supabase:
        print("❌ Database not connected. Check your .env file.")
        return
    
    print("🧪 Testing Contact Info Update...")
    
    # Test data
    test_user_id = "test-user-123"  # Replace with actual user ID for testing
    test_address = "123 Test Street, Test City, TC 12345"
    test_phone = "+1-555-123-4567"
    
    try:
        # Test the update function
        success = update_contact_info(test_user_id, test_address, test_phone)
        
        if success:
            print("✅ Contact info update function works!")
            
            # Try to retrieve the data to verify
            result = supabase.table("profiles").select("address, emergency_phone").eq("id", test_user_id).execute()
            
            if result.data:
                print(f"📋 Retrieved data: {result.data}")
            else:
                print("⚠️ No data found for test user ID")
                
        else:
            print("❌ Contact info update failed")
            
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

def check_table_structure():
    """Check if the profiles table has the new columns"""
    
    if not supabase:
        print("❌ Database not connected.")
        return
        
    try:
        # Try to select the new columns to see if they exist
        result = supabase.table("profiles").select("address, emergency_phone").limit(1).execute()
        print("✅ New columns exist in profiles table")
        
    except Exception as e:
        print(f"❌ New columns might not exist: {e}")
        print("💡 Run the SQL migration in backend/migrations/add_contact_info.sql")

if __name__ == "__main__":
    print("🚀 NeuroNest Contact Info Test")
    print("=" * 40)
    
    check_table_structure()
    print()
    # Uncomment the line below to test with a real user ID
    # test_contact_info_update()
    
    print("✅ Test completed!")