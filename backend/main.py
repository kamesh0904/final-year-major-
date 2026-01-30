import os
import datetime
import bcrypt
from typing import List, Dict, Optional
from dotenv import load_dotenv

# --- FastAPI Imports ---
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

# --- LangChain Imports ---
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

# --- Configuration ---
from config import settings

# --- Logic Imports (Ensure these exist in your project) ---
# If any of these are missing, comment them out temporarily to test the server
from logic.questionnaire import score_questionnaire
from logic.profiler import profile_user
from logic.game_router import get_recommended_games
from database import update_xp, save_game_session, update_contact_info
from agents.observer import ObserverAgent
from agents.architect import ArchitectAgent
from agents.companion import CompanionAgent
from agents.schemas import GameSessionInput, GameConfig
from post_game_questionnaire_simple import router as questionnaire_router
from weekly_report_generator_simple import router as weekly_report_router

# 1. LOAD ENV VARIABLES (only in development)
if not settings.is_production:
    load_dotenv()

# 2. INITIALIZE SUPABASE
SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_KEY = settings.SUPABASE_SERVICE_ROLE_KEY

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ WARNING: Supabase Credentials missing")

# Initialize Clients
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase connected successfully")
except Exception as e:
    print(f"⚠️ Supabase Init Failed: {e}")
    supabase = None

# ------------------ App Initialization ------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Personalization & Adaptive Logic API for NeuroNest",
    version=settings.VERSION,
    debug=settings.DEBUG
)

# ------------------ Middleware ------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ AI Agent Init ------------------
# Initialize these inside a try/catch in case API Key is missing
try:
    observer = ObserverAgent()
    architect = ArchitectAgent()
    companion = CompanionAgent()

    report_llm = ChatOpenAI(
        model="gpt-4o",
        temperature=0.7,
        api_key=settings.OPENAI_API_KEY
    )
    print("✅ AI agents initialized successfully")
except Exception as e:
    print(f"⚠️ AI Agent Init Failed (Check OpenAI Key): {e}")

# ------------------ Health Check ------------------
@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "NeuroNest AI Backend",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

@app.get("/health")
def detailed_health_check():
    return {
        "status": "healthy",
        "service": "NeuroNest AI Backend",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "supabase_connected": supabase is not None,
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "timestamp": datetime.datetime.now().isoformat()
    }

# ------------------ Request Models ------------------


class QuestionnaireSubmission(BaseModel):
    answers: Dict[int, int]


class QuestionnaireResult(BaseModel):
    primary: str
    secondary: Optional[str]
    recommended_games: List[str]
    scores: Dict[str, int]


class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]]
    profile: str
    game_stats: Optional[str] = "No recent games played."
    user_id: Optional[str] = None


class WeeklyReportRequest(BaseModel):
    userId: str
    checkinData: Dict[str, str]


class ContactInfoUpdate(BaseModel):
    address: str
    emergency_phone: str


class DiaryPasswordCreate(BaseModel):
    user_id: str
    password: str


class DiaryPasswordVerify(BaseModel):
    user_id: str
    password: str

# ------------------ Routes ------------------


@app.get("/")
def root():
    return {
        "status": "NeuroNest AI Backend Running",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }


@app.post("/submit-questionnaire", response_model=QuestionnaireResult)
def submit_questionnaire(payload: QuestionnaireSubmission):
    scores = score_questionnaire(payload.answers)
    profile = profile_user(scores)
    games = get_recommended_games(profile["primary"])
    return {
        "primary": profile["primary"],
        "secondary": profile["secondary"],
        "recommended_games": games,
        "scores": scores,
    }


@app.post("/submit-game-session", response_model=GameConfig)
def submit_game_session(payload: GameSessionInput):
    print(f"📥 Received Session: {payload.game_name}")
    user_state = observer.analyze_session(payload)
    new_config = architect.design_game(
        signal=user_state, current_difficulty=payload.difficulty_level)

    try:
        save_game_session(payload.dict(), new_config.dict())
        update_xp(payload.user_id, 50)
    except Exception as e:
        print(f"❌ Database Error: {e}")

    return new_config


@app.post("/chat", response_model=Dict[str, str])
def chat_with_companion(payload: ChatRequest):
    lc_history = []
    for msg in payload.history:
        if msg["role"] == "user":
            lc_history.append(HumanMessage(content=msg["content"]))
        else:
            lc_history.append(AIMessage(content=msg["content"]))

    response_text = companion.get_response(
        user_message=payload.message,
        history=lc_history,
        profile=payload.profile,
        game_stats=payload.game_stats,
        user_id=payload.user_id
    )
    return {"response": response_text}


