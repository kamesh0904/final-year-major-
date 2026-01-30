#!/usr/bin/env python3
"""
Create the daily_reports table using Supabase client
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

def create_daily_reports_table():
    """Create the daily_reports table"""
    
    # Initialize Supabase client
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Supabase credentials not found in .env file")
        return False
    
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Connected to Supabase")
        
        # Test if the table already exists
        try:
            result = supabase.table("daily_reports").select("*").limit(1).execute()
            print("✅ daily_reports table already exists!")
            return True
        except Exception:
            print("📋 daily_reports table doesn't exist, creating it...")
        
        # Since we can't create tables directly through the Supabase client,
        # let's try to insert a dummy record which might auto-create the table
        # (This won't work, but let's see what happens)
        
        print("❌ Cannot create tables through Supabase client")
        print("📋 You need to run the SQL migration manually")
        print("🔧 Steps to fix:")
        print("1. Go to your Supabase dashboard")
        print("2. Navigate to SQL Editor")
        print("3. Copy and paste the contents of backend/migrations/add_daily_reports.sql")
        print("4. Run the SQL")
        
        return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Checking Daily Reports Table")
    print("=" * 50)
    
    create_daily_reports_table()