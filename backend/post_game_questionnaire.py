"""
Post-Game Questionnaire System for Weekly Reports
Handles questionnaire eligibility, responses, and data aggregation
Updated to support cumulative session tracking and question history
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, validator, constr
from typing import List, Dict, Any, Optional
from datetime import datetime, date
import json
import logging
from database_connection import get_db_connection
from auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

class SessionTimeRequest(BaseModel):
    game_name: constr(min_length=1, max_length=100)
    session_duration: int  # in seconds
    
    @validator('session_duration')
    def validate_duration(cls, v):
        if v < 0 or v > 86400:  # Max 24 hours
            raise ValueError('Session duration must be between 0 and 86400 seconds')
        return v

class QuestionnaireResponse(BaseModel):
    game_name: constr(min_length=1, max_length=100)
    session_duration: int  # in seconds
    profile_category: constr(min_length=1, max_length=50)
    questions: List[str]
    responses: List[bool]
    
    @validator('session_duration')
    def validate_duration(cls, v):
        if v < 0 or v > 86400:
            raise ValueError('Session duration must be between 0 and 86400 seconds')
        return v
    
    @validator('questions')
    def validate_questions(cls, v):
        if len(v) == 0 or len(v) > 10:
            raise ValueError('Questions must contain 1-10 items')
        return v
    
    @validator('responses')
    def validate_responses(cls, v, values):
        if 'questions' in values and len(v) != len(values['questions']):
            raise ValueError('Responses must match questions length')
        return v

class SessionCheckResponse(BaseModel):
    should_trigger_questionnaire: bool
    total_duration: int
    available_questions_count: int
    category: str

class QuestionnaireEligibilityResponse(BaseModel):
    eligible: bool
    category: str
    unused_questions: List[str]
    available_count: int

@router.post("/add-session-time")
async def add_session_time(
    request: SessionTimeRequest,
    user_id: str = Depends(get_current_user)
):
    """Add session time and check if questionnaire should be triggered"""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user's profile scores to determine category
        cursor.execute("""
            SELECT scores FROM profiles WHERE id = %s
        """, (user_id,))
        
        profile = cursor.fetchone()
        if not profile:
            logger.warning(f"Profile not found for user {user_id}")
            category = "ADHD"  # Default fallback
            scores = {}
        elif not profile[0]:
            category = "ADHD"  # Default fallback
            scores = {}
        else:
            scores = profile[0]
            category = determine_question_category(request.game_name, scores)
        
        # Add session time and check if questionnaire should be triggered
        cursor.execute("""
            SELECT * FROM add_session_time_and_check(%s, %s, %s)
        """, (user_id, category, request.session_duration))
        
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=500, detail="Failed to add session time")
        
        should_trigger, total_duration, available_count = result
        
        return SessionCheckResponse(
            should_trigger_questionnaire=should_trigger,
            total_duration=total_duration,
            available_questions_count=available_count,
            category=category
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding session time for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error adding session time")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@router.post("/get-unused-questions")
async def get_unused_questions(
    category: str,
    user_id: str = Depends(get_current_user)
):
    """Get unused questions for a category"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get used questions for this user and category
        cursor.execute("""
            SELECT question_text FROM used_questions 
            WHERE user_id = %s AND profile_category = %s
        """, (user_id, category))
        
        used_questions = [row[0] for row in cursor.fetchall()]
        
        # Get all questions for this category from the question bank
        all_questions = get_questions_for_category(category)
        
        # Filter out used questions
        unused_questions = [q for q in all_questions if q not in used_questions]
        
        # Shuffle and take up to 5 questions
        import random
        random.shuffle(unused_questions)
        selected_questions = unused_questions[:5]
        
        cursor.close()
        conn.close()
        
        return QuestionnaireEligibilityResponse(
            eligible=len(selected_questions) > 0,
            category=category,
            unused_questions=selected_questions,
            available_count=len(unused_questions)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting unused questions: {str(e)}")

@router.post("/submit-post-game-questionnaire")
async def submit_post_game_questionnaire(
    response: QuestionnaireResponse,
    user_id: str = Depends(get_current_user)
):
    """Submit post-game questionnaire responses"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert questionnaire response
        cursor.execute("""
            INSERT INTO post_game_responses 
            (user_id, game_name, session_duration, profile_category, questions, responses)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            user_id,
            response.game_name,
            response.session_duration,
            response.profile_category,
            json.dumps(response.questions),
            json.dumps(response.responses)
        ))
        
        # Mark questions as used
        cursor.execute("""
            SELECT mark_questions_as_used(%s, %s, %s)
        """, (user_id, response.profile_category, response.questions))
        
        # Mark questionnaire as completed for today
        cursor.execute("""
            SELECT mark_daily_questionnaire_completed(%s, %s)
        """, (user_id, response.profile_category))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"success": True, "message": "Questionnaire submitted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting questionnaire: {str(e)}")

