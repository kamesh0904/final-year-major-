"""
Enhanced Weekly & Daily Neuro-Insight Report Generator
Clinical Synthesis approach that triangulates multiple data sources
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
        """
        Generate a comprehensive clinical synthesis report by triangulating:
        1. Objective Data (Game Performance)
        2. Subjective Data (Post-Game Questionnaire Responses)
        3. Emotional Context (Chat History & Diary Entries)
        4. Baseline Profile (Initial Assessment)
        """
        
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
        """Collect data from all four sources"""
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Set time range based on report type
        if report_type == "daily":
            time_ago = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        else:  # weekly
            time_ago = datetime.now() - timedelta(days=7)
        
        try:
            # 1. OBJECTIVE DATA - Game Performance
            cursor.execute("""
                SELECT 
                    game_name,
                    score,
                    duration_seconds,
                    mistakes,
                    difficulty_level,
                    created_at
                FROM game_sessions 
                WHERE user_id = %s 
                AND created_at >= %s
                ORDER BY created_at DESC
            """, (user_id, time_ago))
            
            game_sessions = []
            for row in cursor.fetchall():
                game_sessions.append({
                    "game_name": row[0],
                    "score": row[1],
                    "duration": row[2],
                    "mistakes": row[3],
                    "difficulty": row[4],
                    "date": row[5].isoformat() if row[5] else None
                })
            
            # 2. SUBJECTIVE DATA - Post-Game Questionnaire Responses
            cursor.execute("""
                SELECT 
                    profile_category,
                    questions,
                    responses,
                    game_name,
                    session_duration,
                    created_at
                FROM post_game_responses 
                WHERE user_id = %s 
                AND created_at >= %s
                ORDER BY created_at DESC
            """, (user_id, time_ago))
            
            questionnaire_responses = []
            for row in cursor.fetchall():
                questions = json.loads(row[1]) if isinstance(row[1], str) else row[1]
                responses = json.loads(row[2]) if isinstance(row[2], str) else row[2]
                
                questionnaire_responses.append({
                    "category": row[0],
                    "questions": questions,
                    "responses": responses,
                    "game_name": row[3],
                    "duration": row[4],
                    "date": row[5].isoformat() if row[5] else None,
                    "positive_count": sum(responses) if responses else 0,
                    "total_count": len(responses) if responses else 0
                })
            
            # 3. EMOTIONAL CONTEXT - Chat History
            cursor.execute("""
                SELECT 
                    role,
                    content,
                    created_at
                FROM chat_messages 
                WHERE user_id = %s 
                AND created_at >= %s
                ORDER BY created_at DESC
                LIMIT 30
            """, (user_id, time_ago))
            
            chat_history = []
            for row in cursor.fetchall():
                chat_history.append({
                    "role": row[0],
                    "content": row[1],
                    "date": row[2].isoformat() if row[2] else None
                })
            
            # 3b. EMOTIONAL CONTEXT - Diary Entries
            cursor.execute("""
                SELECT 
                    title,
                    content,
                    mood_rating,
                    tags,
                    created_at
                FROM diary_entries 
                WHERE user_id = %s 
                AND created_at >= %s
                ORDER BY created_at DESC
                LIMIT 10
            """, (user_id, time_ago))
            
            diary_entries = []
            for row in cursor.fetchall():
                diary_entries.append({
                    "title": row[0],
                    "content": row[1],
                    "mood_rating": row[2],
                    "tags": json.loads(row[3]) if row[3] else [],
                    "date": row[4].isoformat() if row[4] else None
                })
            
            # 4. BASELINE PROFILE - Initial Assessment & Current Scores
            cursor.execute("""
                SELECT 
                    scores,
                    primary_profile,
                    secondary_profile,
                    created_at
                FROM profiles 
                WHERE id = %s
            """, (user_id,))
            
            profile_row = cursor.fetchone()
            baseline_profile = {
                "scores": profile_row[0] if profile_row else {},
                "primary_profile": profile_row[1] if profile_row else None,
                "secondary_profile": profile_row[2] if profile_row else None,
                "profile_created": profile_row[3].isoformat() if profile_row and profile_row[3] else None
            }
            
            # Calculate aggregated insights
            aggregated_insights = self._calculate_insights(
                game_sessions, questionnaire_responses, chat_history, diary_entries, report_type
            )
            
            cursor.close()
            conn.close()
            
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
            cursor.close()
            conn.close()
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
        """Generate the three-part clinical synthesis"""
        
        if report_type == "daily":
            system_prompt = """
            You are Dr. Nexus, a clinical psychologist AI specializing in neurodivergent mental health.
            
            You are creating a "Daily Clinical Synthesis" - a professional yet warm daily report that analyzes today's activities and mood to provide meaningful insights.
            
            AVAILABLE DATA:
            
            1. OBJECTIVE DATA (Today's Game Performance):
            - Game sessions: {game_sessions}
            - Performance trends: {performance_trends}
            - Total playtime: {total_playtime} seconds
            
            2. SUBJECTIVE DATA (Today's Questionnaire Responses):
            - Questionnaire responses: {questionnaire_responses}
            - Therapeutic progress: {therapeutic_progress}
            
            3. EMOTIONAL CONTEXT (Today):
            - Chat history: {chat_history}
            - Diary entries: {diary_entries}
            - Emotional patterns: {emotional_patterns}
            
            4. BASELINE PROFILE:
            - User profile: {baseline_profile}
            - Primary struggles: {primary_profile}
            
            5. USER CHECK-IN DATA:
            {checkin_data}
            
            TASK: Create a daily clinical synthesis report with exactly these three sections:
            
            A. TODAY'S OBSERVATION (100-150 words)
            - Analyze today's mood, energy, and activities
            - Compare subjective feelings vs objective performance today
            - Look for patterns in today's data
            - Use specific examples from today's data
            
            B. KEY MOMENT (40-60 words)
            - Highlight ONE specific, concrete moment or achievement from today
            - Use actual data points to support the moment
            - Build momentum and confidence
            
            C. FOCUS FOR TOMORROW (60-80 words)
            - Provide a specific, actionable suggestion for tomorrow
            - Recommend specific activities based on today's data
            - Address the biggest opportunity for tomorrow's growth
            
            TONE: Professional yet warm, like a caring therapist. Use "you" language. Be specific with data points.
            
            IMPORTANT: Return ONLY a JSON object with three keys: "daily_observation", "key_moment", "focus_area"
            """
        else:
            system_prompt = """
            You are Dr. Nexus, a clinical psychologist AI specializing in neurodivergent mental health.
            
            You are creating a "Clinical Synthesis" - a professional yet warm weekly report that triangulates multiple data sources to provide meaningful insights.
            
            AVAILABLE DATA:
            
            1. OBJECTIVE DATA (Game Performance):
            - Game sessions: {game_sessions}
            - Performance trends: {performance_trends}
            - Total playtime: {total_playtime} seconds
            
            2. SUBJECTIVE DATA (Post-Game Questionnaire Responses):
            - Questionnaire responses: {questionnaire_responses}
            - Therapeutic progress: {therapeutic_progress}
            
            3. EMOTIONAL CONTEXT:
            - Chat history: {chat_history}
            - Diary entries: {diary_entries}
            - Emotional patterns: {emotional_patterns}
            
            4. BASELINE PROFILE:
            - User profile: {baseline_profile}
            - Primary struggles: {primary_profile}
            
            5. USER CHECK-IN DATA:
            {checkin_data}
            
            TASK: Create a clinical synthesis report with exactly these three sections:
            
            A. CLINICAL OBSERVATION & INSIGHT (150-200 words)
            - Compare subjective feelings vs objective data
            - Look for discrepancies between how they feel vs how they performed
            - Identify patterns across all data sources
            - Use specific examples from the data
            
            B. KEY ACHIEVEMENT (50-75 words)
            - Highlight ONE specific, concrete win from the week
            - Use actual data points to support the achievement
            - Build momentum and confidence
            
            C. FOCUS AREA FOR NEXT WEEK (75-100 words)
            - Provide a specific, actionable prescription
            - Recommend specific games based on the data
            - Address the biggest opportunity for growth
            
            TONE: Professional yet warm, like a caring therapist. Use "you" language. Be specific with data points.
            
            IMPORTANT: Return ONLY a JSON object with three keys: "clinical_observation", "key_achievement", "focus_area"
            """
        
        prompt = ChatPromptTemplate.from_template(system_prompt)
        chain = prompt | self.llm
        
        try:
            ai_response = chain.invoke({
                "game_sessions": str(raw_data["objective_data"]["game_sessions"][:5]),  # Limit for context
                "performance_trends": str(raw_data["insights"]["performance_trends"]),
                "total_playtime": raw_data["objective_data"]["total_playtime"],
                "questionnaire_responses": str(raw_data["subjective_data"]["questionnaire_responses"][:3]),
                "therapeutic_progress": str(raw_data["insights"]["therapeutic_progress"]),
                "chat_history": str(raw_data["emotional_context"]["chat_history"][:10]),
                "diary_entries": str(raw_data["emotional_context"]["diary_entries"][:5]),
                "emotional_patterns": str(raw_data["insights"]["emotional_patterns"]),
                "baseline_profile": str(raw_data["baseline_profile"]),
                "primary_profile": raw_data["baseline_profile"]["primary_profile"],
                "checkin_data": str(checkin_data)
            })
            
            # Try to parse as JSON, fallback to structured text
            content = ai_response.content.strip()
            
            try:
                import json
                synthesis = json.loads(content)
            except:
                # Fallback: parse structured text
                synthesis = self._parse_structured_response(content)
            
            return synthesis
            
        except Exception as e:
            # Fallback synthesis based on report type
            if report_type == "daily":
                return {
                    "daily_observation": "Based on today's data, I can see your engagement with therapeutic activities. Your participation today shows commitment to your mental health journey.",
                    "key_moment": "You took time for self-care today, demonstrating dedication to your wellbeing.",
                    "focus_area": "Continue with tomorrow's activities and consider exploring new therapeutic practices that align with your needs."
                }
            else:
                return {
                    "clinical_observation": "Based on your week's data, I can see meaningful engagement with therapeutic gaming activities. Your consistent participation shows commitment to your mental health journey.",
                    "key_achievement": "You completed multiple gaming sessions this week, demonstrating dedication to your therapeutic goals.",
                    "focus_area": "Continue with your current gaming routine and consider exploring new therapeutic games that align with your primary profile needs."
                }
    
    def _parse_structured_response(self, content: str, report_type: str = "weekly") -> Dict[str, str]:
        """Parse structured text response as fallback"""
        
        if report_type == "daily":
            sections = {
                "daily_observation": "",
                "key_moment": "",
                "focus_area": ""
            }
        else:
            sections = {
                "clinical_observation": "",
                "key_achievement": "",
                "focus_area": ""
            }
        
        current_section = None
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if report_type == "daily":
                if "daily observation" in line.lower() or "today's observation" in line.lower():
                    current_section = "daily_observation"
                elif "key moment" in line.lower() or "moment" in line.lower():
                    current_section = "key_moment"
                elif "focus" in line.lower() and "tomorrow" in line.lower():
                    current_section = "focus_area"
                elif current_section and not line.startswith(('A.', 'B.', 'C.', '#')):
                    sections[current_section] += line + " "
            else:
                if "clinical observation" in line.lower() or "observation" in line.lower():
                    current_section = "clinical_observation"
                elif "key achievement" in line.lower() or "achievement" in line.lower():
                    current_section = "key_achievement"
                elif "focus area" in line.lower() or "next week" in line.lower():
                    current_section = "focus_area"
                elif current_section and not line.startswith(('A.', 'B.', 'C.', '#')):
                    sections[current_section] += line + " "
        
        # Clean up sections
        for key in sections:
            sections[key] = sections[key].strip()
        
        return sections

# Initialize the generator
synthesis_generator = ClinicalSynthesisGenerator()

@router.post("/generate-enhanced-weekly-report")
async def generate_enhanced_weekly_report(
    request: WeeklyReportRequest,
    user_id: str = Depends(get_current_user)
):
    """Generate an enhanced weekly report using clinical synthesis approach"""
    
    try:
        # Generate the clinical synthesis
        report_data = await synthesis_generator.generate_clinical_synthesis(
            user_id=request.userId,
            checkin_data=request.checkinData,
            report_type="weekly"
        )
        
        # Save the report to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO weekly_reports 
            (user_id, report_date, summary_text, raw_data, report_type)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (user_id, report_date) 
            DO UPDATE SET 
                summary_text = EXCLUDED.summary_text,
                raw_data = EXCLUDED.raw_data,
                updated_at = NOW()
        """, (
            request.userId,
            date.today(),
            json.dumps(report_data["synthesis"]),
            json.dumps(report_data["raw_data"]),
            "clinical_synthesis"
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
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
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT summary_text, raw_data, report_date, created_at
            FROM weekly_reports 
            WHERE user_id = %s 
            ORDER BY report_date DESC 
            LIMIT 1
        """, (user_id,))
        
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not row:
            return {"status": "no_report", "message": "No weekly report found"}
        
        summary_text = json.loads(row[0]) if isinstance(row[0], str) else row[0]
        raw_data = json.loads(row[1]) if isinstance(row[1], str) else row[1]
        
        return {
            "status": "success",
            "report": summary_text,
            "raw_data": raw_data,
            "report_date": row[2].isoformat() if row[2] else None,
            "created_at": row[3].isoformat() if row[3] else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving report: {str(e)}")

@router.post("/generate-daily-report")
async def generate_daily_report(
    request: DailyReportRequest,
    user_id: str = Depends(get_current_user)
):
    """Generate a daily report using clinical synthesis approach"""
    
    try:
        # Generate the clinical synthesis for daily report
        report_data = await synthesis_generator.generate_clinical_synthesis(
            user_id=request.userId,
            checkin_data=request.checkinData,
            report_type="daily"
        )
        
        # Save the report to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO daily_reports 
            (user_id, report_date, summary_text, raw_data, report_type)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (user_id, report_date) 
            DO UPDATE SET 
                summary_text = EXCLUDED.summary_text,
                raw_data = EXCLUDED.raw_data,
                updated_at = NOW()
        """, (
            request.userId,
            date.today(),
            json.dumps(report_data["synthesis"]),
            json.dumps(report_data["raw_data"]),
            "daily_clinical_synthesis"
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
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
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT summary_text, raw_data, report_date, created_at
            FROM daily_reports 
            WHERE user_id = %s 
            ORDER BY report_date DESC 
            LIMIT 1
        """, (user_id,))
        
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not row:
            return {"status": "no_report", "message": "No daily report found"}
        
        summary_text = json.loads(row[0]) if isinstance(row[0], str) else row[0]
        raw_data = json.loads(row[1]) if isinstance(row[1], str) else row[1]
        
        return {
            "status": "success",
            "report": summary_text,
            "raw_data": raw_data,
            "report_date": row[2].isoformat() if row[2] else None,
            "created_at": row[3].isoformat() if row[3] else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving daily report: {str(e)}")