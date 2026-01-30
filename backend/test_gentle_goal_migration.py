#!/usr/bin/env python3
"""
Test script to verify gentle goal migration works
"""
import psycopg2
import os
from dotenv import load_dotenv

def test_gentle_goal_migration():
    load_dotenv()
    
    try:
        # Database connection
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            port=os.getenv('DB_PORT', 5432)
        )
        
        # Read and execute migration
        with open('migrations/add_gentle_goal_streak.sql', 'r') as f:
            migration_sql = f.read()
        
        cursor = conn.cursor()
        cursor.execute(migration_sql)
        conn.commit()
        
        # Test that columns exist
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name IN ('gentle_goal_streak', 'last_gentle_goal_date')
        """)
        
        columns = cursor.fetchall()
        print(f"✅ Found columns: {[col[0] for col in columns]}")
        
        cursor.close()
        conn.close()
        
        print('✅ Gentle goal streak migration completed successfully!')
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    test_gentle_goal_migration()