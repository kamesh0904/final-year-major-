"""
Simplified Weekly & Daily Report Generator
Uses Supabase operations instead of raw SQL
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
import json
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
import os
from database import supabase
from auth import get_current_user

router = APIRouter()

class WeeklyReportRequest(BaseModel):
    userId: str
    checkinData: Dict[str, str]

class DailyReportRequest(BaseModel):
    userId: str
    checkinData: Dict[str, str]

class WeeklyReportResponse(BaseModel):
    status: str
    report: Dict[str, Any]
    raw_data: Dict[str, Any]

class DailyReportResponse(BaseModel):
    status: str
    report: Dict[str, Any]
    raw_data: Dict[str, Any]

class ClinicalSynthesisGenerator:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.7,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
    async def generate_clinical_synthesis(
        self, 
        user_id: str, 
        checkin_data: Dict[str, str],
        report_type: str = "weekly"
    ) -> Dict[str, Any]:
        """Generate clinical synthesis using Supabase data"""
        
        # Collect all data sources
        raw_data = await self._collect_data_sources(user_id, report_type)
        
        # Generate the clinical synthesis
        synthesis = await self._generate_synthesis(raw_data, checkin_data, report_type)
        
        return {
            "synthesis": synthesis,
            "raw_data": raw_data,
            "generated_at": datetime.now().isoformat()
        }
    
    async def _collect_data_sources(self, user_id: str, report_type: str = "weekly") -> Dict[str, Any]:
        """Collect data from Supabase"""
        
        if not supabase:
            raise Exception("Database not available")
        
        # Set time range based on report type
        if report_type == "daily":
            time_ago = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        else:  # weekly
            time_ago = datetime.now() - timedelta(days=7)
        
        try:
            # 1. OBJECTIVE DATA - Game Performance
            game_sessions_result = supabase.table("game_sessions").select(
                "game_name, score, duration_seconds, created_at"
            ).eq("user_id", user_id).gte("created_at", time_ago.isoformat()).execute()
            
            game_sessions = []
            for session in (game_sessions_result.data or []):
                game_sessions.append({
                    "game_name": session["game_name"],
                    "score": session["score"],
                    "duration": session.get("duration_seconds", 0),
                    "mistakes": 0,  # Default value since column doesn't exist
                    "difficulty": 1,  # Default value since column doesn't exist
                    "date": session["created_at"]
                })
            
            # 2. SUBJECTIVE DATA - Post-Game Questionnaire Responses (skip if table doesn't exist)
            questionnaire_responses = []
            try:
                questionnaire_result = supabase.table("post_game_responses").select(
                    "profile_category, questions, responses, game_name, session_duration, created_at"
                ).eq("user_id", user_id).gte("created_at", time_ago.isoformat()).execute()
                
                for response in (questionnaire_result.data or []):
                    questionnaire_responses.append({
                        "category": response["profile_category"],
                        "questions": response["questions"],
                        "responses": response["responses"],
                        "game_name": response["game_name"],
                        "duration": response["session_duration"],
                        "date": response["created_at"],
                        "positive_count": sum(response["responses"]) if response["responses"] else 0,
                        "total_count": len(response["responses"]) if response["responses"] else 0
                    })
            except Exception as e:
                print(f"⚠️ Skipping post_game_responses table: {e}")
                questionnaire_responses = []
            
            # 3. EMOTIONAL CONTEXT - Chat History (skip if table doesn't exist)
            chat_history = []
            try:
                chat_result = supabase.table("chat_messages").select(
                    "role, content, created_at"
                ).eq("user_id", user_id).gte("created_at", time_ago.isoformat()).limit(30).execute()
                
                for chat in (chat_result.data or []):
                    chat_history.append({
                        "role": chat["role"],
                        "content": chat["content"],
                        "date": chat["created_at"]
                    })
            except Exception as e:
                print(f"⚠️ Skipping chat_messages table: {e}")
                chat_history = []
            
            # 3b. EMOTIONAL CONTEXT - Diary Entries (skip if table doesn't exist)
            diary_entries = []
            try:
                diary_result = supabase.table("diary_entries").select(
                    "title, content, mood_rating, tags, created_at"
                ).eq("user_id", user_id).gte("created_at", time_ago.isoformat()).limit(10).execute()
                
                for entry in (diary_result.data or []):
                    diary_entries.append({
                        "title": entry["title"],
                        "content": entry["content"],
                        "mood_rating": entry.get("mood_rating", 0),
                        "tags": entry.get("tags", []),
                        "date": entry["created_at"]
                    })
            except Exception as e:
                print(f"⚠️ Skipping diary_entries table: {e}")
                diary_entries = []
            
            # 4. BASELINE PROFILE - Initial Assessment & Current Scores
            try:
                profile_result = supabase.table("profiles").select(
                    "scores, created_at"
                ).eq("id", user_id).single().execute()
                
                baseline_profile = {
                    "scores": profile_result.data.get("scores", {}) if profile_result.data else {},
                    "primary_profile": None,  # Column doesn't exist, use default
                    "secondary_profile": None,  # Column doesn't exist, use default
                    "profile_created": profile_result.data.get("created_at") if profile_result.data else None
                }
            except Exception as e:
                print(f"⚠️ Error getting profile data: {e}")
                baseline_profile = {
                    "scores": {},
                    "primary_profile": None,
                    "secondary_profile": None,
                    "profile_created": None
                }
            
            # Calculate aggregated insights
            aggregated_insights = self._calculate_insights(
                game_sessions, questionnaire_responses, chat_history, diary_entries, report_type
            )
            
            return {
                "objective_data": {
                    "game_sessions": game_sessions,
                    "total_sessions": len(game_sessions),
                    "total_playtime": sum(s.get("duration", 0) for s in game_sessions),
                    "games_played": list(set(s["game_name"] for s in game_sessions))
                },
                "subjective_data": {
                    "questionnaire_responses": questionnaire_responses,
                    "total_questionnaires": len(questionnaire_responses),
                    "categories_assessed": list(set(r["category"] for r in questionnaire_responses))
                },
                "emotional_context": {
                    "chat_history": chat_history,
                    "diary_entries": diary_entries,
                    "total_interactions": len(chat_history) + len(diary_entries)
                },
                "baseline_profile": baseline_profile,
                "insights": aggregated_insights
            }
            
        except Exception as e:
            raise e
    
    def _calculate_insights(self, games, questionnaires, chats, diary_entries, report_type="weekly"):
        """Calculate key insights from the data"""
        
        insights = {
            "performance_trends": {},
            "emotional_patterns": {},
            "engagement_metrics": {},
            "therapeutic_progress": {}
        }
        
        # Performance trends
        if games:
            game_performance = {}
            for game in games:
                game_name = game["game_name"]
                if game_name not in game_performance:
                    game_performance[game_name] = []
                game_performance[game_name].append({
                    "score": game["score"],
                    "duration": game["duration"],
                    "mistakes": game.get("mistakes", 0)
                })
            
            insights["performance_trends"] = game_performance
        
        # Questionnaire insights
        if questionnaires:
            category_positivity = {}
            for q in questionnaires:
                category = q["category"]
                if category not in category_positivity:
                    category_positivity[category] = []
                
                if q["total_count"] > 0:
                    positivity = (q["positive_count"] / q["total_count"]) * 100
                    category_positivity[category].append(positivity)
            
            insights["therapeutic_progress"] = {
                cat: {
                    "average_positivity": sum(scores) / len(scores) if scores else 0,
                    "sessions": len(scores)
                }
                for cat, scores in category_positivity.items()
            }
        
        # Emotional patterns from diary
        if diary_entries:
            mood_ratings = [entry["mood_rating"] for entry in diary_entries if entry["mood_rating"]]
            insights["emotional_patterns"] = {
                "average_mood": sum(mood_ratings) / len(mood_ratings) if mood_ratings else 0,
                "mood_entries": len(mood_ratings),
                "diary_frequency": len(diary_entries)
            }
        
        # Engagement metrics
        insights["engagement_metrics"] = {
            "total_game_sessions": len(games),
            "total_questionnaires": len(questionnaires),
            "total_chat_messages": len([c for c in chats if c["role"] == "user"]),
            "total_diary_entries": len(diary_entries)
        }
        
        return insights
    
    async def _generate_synthesis(self, raw_data: Dict[str, Any], checkin_data: Dict[str, str], report_type: str = "weekly") -> Dict[str, str]:
        """Generate the clinical synthesis using OpenAI"""
        
        if report_type == "daily":
            system_prompt = """
            You are Dr. Nexus, a clinical psychologist AI specializing in neurodivergent mental health.
            
            Create a daily clinical synthesis with these three sections:
            
            A. TODAY'S OBSERVATION (100-150 words)
            - Analyze today's mood, energy, and activities
            - Compare subjective feelings vs objective performance today
            
            B. KEY MOMENT (40-60 words)
            - Highlight ONE specific moment or achievement from today
            
            C. FOCUS FOR TOMORROW (60-80 words)
            - Provide a specific suggestion for tomorrow
            
            Return ONLY a JSON object with keys: "daily_observation", "key_moment", "focus_area"
            """
        else:
            system_prompt = """
            You are Dr. Nexus, a clinical psychologist AI specializing in neurodivergent mental health.
            
            Create a weekly clinical synthesis with these three sections:
            
            A. CLINICAL OBSERVATION & INSIGHT (150-200 words)
            - Compare subjective feelings vs objective data
            - Identify patterns across all data sources
            
            B. KEY ACHIEVEMENT (50-75 words)
            - Highlight ONE specific win from the week
            
            C. FOCUS AREA FOR NEXT WEEK (75-100 words)
            - Provide specific, actionable recommendations
            
            Return ONLY a JSON object with keys: "clinical_observation", "key_achievement", "focus_area"
            """
        
        prompt = ChatPromptTemplate.from_template(system_prompt + "\n\nData: {data}\nCheck-in: {checkin}")
        chain = prompt | self.llm
        
        try:
            ai_response = chain.invoke({
                "data": str(raw_data)[:2000],  # Limit context size
                "checkin": str(checkin_data)
            })
            
            # Try to parse as JSON
            content = ai_response.content.strip()
            try:
                synthesis = json.loads(content)
            except:
                # Fallback synthesis
                if report_type == "daily":
                    synthesis = {
                        "daily_observation": "Based on today's data, I can see your engagement with therapeutic activities. Your participation shows commitment to your mental health journey.",
                        "key_moment": "You took time for self-care today, demonstrating dedication to your wellbeing.",
                        "focus_area": "Continue with tomorrow's activities and consider exploring new therapeutic practices."
                    }
                else:
                    synthesis = {
                        "clinical_observation": "Based on your week's data, I can see meaningful engagement with therapeutic activities. Your consistent participation shows commitment to your mental health journey.",
                        "key_achievement": "You completed multiple sessions this week, demonstrating dedication to your therapeutic goals.",
                        "focus_area": "Continue with your current routine and consider exploring new therapeutic games that align with your needs."
                    }
            
            return synthesis
            
        except Exception as e:
            # Fallback synthesis
            if report_type == "daily":
                return {
                    "daily_observation": "Today you engaged with your mental health journey. Every step forward matters.",
                    "key_moment": "You showed up for yourself today.",
                    "focus_area": "Tomorrow is a new opportunity for growth and self-care."
                }
            else:
                return {
                    "clinical_observation": "This week you've shown commitment to your mental health journey through consistent engagement.",
                    "key_achievement": "You prioritized your wellbeing this week.",
                    "focus_area": "Continue building on your progress with consistent self-care practices."
                }

# Initialize the generator
synthesis_generator = ClinicalSynthesisGenerator()

@router.post("/generate-enhanced-weekly-report")
async def generate_enhanced_weekly_report(
    request: WeeklyReportRequest,
    user_id: str = Depends(get_current_user)
):
    """Generate an enhanced weekly report"""
    
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Generate the clinical synthesis
        report_data = await synthesis_generator.generate_clinical_synthesis(
            user_id=request.userId,
            checkin_data=request.checkinData,
            report_type="weekly"
        )
        
        # Save the report to database using existing weekly_reports table structure
        report_record = {
            "user_id": request.userId,
            "report_date": date.today().isoformat(),
            "summary_text": json.dumps(report_data["synthesis"]),
            "mood_score": 80  # Default mood score for weekly reports
        }
        
        supabase.table("weekly_reports").insert(report_record).execute()
        
        return WeeklyReportResponse(
            status="success",
            report=report_data["synthesis"],
            raw_data=report_data["raw_data"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

@router.get("/get-latest-weekly-report")
async def get_latest_weekly_report(user_id: str = Depends(get_current_user)):
    """Get the latest weekly report for a user"""
    
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not available")
        
        result = supabase.table("weekly_reports").select("*").eq("user_id", user_id).order("report_date", desc=True).limit(1).execute()
        
        if not result.data:
            return {"status": "no_report", "message": "No weekly report found"}
        
        report = result.data[0]
        
        # Parse the summary_text back to dict if it's JSON
        summary_text = report["summary_text"]
        if isinstance(summary_text, str):
            try:
                summary_text = json.loads(summary_text)
            except:
                # If it's not JSON, create a simple structure
                summary_text = {
                    "clinical_observation": summary_text,
                    "key_achievement": "You engaged with your mental health journey this week.",
                    "focus_area": "Continue with your current self-care practices."
                }
        
        return {
            "status": "success",
            "report": summary_text,
            "raw_data": {"simplified": True},  # Simplified raw data
            "report_date": report["report_date"],
            "created_at": report.get("created_at", report["report_date"])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving report: {str(e)}")

@router.post("/generate-daily-report")
async def generate_daily_report(
    request: DailyReportRequest,
    user_id: str = Depends(get_current_user)
):
    """Generate a daily report"""
    
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not available")
        
        # Generate the clinical synthesis for daily report
        report_data = await synthesis_generator.generate_clinical_synthesis(
            user_id=request.userId,
            checkin_data=request.checkinData,
            report_type="daily"
        )
        
        # Save the report to database using existing weekly_reports table structure
        report_record = {
            "user_id": request.userId,
            "report_date": date.today().isoformat(),
            "summary_text": json.dumps(report_data["synthesis"]),
            "mood_score": 75  # Default mood score
        }
        
        supabase.table("weekly_reports").insert(report_record).execute()
        
        return DailyReportResponse(
            status="success",
            report=report_data["synthesis"],
            raw_data=report_data["raw_data"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating daily report: {str(e)}")

@router.get("/get-latest-daily-report")
async def get_latest_daily_report(user_id: str = Depends(get_current_user)):
    """Get the latest daily report for a user"""
    
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not available")
        
        result = supabase.table("weekly_reports").select("*").eq("user_id", user_id).order("report_date", desc=True).limit(1).execute()
        
        if not result.data:
            return {"status": "no_report", "message": "No daily report found"}
        
        report = result.data[0]
        
        # Parse the summary_text back to dict if it's JSON
        summary_text = report["summary_text"]
        if isinstance(summary_text, str):
            try:
                summary_text = json.loads(summary_text)
            except:
                # If it's not JSON, create a simple structure
                summary_text = {
                    "daily_observation": summary_text,
                    "key_moment": "You engaged with your mental health journey today.",
                    "focus_area": "Continue with your self-care practices tomorrow."
                }
        
        return {
            "status": "success",
            "report": summary_text,
            "raw_data": {"simplified": True},  # Simplified raw data
            "report_date": report["report_date"],
            "created_at": report.get("created_at", report["report_date"])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving daily report: {str(e)}")