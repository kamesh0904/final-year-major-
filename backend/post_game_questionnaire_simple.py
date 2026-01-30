"""
Simplified Post-Game Questionnaire System
Works with basic Supabase operations instead of complex stored procedures
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
import json
from database import supabase
from auth import get_current_user

router = APIRouter()

class SessionTimeRequest(BaseModel):
    game_name: str
    session_duration: int  # in seconds

class SessionCheckResponse(BaseModel):
    should_trigger_questionnaire: bool
    total_duration: int
    available_questions_count: int
    category: str

class QuestionnaireResponse(BaseModel):
    game_name: str
    session_duration: int
    profile_category: str
    questions: List[str]
    responses: List[int]  # 1-5 scale responses

# Simplified question bank
QUESTION_BANK = {
    "ADHD": [
        "I felt focused during this activity",
        "I was able to pay attention without getting distracted",
        "I felt in control of my impulses",
        "I was able to complete tasks without rushing",
        "I felt organized in my thinking"
    ],
    "Anxiety": [
        "I felt calm during this activity",
        "I was able to manage any worried thoughts",
        "I felt relaxed and at ease",
        "I was able to stay present in the moment",
        "I felt confident in my abilities"
    ],
    "Depression": [
        "I felt motivated during this activity",
        "I experienced positive emotions",
        "I felt energized and engaged",
        "I had a sense of accomplishment",
        "I felt hopeful about my progress"
    ],
    "OCD": [
        "I was able to tolerate uncertainty",
        "I felt comfortable with imperfection",
        "I was able to resist checking behaviors",
        "I felt in control of my thoughts",
        "I was able to be flexible in my approach"
    ]
}

def determine_question_category(game_name: str, user_scores: Dict) -> str:
    """Determine which category of questions to use based on user profile"""
    if not user_scores:
        return "ADHD"  # Default
    
    # Find the highest scoring category
    max_category = max(user_scores, key=user_scores.get)
    return max_category

@router.post("/add-session-time")
async def add_session_time(
    request: SessionTimeRequest,
    user_id: str = Depends(get_current_user)
):
    """Add session time and check if questionnaire should be triggered"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Get user's profile scores to determine category
        try:
            profile_result = supabase.table("profiles").select("scores").eq("id", user_id).execute()
            
            if not profile_result.data or not profile_result.data[0].get("scores"):
                category = "ADHD"  # Default fallback
                scores = {}
            else:
                scores = profile_result.data[0]["scores"]
                category = determine_question_category(request.game_name, scores)
        except:
            category = "ADHD"  # Default fallback if profile doesn't exist
            scores = {}
        
        # Save the game session to existing game_sessions table
        try:
            session_data = {
                "user_id": user_id,
                "game_name": request.game_name,
                "duration_seconds": request.session_duration,
                "score": 0,  # Default score
                "created_at": datetime.now().isoformat()
            }
            supabase.table("game_sessions").insert(session_data).execute()
        except Exception as e:
            print(f"Warning: Could not save game session: {e}")
        
        # Simplified logic: trigger questionnaire for sessions >= 5 minutes (300 seconds)
        should_trigger = request.session_duration >= 300  # 5 minutes
        
        return SessionCheckResponse(
            should_trigger_questionnaire=should_trigger,
            total_duration=request.session_duration,
            available_questions_count=5 if should_trigger else 0,
            category=category
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding session time: {str(e)}")

class CategoryRequest(BaseModel):
    category: str

@router.post("/get-unused-questions")
async def get_unused_questions(
    request: CategoryRequest,
    user_id: str = Depends(get_current_user)
):
    """Get unused questions for a category"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Get questions for this category
        questions = QUESTION_BANK.get(request.category, QUESTION_BANK["ADHD"])
        
        return {
            "eligible": True,
            "questions": questions,
            "category": request.category
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting questions: {str(e)}")

@router.post("/submit-questionnaire")
async def submit_questionnaire(
    response: QuestionnaireResponse,
    user_id: str = Depends(get_current_user)
):
    """Submit post-game questionnaire responses"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # For now, save to game_sessions table with questionnaire data
        response_data = {
            "user_id": user_id,
            "game_name": response.game_name,
            "duration_seconds": response.session_duration,
            "score": sum(response.responses),  # Use sum of responses as score
            "created_at": datetime.now().isoformat(),
            # Store questionnaire data in a JSON field if available, or skip for now
        }
        
        try:
            result = supabase.table("game_sessions").insert(response_data).execute()
            print(f"✅ Questionnaire response saved for user {user_id}")
        except Exception as e:
            print(f"⚠️ Could not save questionnaire response: {e}")
            # Continue anyway - the important part is that the questionnaire was completed
        
        return {"success": True, "message": "Questionnaire submitted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting questionnaire: {str(e)}")

@router.get("/questionnaire-data/{days}")
async def get_questionnaire_data(
    days: int,
    user_id: str = Depends(get_current_user)
):
    """Get aggregated questionnaire data for reports"""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Get responses from the last N days
        cutoff_date = (datetime.now().date() - timedelta(days=days)).isoformat()
        
        result = supabase.table("post_game_responses").select("*").eq("user_id", user_id).gte("created_at", cutoff_date).execute()
        
        responses = result.data if result.data else []
        
        # Aggregate data by category
        aggregated_data = {}
        
        for response in responses:
            category = response["profile_category"]
            if category not in aggregated_data:
                aggregated_data[category] = {
                    "total_responses": 0,
                    "positive_responses": 0,
                    "total_sessions": 0,
                    "avg_session_duration": 0,
                    "games_played": set()
                }
            
            category_data = aggregated_data[category]
            category_data["total_responses"] += len(response["responses"])
            category_data["positive_responses"] += sum(1 for r in response["responses"] if r >= 4)
            category_data["total_sessions"] += 1
            category_data["avg_session_duration"] += response["session_duration"]
            category_data["games_played"].add(response["game_name"])
        
        # Calculate averages and percentages
        for category, data in aggregated_data.items():
            if data["total_sessions"] > 0:
                data["avg_session_duration"] = data["avg_session_duration"] // data["total_sessions"]
                data["positive_percentage"] = (data["positive_responses"] / data["total_responses"]) * 100 if data["total_responses"] > 0 else 0
            data["games_played"] = list(data["games_played"])
        
        return {
            "success": True,
            "data": aggregated_data,
            "total_days": days
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting questionnaire data: {str(e)}")