"""
Authentication utilities for NeuroNest backend
"""

from fastapi import HTTPException, Header
from typing import Optional
import os
from supabase import create_client, Client

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """
    Extract user ID from authorization header
    For now, this is a simplified implementation
    In production, you would validate JWT tokens properly
    """
    
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # For development/testing, we'll extract user ID from a simple format
    # In production, you would decode and validate JWT tokens
    try:
        # Expected format: "Bearer user_id" or just "user_id"
        if authorization.startswith("Bearer "):
            user_id = authorization.replace("Bearer ", "")
        else:
            user_id = authorization
            
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid authorization format")
            
        return user_id
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

def verify_user_exists(user_id: str) -> bool:
    """
    Verify that a user exists in the database
    """
    if not supabase:
        return True  # Skip verification if Supabase not configured
        
    try:
        result = supabase.table("profiles").select("id").eq("id", user_id).single().execute()
        return bool(result.data)
    except:
        return False