@router.get("/weekly-report-data")
async def get_weekly_report_data(
    user_id: str = Depends(get_current_user),
    days: int = 7
):
    """Get aggregated questionnaire data for weekly reports"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get responses from the last N days
        cursor.execute("""
            SELECT 
                profile_category,
                game_name,
                questions,
                responses,
                session_duration,
                created_at
            FROM post_game_responses 
            WHERE user_id = %s 
            AND created_at >= NOW() - INTERVAL '%s days'
            ORDER BY created_at DESC
        """, (user_id, days))
        
        rows = cursor.fetchall()
        
        # Get question usage statistics
        cursor.execute("""
            SELECT 
                profile_category,
                COUNT(*) as questions_used,
                (50 - COUNT(*)) as questions_remaining
            FROM used_questions 
            WHERE user_id = %s
            GROUP BY profile_category
        """, (user_id,))
        
        usage_stats = {row[0]: {"used": row[1], "remaining": row[2]} for row in cursor.fetchall()}
        
        # Aggregate data by category
        report_data = {}
        
        for row in rows:
            category, game_name, questions, responses, duration, created_at = row
            
            if category not in report_data:
                report_data[category] = {
                    "category": category,
                    "sessions": [],
                    "total_sessions": 0,
                    "total_duration": 0,
                    "positive_responses": 0,
                    "total_responses": 0,
                    "games_played": set(),
                    "questions_used": usage_stats.get(category, {}).get("used", 0),
                    "questions_remaining": usage_stats.get(category, {}).get("remaining", 50)
                }
            
            # Parse JSON data
            questions_list = json.loads(questions) if isinstance(questions, str) else questions
            responses_list = json.loads(responses) if isinstance(responses, str) else responses
            
            # Add session data
            session_data = {
                "game_name": game_name,
                "questions": questions_list,
                "responses": responses_list,
                "duration": duration,
                "date": created_at.isoformat()
            }
            
            report_data[category]["sessions"].append(session_data)
            report_data[category]["total_sessions"] += 1
            report_data[category]["total_duration"] += duration
            report_data[category]["positive_responses"] += sum(responses_list)
            report_data[category]["total_responses"] += len(responses_list)
            report_data[category]["games_played"].add(game_name)
        
        # Convert sets to lists for JSON serialization
        for category_data in report_data.values():
            category_data["games_played"] = list(category_data["games_played"])
            
            # Calculate percentage of positive responses
            if category_data["total_responses"] > 0:
                category_data["positive_percentage"] = (
                    category_data["positive_responses"] / category_data["total_responses"]
                ) * 100
            else:
                category_data["positive_percentage"] = 0
        
        cursor.close()
        conn.close()
        
        return {
            "report_data": report_data,
            "period_days": days,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

def determine_question_category(game_name: str, user_scores: Dict[str, int]) -> str:
    """Determine which question category to use based on game and user profile"""
    
    # Game to category mapping
    game_mapping = {
        "Chromatic Rush": "ADHD",
        "Impulse Guard": "ADHD",
        "Nebula Breath": "Anxiety",
        "Breath Sync": "Anxiety",
        "Sensory Flow": "Anxiety",
        "Pattern Release": "OCD",
        "Order Shift": "OCD",
        "Lumina": "Depression",
        "Light Builder": "Depression",
        "Neon Rise": "Depression",
        "Momentum Steps": "Depression",
        "Calm Path": "General",
        "Emotion Match": "General"
    }
    
    # Check if game has specific category
    game_category = game_mapping.get(game_name)
    if game_category and game_category != "General":
        return game_category
    
    # For general games, use user's highest scoring category
    if not user_scores:
        return "ADHD"  # Default fallback
    
    # Find category with highest score
    max_category = max(user_scores.items(), key=lambda x: x[1])[0]
    return max_category

def get_questions_for_category(category: str) -> List[str]:
    """Get all questions for a specific category"""
    
    question_bank = {
        "ADHD": [
            "Did you feel fully immersed in the task?",
            "Were you able to ignore external noises?",
            "Did you stop yourself from clicking too early?",
            "Did your mind wander less than usual?",
            "Could you track the moving targets easily?",
            "Did you feel less urge to check your phone?",
            "Was it easier to restart after a mistake?",
            "Did you maintain a consistent rhythm?",
            "Did you feel mentally sharp afterwards?",
            "Were you able to filter out the wrong colors?",
            "Did the time passing feel natural?",
            "Did you feel in control of your reactions?",
            "Could you anticipate the next move clearly?",
            "Did your thoughts feel less scattered?",
            "Were you able to sit still during the session?",
            "Did you complete the level without frustration?",
            "Did you notice when your attention drifted?",
            "Were you able to snap back to focus quickly?",
            "Did the visual clutter feel manageable?",
            "Did you feel a sense of flow?",
            "Was your reaction time consistent?",
            "Did you avoid impulsive clicking?",
            "Did you feel calm despite the speed?",
            "Were you able to prioritize the right target?",
            "Did you ignore the distractors successfully?",
            "Did you feel clearer headed after playing?",
            "Was it easier to listen to instructions?",
            "Did you feel less restless physically?",
            "Did you finish the session without quitting?",
            "Were you able to predict the patterns?",
            "Did you feel a sense of completion?",
            "Did the game noise bother you less over time?",
            "Were you able to hyperfocus constructively?",
            "Did you feel less 'brain fog'?",
            "Did you hesitate less when making decisions?",
            "Did you feel proud of your high score?",
            "Was your focus steady throughout?",
            "Did you feel less overwhelmed by the speed?",
            "Did you catch yourself before making an error?",
            "Did you feel 'locked in'?",
            "Was it easier to direct your gaze?",
            "Did you feel less mental fatigue than expected?",
            "Did you manage the chaos effectively?",
            "Did you feel less need to multitask?",
            "Were your movements precise?",
            "Did you feel patient with the difficulty?",
            "Did you notice details you usually miss?",
            "Did the session fly by quickly?",
            "Did you feel ready to tackle work after?",
            "Do you feel more alert right now?"
        ],
        "Anxiety": [
            "Is your breathing slower than before?",
            "Did your shoulders drop and relax?",
            "Did the tightness in your chest fade?",
            "Are your racing thoughts slowing down?",
            "Do you feel more present in your body?",
            "Did the visual rhythm help you center?",
            "Did you stop clenching your jaw?",
            "Do you feel lighter mentally?",
            "Did the ambient sound soothe you?",
            "Are you less worried about the future?",
            "Did you feel safe during the session?",
            "Is your heart rate more steady?",
            "Did you manage to close your eyes comfortably?",
            "Do you feel a sense of spaciousness?",
            "Did you let go of the day's stress?",
            "Are your hands warmer and relaxed?",
            "Did you stop overthinking for a moment?",
            "Do you feel more grounded in the room?",
            "Did the colors help change your mood?",
            "Are you breathing from your diaphragm?",
            "Did you feel less need to control things?",
            "Did the silence feel comfortable?",
            "Do you feel more capable of handling stress?",
            "Did you visualize your worry leaving?",
            "Are you less reactive to noises?",
            "Did you feel a moment of pure peace?",
            "Is your mind quieter right now?",
            "Did you feel supported by the rhythm?",
            "Are you less focused on your problems?",
            "Did you feel a release of tension?",
            "Do you feel ready to rest?",
            "Did you stop fidgeting?",
            "Are you more aware of your breath?",
            "Did you feel a wave of calm?",
            "Are your thoughts less chaotic?",
            "Did you feel connected to the flow?",
            "Do you feel less on edge?",
            "Did you forget your to-do list?",
            "Are your muscles less stiff?",
            "Did you feel a sense of warmth?",
            "Are you judging yourself less?",
            "Did you allow yourself to just be?",
            "Do you feel more balanced emotionally?",
            "Did the panic subside?",
            "Are you breathing deeper naturally?",
            "Did you feel enveloped in calm?",
            "Do you feel less frantic?",
            "Did you find a moment of stillness?",
            "Are you ready to face the world calmly?",
            "Do you feel at ease?"
        ],
        "OCD": [
            "Did you accept the imperfect pattern?",
            "Did you resist the urge to fix it?",
            "Did the changing rules feel manageable?",
            "Did you adapt to the new color quickly?",
            "Were you able to let go of the mistake?",
            "Did you feel less need for symmetry?",
            "Did you tolerate the wrong order?",
            "Did the chaos feel okay?",
            "Did you stop counting the items?",
            "Were you able to switch strategies fast?",
            "Did you feel less stuck on details?",
            "Did you accept the 'odd one out'?",
            "Did you resist checking the score?",
            "Did you feel flexible in your thinking?",
            "Were you okay with not finishing perfectly?",
            "Did you manage the uncertainty?",
            "Did you feel less rigid mentally?",
            "Did you move on from the error quickly?",
            "Did you suppress the urge to reorganize?",
            "Did you feel comfortable with randomness?",
            "Did you trust your quick judgment?",
            "Did you handle the rule reversal well?",
            "Did you feel less compulsion to tap?",
            "Did you ignore the uneven spacing?",
            "Did you feel in control of your urge?",
            "Did you laugh at the mistake?",
            "Did you feel less pressure to be right?",
            "Did you flow with the changes?",
            "Did you stop analyzing the grid?",
            "Were you able to break your routine?",
            "Did you feel less mental friction?",
            "Did you accept the messy arrangement?",
            "Did you avoid restarting the level?",
            "Did you feel less 'stuck'?",
            "Did you handle the surprise well?",
            "Did you refrain from double-checking?",
            "Did you feel okay leaving it undone?",
            "Did you challenge your perfectionism?",
            "Did you feel freer in your choices?",
            "Did you stop seeking reassurance?",
            "Did you tolerate the asymmetry?",
            "Did you feel mentally agile?",
            "Did you embrace the disorder?",
            "Did you resist the ritual?",
            "Did you feel less mental stickiness?",
            "Did you go with the flow?",
            "Did you accept the 'good enough' result?",
            "Did you feel less trapped by rules?",
            "Did you surprise yourself with flexibility?",
            "Do you feel more open-minded?"
        ],
        "Depression": [
            "Did you feel a spark of achievement?",
            "Did the light make you feel hopeful?",
            "Did you enjoy the visual progress?",
            "Did completing the task feel good?",
            "Did you feel energetic seeing the glow?",
            "Did you want to keep going?",
            "Did the darkness lifting feel rewarding?",
            "Did you feel capable of change?",
            "Did you smile at the success?",
            "Did you feel less heavy?",
            "Did the small win matter?",
            "Did you feel a sense of purpose?",
            "Did you visualize your own growth?",
            "Did you feel motivated to try again?",
            "Did the colors brighten your mood?",
            "Did you feel less numb?",
            "Did you appreciate the beauty?",
            "Did you feel like you made an impact?",
            "Did the momentum carry you forward?",
            "Did you feel less stuck?",
            "Did you enjoy building something?",
            "Did you feel a sense of agency?",
            "Did the music lift your spirits?",
            "Did you look forward to the next step?",
            "Did you feel proud of the result?",
            "Did you feel less isolated?",
            "Did you realize you have power?",
            "Did the progress bar satisfying?",
            "Did you feel a little lighter?",
            "Did you want to do more?",
            "Did you feel connected to the goal?",
            "Did the visual feedback help?",
            "Did you feel a burst of dopamine?",
            "Did you realize small steps count?",
            "Did you feel less defeated?",
            "Did you enjoy the creation process?",
            "Did you feel active participation?",
            "Did the gloom fade a little?",
            "Did you feel ready to tackle a chore?",
            "Did you see the possibilities?",
            "Did you feel a shift in perspective?",
            "Did you feel less paralyzed?",
            "Did you enjoy the streaks?",
            "Did you feel worth the effort?",
            "Did you notice the improvement?",
            "Did you feel optimistic?",
            "Did you feel like a builder?",
            "Did the activity wake you up?",
            "Did you feel a sense of renewal?",
            "Do you feel ready for tomorrow?"
        ]
    }
    
    return question_bank.get(category, [])