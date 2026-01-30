import os
import json
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from agents.schemas import ObserverSignal, GameSessionInput

load_dotenv()


class ObserverAgent:
    """
    Analyzes gameplay behavior and detects user state.
    """

    def __init__(self):
        self.llm = ChatOpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            model="gpt-4o",
            temperature=0
        )
        self.structured = self.llm.with_structured_output(ObserverSignal)

    def analyze_session(self, session: GameSessionInput) -> ObserverSignal:

        # We construct a context string for the LLM
        context = f"""
        Analyze this gameplay session for a neurodivergent user to detect their emotional state.
        
        GAME CONTEXT:
        - Game: {session.game_name}
        - Difficulty Level: {session.difficulty_level}
        - Duration: {session.duration_seconds} seconds
        
        PERFORMANCE:
        - Score: {session.score} (High Score: {session.high_score})
        - Mistakes: {session.mistakes}
        
        DIRECT USER FEEDBACK:
        {json.dumps(session.feedback, indent=2)}
        
        INSTRUCTIONS:
        - If the user reported frustration or anxiety, mark as "frustrated" or "overstimulated".
        - If the score is very high but they reported boredom, mark as "understimulated".
        - If they reported feeling relaxed or focused, mark as "calm".
        - "confidence" should be between 0.0 and 1.0 based on how consistent the data is.
        - "trend" indicates if they seem to be doing better or worse than expected.
        """

        try:
            return self.structured.invoke(context)
        except Exception as e:
            print(f"Observer Error: {e}")
            # Fallback safe signal
            return ObserverSignal(state="calm", confidence=0.0, trend="stable")
