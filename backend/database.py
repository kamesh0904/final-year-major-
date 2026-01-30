import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Force load the .env file
load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
# CRITICAL FIX: Use the Service Role Key from your .env file
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Warning: Supabase keys missing in backend .env")
    # Debugging aid
    print(f"DEBUG: URL found? {bool(url)} | Key found? {bool(key)}")
    supabase = None
else:
    try:
        supabase: Client = create_client(url, key)
        print("✅ Database connected successfully")
    except Exception as e:
        print(f"❌ Database Connection Failed: {e}")
        supabase = None


def update_xp(user_id: str, xp_gained: int):
    if not supabase:
        print("⚠️ Database not connected. XP not updated.")
        return
    try:
        # Get current XP
        res = supabase.table("profiles").select(
            "xp").eq("id", user_id).execute()

        # Safety check if user exists
        if not res.data:
            print(f"⚠️ User {user_id} not found in profiles.")
            return

        current_xp = res.data[0]['xp']

        new_xp = current_xp + xp_gained
        new_level = (new_xp // 100) + 1

        supabase.table("profiles").update(
            {"xp": new_xp, "level": new_level}
        ).eq("id", user_id).execute()

        print(f"🌟 Awarded {xp_gained} XP to user {user_id}")

    except Exception as e:
        print(f"❌ XP Update Error: {e}")


def save_game_session(session_data: dict, ai_config: dict):
    if not supabase:
        print("⚠️ Database not connected. Session not saved.")
        return
    try:
        data = {
            "user_id": session_data.get("user_id"),
            "game_name": session_data.get("game_name"),
            "score": session_data.get("score"),
            "duration_seconds": session_data.get("duration_seconds"),
            "difficulty_level": session_data.get("difficulty_level"),
            "ai_config": ai_config
        }
        supabase.table("game_sessions").insert(data).execute()
        print(f"💾 Game session saved for {session_data.get('game_name')}")

    except Exception as e:
        print(f"❌ Session Save Error: {e}")


def update_contact_info(user_id: str, address: str, emergency_phone: str):
    """Update user's contact information in the profiles table"""
    if not supabase:
        print("⚠️ Database not connected. Contact info not updated.")
        return False
    
    try:
        result = supabase.table("profiles").update({
            "address": address,
            "emergency_phone": emergency_phone
        }).eq("id", user_id).execute()
        
        print(f"📞 Contact info updated for user {user_id}")
        return True
        
    except Exception as e:
        print(f"❌ Contact Info Update Error: {e}")
        return False
