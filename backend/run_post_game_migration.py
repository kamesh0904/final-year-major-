#!/usr/bin/env python3
"""
Run the post-game questionnaire migration
"""

from database import supabase

def run_migration():
    """Run the post-game questionnaire migration"""
    print("🚀 Running Post-Game Questionnaire Migration...")
    
    # Read the migration file
    try:
        with open("migrations/add_post_game_questionnaire.sql", "r") as f:
            migration_sql = f.read()
        
        print("📄 Migration file loaded successfully")
        
        # Split the migration into individual statements
        statements = [stmt.strip() for stmt in migration_sql.split(';') if stmt.strip()]
        
        print(f"📝 Found {len(statements)} SQL statements to execute")
        
        # Execute each statement
        for i, statement in enumerate(statements, 1):
            if statement.strip():
                try:
                    print(f"   Executing statement {i}/{len(statements)}...")
                    result = supabase.rpc('exec_sql', {'sql': statement}).execute()
                    print(f"   ✅ Statement {i} executed successfully")
                except Exception as e:
                    print(f"   ⚠️ Statement {i} failed (might be expected): {e}")
        
        print("\n🎉 Migration completed!")
        
        # Test if tables were created
        print("\n🧪 Testing table creation...")
        try:
            result = supabase.table("post_game_responses").select("*").limit(1).execute()
            print("✅ post_game_responses table created")
        except Exception as e:
            print(f"❌ post_game_responses table not found: {e}")
            
        try:
            result = supabase.table("used_questions").select("*").limit(1).execute()
            print("✅ used_questions table created")
        except Exception as e:
            print(f"❌ used_questions table not found: {e}")
            
        try:
            result = supabase.table("daily_session_tracking").select("*").limit(1).execute()
            print("✅ daily_session_tracking table created")
        except Exception as e:
            print(f"❌ daily_session_tracking table not found: {e}")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    run_migration()