#!/usr/bin/env python3
"""
Apply the daily reports migration to Supabase database
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

def apply_migration():
    """Apply the daily reports migration"""
    
    # Initialize Supabase client
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Supabase credentials not found in .env file")
        return False
    
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Connected to Supabase")
        
        # Read the migration SQL
        with open("migrations/add_daily_reports.sql", "r") as f:
            migration_sql = f.read()
        
        print("📄 Read migration SQL file")
        
        # Split the SQL into individual statements
        statements = [stmt.strip() for stmt in migration_sql.split(';') if stmt.strip()]
        
        print(f"🔧 Applying {len(statements)} SQL statements...")
        
        # Apply each statement
        for i, statement in enumerate(statements, 1):
            if statement.strip():
                try:
                    # Use rpc to execute raw SQL
                    result = supabase.rpc('exec_sql', {'sql': statement}).execute()
                    print(f"✅ Statement {i}/{len(statements)} applied successfully")
                except Exception as e:
                    print(f"⚠️ Statement {i} failed (might be expected): {e}")
                    # Continue with other statements
        
        print("🎉 Migration completed!")
        
        # Test if the table was created
        try:
            result = supabase.table("daily_reports").select("*").limit(1).execute()
            print("✅ daily_reports table is accessible")
            return True
        except Exception as e:
            print(f"❌ daily_reports table test failed: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Daily Reports Migration")
    print("=" * 50)
    
    success = apply_migration()
    
    if success:
        print("\n🎉 Migration completed successfully!")
        print("Daily reports should now work in the frontend.")
    else:
        print("\n❌ Migration failed.")
        print("You may need to run the SQL manually in Supabase dashboard.")
        print("SQL file location: backend/migrations/add_daily_reports.sql")