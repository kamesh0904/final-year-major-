"""
Database connection utilities for NeuroNest
Provides both Supabase client and raw PostgreSQL connections
"""

import os
import psycopg2
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase connection (existing)
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("✅ Supabase client connected successfully")
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        supabase = None
else:
    print("⚠️ Supabase credentials missing")
    supabase = None

def get_db_connection():
    """
    Get a raw PostgreSQL connection to Supabase
    This is needed for complex queries and stored procedures
    """
    if not SUPABASE_URL:
        raise Exception("SUPABASE_URL not configured")
    
    # Extract connection details from Supabase URL
    # Format: https://[project_id].supabase.co
    project_id = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "")
    
    # Supabase PostgreSQL connection details
    # Note: You need to get the actual database password from Supabase dashboard
    # For now, we'll try to use the service key or provide a fallback
    
    try:
        # Try to connect using Supabase's PostgreSQL endpoint
        # This might need to be configured with actual database credentials
        conn = psycopg2.connect(
            host=f"db.{project_id}.supabase.co",
            database="postgres",
            user="postgres",
            password=os.getenv("SUPABASE_DB_PASSWORD", "your_db_password_here"),
            port="5432"
        )
        return conn
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        print("💡 You may need to configure SUPABASE_DB_PASSWORD in your .env file")
        print("💡 Get the database password from your Supabase dashboard > Settings > Database")
        raise e

def get_supabase_client():
    """Get the Supabase client for simple operations"""
    return supabase