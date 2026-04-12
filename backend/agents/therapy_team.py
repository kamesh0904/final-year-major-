import os
import json
from typing import Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

class MultiAgentTherapyTeam:
    """
    A multi-agent architecture for synthesizing clinical reports.
    Uses three distinct personas to analyze user data and debate outcomes.
    """
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.7,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
    async def analyze_with_team(self, raw_data: Dict[str, Any], checkin_data: Dict[str, str], report_type: str = "weekly") -> Dict[str, str]:
        """Orchestrate the multi-agent analysis"""
        
        # 1. Analyst Agent: Focuses purely on objective game data and performance trends
        analyst_report = await self._run_analyst(raw_data)
        
        # 2. Empath Agent: Focuses purely on emotional context, diary entries, and chat history
        empath_report = await self._run_empath(raw_data)
        
        # 3. Lead Clinician: Synthesizes both reports into the final formatted JSON response
        final_synthesis = await self._run_clinician(analyst_report, empath_report, raw_data, checkin_data, report_type)
        
        return final_synthesis
        
    async def _run_analyst(self, data: Dict[str, Any]) -> str:
        prompt = ChatPromptTemplate.from_template("""
        You are the Data Analyst Agent on a clinical therapy team.
        Your job is ONLY to look at objective performance metrics and identify trends, drops, or improvements.
        
        Raw Data:
        Game Sessions: {game_sessions}
        Performance Trends: {performance_trends}
        Base Profile: {profile}
        
        Write a concise, bulleted objective analysis of the user's cognitive performance. Do not mention emotions.
        """)
        
        chain = prompt | self.llm
        response = chain.invoke({
            "game_sessions": str(data["objective_data"]["game_sessions"][:5]),
            "performance_trends": str(data["insights"]["performance_trends"]),
            "profile": str(data["baseline_profile"])
        })
        return response.content

    async def _run_empath(self, data: Dict[str, Any]) -> str:
        prompt = ChatPromptTemplate.from_template("""
        You are the Empath Agent on a clinical therapy team.
        Your job is ONLY to look at subjective emotional data, diaries, chats, and questionnaires to understand the user's mental state.
        
        Raw Data:
        Questionnaire Reponses: {questionnaires}
        Diary Entries: {diaries}
        Chat History: {chats}
        Emotional Patterns: {emotions}
        
        Write a concise, bulleted subjective analysis of the user's emotional state, stressors, and emotional needs. Do not analyze game scores.
        """)
        
        chain = prompt | self.llm
        response = chain.invoke({
            "questionnaires": str(data["subjective_data"]["questionnaire_responses"][:3]),
            "diaries": str(data["emotional_context"]["diary_entries"][:5]),
            "chats": str(data["emotional_context"]["chat_history"][:10]),
            "emotions": str(data["insights"]["emotional_patterns"])
        })
        return response.content

    async def _run_clinician(self, analyst_report: str, empath_report: str, raw_data: Dict[str, Any], checkin_data: Dict[str, str], report_type: str) -> Dict[str, str]:
        if report_type == "daily":
            system_prompt = """
            You are Dr. Nexus, the Lead Clinician coordinating a multi-agent therapy team.
            
            You have received reports from your Data Analyst and your Empath.
            
            ANALYST REPORT (Objective):
            {analyst_report}
            
            EMPATH REPORT (Subjective):
            {empath_report}
            
            USER CHECKIN Today: {checkin_data}
            
            TASK: Read both reports. If they clash (e.g. performing well objectively but feeling sad subjectively), address the discrepancy gently.
            Create a daily clinical synthesis report with exactly these three sections:
            
            A. TODAY'S OBSERVATION (100-150 words)
            - Analyze today's mood, energy, and activities bridging the objective and subjective findings
            
            B. KEY MOMENT (40-60 words)
            - Highlight ONE specific, concrete moment or achievement from today
            
            C. FOCUS FOR TOMORROW (60-80 words)
            - Provide a specific, actionable suggestion for tomorrow
            
            TONE: Professional yet warm, like a caring therapist. Use "you" language.
            IMPORTANT: Return ONLY a valid JSON object with three keys: "daily_observation", "key_moment", "focus_area". Do not include markdown formatting like ```json.
            """
        else:
            system_prompt = """
            You are Dr. Nexus, the Lead Clinician coordinating a multi-agent therapy team.
            
            You have received reports from your Data Analyst and your Empath for the week.
            
            ANALYST REPORT (Objective):
            {analyst_report}
            
            EMPATH REPORT (Subjective):
            {empath_report}
            
            USER CHECKIN: {checkin_data}
            
            TASK: Read both reports. Triangulate the data. Is their cognitive performance dropping due to anxiety? Are they masking their mood but playing well? 
            Create a weekly clinical synthesis report with exactly these three sections:
            
            A. CLINICAL OBSERVATION & INSIGHT (150-200 words)
            - Synthesize the objective performance and subjective feelings into one clear picture
            
            B. KEY ACHIEVEMENT (50-75 words)
            - Highlight ONE specific win from the week
            
            C. FOCUS AREA FOR NEXT WEEK (75-100 words)
            - Provide a specific, actionable prescription
            
            TONE: Professional yet warm, like a caring therapist. Use "you" language.
            IMPORTANT: Return ONLY a valid JSON object with three keys: "clinical_observation", "key_achievement", "focus_area". Do not include markdown formatting like ```json.
            """
            
        prompt = ChatPromptTemplate.from_template(system_prompt)
        chain = prompt | self.llm
        
        try:
            ai_response = chain.invoke({
                "analyst_report": analyst_report,
                "empath_report": empath_report,
                "checkin_data": str(checkin_data)
            })
            
            content = ai_response.content.strip()
            # Clean possible markdown
            if content.startswith("```json"):
                content = content[7:-3]
            elif content.startswith("```"):
                content = content[3:-3]
                
            synthesis = json.loads(content)
            return synthesis
        except Exception as e:
            print(f"Clinician Synthesis Failed: {e}")
            raise e