@app.post("/generate-weekly-report")
async def generate_weekly_report(payload: WeeklyReportRequest):
    print(f"📊 Generating Report for User: {payload.userId}")
    try:
        # A. Profile
        profile_response = supabase.table("profiles").select(
            "*").eq("id", payload.userId).single().execute()
        profile = profile_response.data if profile_response.data else {}

        # B. Games (Last 7 Days)
        seven_days_ago = (datetime.datetime.now() -
                          datetime.timedelta(days=7)).isoformat()
        games_response = supabase.table("game_sessions").select("game_name, score").eq(
            "user_id", payload.userId).gte("created_at", seven_days_ago).execute()
        game_stats = games_response.data if games_response.data else []

        # C. Chats
        chats_response = supabase.table("chat_messages").select("role, content").eq(
            "user_id", payload.userId).gte("created_at", seven_days_ago).limit(20).execute()
        chat_logs = chats_response.data if chats_response.data else []

        # D. Prompt
        system_prompt = """
        You are Dr. Nexus, a clinical psychologist AI.
        DATA:
        - Profile: {profile}
        - Games: {game_stats}
        - Chat Logs: {chat_logs}
        - Self Report: {checkin_data}
        
        TASK: Write a 150-word Weekly Insight Report combining this data.
        """
        prompt = ChatPromptTemplate.from_template(system_prompt)
        chain = prompt | report_llm

        ai_response = chain.invoke({
            "profile": str(profile),
            "game_stats": str(game_stats),
            "chat_logs": str(chat_logs),
            "checkin_data": str(payload.checkinData)
        })

        report_text = ai_response.content

        # E. Save
        save_data = {
            "user_id": payload.userId,
            "report_date": datetime.date.today().isoformat(),
            "summary_text": report_text,
            "mood_score": 75
        }
        supabase.table("weekly_reports").insert(save_data).execute()

        return {"status": "success", "report": report_text}

    except Exception as e:
        print(f"❌ Error: {e}")
        return {"status": "error", "message": str(e)}


@app.post("/update-contact-info")
async def update_contact_info_endpoint(payload: ContactInfoUpdate):
    """Update user's address and emergency phone number"""
    try:
        # Note: In a production app, you'd extract user_id from JWT token
        # For now, this endpoint updates the database directly
        # You should implement proper authentication middleware
        
        print(f"📞 Updating contact info: {payload.address[:30] if payload.address else 'No address'}...")
        
        # Since we don't have user_id from auth token in this simplified version,
        # the frontend will handle the Supabase update directly
        # This endpoint can be used for additional processing or logging
        
        return {
            "status": "success", 
            "message": "Contact information update processed",
            "data": {
                "address_length": len(payload.address) if payload.address else 0,
                "has_emergency_phone": bool(payload.emergency_phone)
            }
        }
        
    except Exception as e:
        print(f"❌ Contact Update Error: {e}")
        return {"status": "error", "message": str(e)}


@app.post("/create-diary-password")
async def create_diary_password(payload: DiaryPasswordCreate):
    """Create a new diary password for the user"""
    try:
        # Hash the password
        password_bytes = payload.password.encode('utf-8')
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
        
        # Update the user's profile with the hashed password
        result = supabase.table("profiles").update({
            "diary_password_hash": password_hash,
            "diary_created_at": datetime.datetime.now().isoformat()
        }).eq("id", payload.user_id).execute()
        
        if result.data:
            print(f"📔 Diary password created for user {payload.user_id}")
            return {"status": "success", "message": "Diary password created successfully"}
        else:
            return {"status": "error", "message": "Failed to create diary password"}
            
    except Exception as e:
        print(f"❌ Diary Password Creation Error: {e}")
        return {"status": "error", "message": str(e)}


@app.post("/verify-diary-password")
async def verify_diary_password(payload: DiaryPasswordVerify):
    """Verify the diary password for the user"""
    try:
        # Get the stored password hash
        result = supabase.table("profiles").select("diary_password_hash").eq("id", payload.user_id).single().execute()
        
        if not result.data or not result.data.get("diary_password_hash"):
            return {"valid": False, "message": "No diary password set"}
        
        stored_hash = result.data["diary_password_hash"]
        password_bytes = payload.password.encode('utf-8')
        
        # Verify the password
        is_valid = bcrypt.checkpw(password_bytes, stored_hash.encode('utf-8'))
        
        if is_valid:
            print(f"📔 Diary access granted for user {payload.user_id}")
            return {"valid": True, "message": "Password verified"}
        else:
            print(f"🚫 Diary access denied for user {payload.user_id}")
            return {"valid": False, "message": "Invalid password"}
            
    except Exception as e:
        print(f"❌ Diary Password Verification Error: {e}")
        return {"valid": False, "message": str(e)}


@app.get("/diary-entries/{user_id}")
async def get_diary_entries_for_companion(user_id: str):
    """Get diary entries for AI companion analysis (internal use only)"""
    try:
        # This endpoint is for the AI companion to access diary entries
        # In production, add proper authentication and rate limiting
        
        result = supabase.table("diary_entries").select(
            "title, content, mood_rating, tags, created_at"
        ).eq("user_id", user_id).order("created_at", desc=True).limit(10).execute()
        
        entries = result.data if result.data else []
        
        print(f"📖 Retrieved {len(entries)} diary entries for companion analysis")
        return {"entries": entries}
        
    except Exception as e:
        print(f"❌ Diary Entries Retrieval Error: {e}")
        return {"entries": [], "error": str(e)}


# Include post-game questionnaire routes
app.include_router(questionnaire_router, prefix="/api/questionnaire", tags=["questionnaire"])

# Include enhanced weekly report routes
app.include_router(weekly_report_router, prefix="/api/reports", tags=["reports"])

# Start the server
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting NeuroNest Backend Server...")
    uvicorn.run(
        app, 
        host=settings.HOST, 
        port=settings.PORT,
        log_level=settings.LOG_LEVEL.lower()
    )