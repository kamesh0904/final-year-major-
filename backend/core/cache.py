"""
Caching utilities for reducing API costs and improving response times.
Uses Upstash Redis for serverless-friendly caching.
"""

import os
import hashlib
import json
from typing import Optional
from upstash_redis import Redis

# Initialize Upstash Redis client
redis_client = None

def init_redis():
    """Initialize Redis client with environment variables"""
    global redis_client
    
    redis_url = os.getenv("UPSTASH_REDIS_URL")
    redis_token = os.getenv("UPSTASH_REDIS_TOKEN")
    
    if redis_url and redis_token:
        try:
            redis_client = Redis(url=redis_url, token=redis_token)
            print("✅ Redis cache connected successfully")
            return True
        except Exception as e:
            print(f"⚠️ Redis initialization failed: {e}")
            return False
    else:
        print("⚠️ Redis credentials not configured - caching disabled")
        return False


def get_cache_key(user_id: str, message: str, history_hash: str) -> str:
    """
    Generate a unique cache key from conversation context.
    
    Args:
        user_id: User identifier
        message: Current user message
        history_hash: Hash of conversation history
        
    Returns:
        MD5 hash to use as cache key
    """
    content = f"{user_id}:{message}:{history_hash}"
    return hashlib.md5(content.encode()).hexdigest()


def get_history_hash(history: list) -> str:
    """
    Create a hash of conversation history for cache key.
    
    Args:
        history: List of conversation messages
        
    Returns:
        MD5 hash of history
    """
    history_str = json.dumps(history, sort_keys=True)
    return hashlib.md5(history_str.encode()).hexdigest()


def get_cached_response(user_id: str, message: str, history: list) -> Optional[str]:
    """
    Retrieve cached AI response if it exists.
    
    Args:
        user_id: User identifier
        message: Current user message
        history: Conversation history
        
    Returns:
        Cached response string or None if not found
    """
    if not redis_client:
        return None
    
    try:
        history_hash = get_history_hash(history)
        cache_key = get_cache_key(user_id, message, history_hash)
        
        cached = redis_client.get(cache_key)
        if cached:
            print(f"✅ Cache HIT for key {cache_key[:8]}...")
            # Handle bytes or string response
            if isinstance(cached, bytes):
                return cached.decode('utf-8')
            return str(cached)
        
        print(f"❌ Cache MISS for key {cache_key[:8]}...")
        return None
        
    except Exception as e:
        print(f"⚠️ Cache retrieval error: {e}")
        return None


def cache_response(
    user_id: str, 
    message: str, 
    history: list, 
    response: str, 
    ttl: int = 3600
) -> bool:
    """
    Cache an AI response for future retrieval.
    
    Args:
        user_id: User identifier
        message: User message
        history: Conversation history
        response: AI response to cache
        ttl: Time to live in seconds (default: 1 hour)
        
    Returns:
        True if cached successfully, False otherwise
    """
    if not redis_client:
        return False
    
    try:
        history_hash = get_history_hash(history)
        cache_key = get_cache_key(user_id, message, history_hash)
        
        redis_client.setex(cache_key, ttl, response)
        print(f"💾 Cached response for key {cache_key[:8]}... (TTL: {ttl}s)")
        return True
        
    except Exception as e:
        print(f"⚠️ Cache storage error: {e}")
        return False


async def check_redis_connection() -> bool:
    """
    Check if Redis is connected and responsive.
    Used for health checks.
    
    Returns:
        True if connected, False otherwise
    """
    if not redis_client:
        return False
    
    try:
        # Try a simple ping
        redis_client.ping()
        return True
    except:
        return False
