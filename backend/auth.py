"""
Authentication utilities for NeuroNest backend
"""

from fastapi import HTTPException, Header
from typing import Optional
import os
import jwt
from datetime import datetime, timedelta
from supabase import create_client, Client
import logging

logger = logging.getLogger(__name__)

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None
    logger.warning("Supabase client not initialized - credentials missing")

async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """
    Extract and validate user ID from JWT token in authorization header
    Implements proper JWT validation for security
    """
    
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    token = authorization.replace("Bearer ", "").strip()
    
    if not token:
        raise HTTPException(status_code=401, detail="Token is empty")
    
    try:
        # Decode and validate JWT token
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )
        
        # Check token expiration
        exp = payload.get('exp')
        if exp and datetime.fromtimestamp(exp) < datetime.now():
            logger.warning(f"Expired token attempt")
            raise HTTPException(status_code=401, detail="Token expired")
        
        # Extract user ID from token
        user_id = payload.get('sub') or payload.get('user_id')
        
        if not user_id:
            logger.warning(f"Token missing user_id")
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        # Verify user exists in database
        if supabase:
            try:
                result = supabase.table("profiles").select("id").eq("id", user_id).execute()
                if not result.data:
                    logger.warning(f"User {user_id} not found in database")
                    raise HTTPException(status_code=401, detail="User not found")
            except Exception as db_error:
                logger.error(f"Database verification error: {str(db_error)}")
                # Continue if database check fails (don't block on DB issues)
        
        return user_id
        
    except jwt.ExpiredSignatureError:
        logger.warning("Expired JWT token")
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT token: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")

def verify_user_exists(user_id: str) -> bool:
    """
    Verify that a user exists in the database
    """
    if not supabase:
        logger.warning("Supabase not configured - skipping user verification")
        return True  # Skip verification if Supabase not configured
        
    try:
        result = supabase.table("profiles").select("id").eq("id", user_id).execute()
        return bool(result.data)
    except Exception as e:
        logger.error(f"Error verifying user exists: {str(e)}")
        return False

def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token for a user
    """
    if expires_delta is None:
        expires_delta = timedelta(hours=24)
    
    expire = datetime.utcnow() + expires_delta
    
    payload = {
        "sub": user_id,
        "user_id": user_id,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    
    token = jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token