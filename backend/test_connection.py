import os
from dotenv import load_dotenv
from supabase import create_client
from google import genai
from groq import Groq

# Manually point to the file to avoid VS Code path errors
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))


def test_all():
    print("--- 🧪 Starting NeuroNest Health Check ---")

    # 1. Supabase Check
    try:
        url = os.getenv("SUPABASE_URL")
        # Ensure this matches the .env key name exactly
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise ValueError("Check your .env names!")
        supabase = create_client(url, key)
        # Verify by fetching from your 'profiles' table
        supabase.table("profiles").select("*").limit(1).execute()
        print("✅ Supabase: Connected!")
    except Exception as e:
        print(f"❌ Supabase Error: {e}")

    # 2. Gemini 3 Check (The Architect)
    try:
        # Fixed 404: Use 'gemini-3-flash-preview'
        client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
        res = client.models.generate_content(
            model="gemini-3-flash-preview", contents="Test")
        print("✅ Gemini 3: Active!")
    except Exception as e:
        print(f"❌ Gemini Error: {e}")

    # 3. Groq Check (The Observer)
    try:
        # Fixed: Use 'llama-3.3-70b-versatile'
        groq = Groq(api_key=os.getenv("GROQ_API_KEY"))
        res = groq.chat.completions.create(
            messages=[{"role": "user", "content": "Test"}],
            model="llama-3.3-70b-versatile"
        )
        print("✅ Groq: Active!")
    except Exception as e:
        print(f"❌ Groq Error: {e}")


if __name__ == "__main__":
    test_all()
