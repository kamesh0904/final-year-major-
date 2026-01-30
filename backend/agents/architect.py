import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from agents.schemas import GameConfig, ObserverSignal

load_dotenv()


class ArchitectAgent:
    """
    Generates adaptive game configuration.
    """

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            api_key=os.getenv("GOOGLE_API_KEY"),
            model="gemini-1.5-flash",
            temperature=0.4
        )
        self.structured = self.llm.with_structured_output(GameConfig)

    def design_game(self, signal: ObserverSignal, current_difficulty: int) -> GameConfig:
        prompt = f"""
        The user is currently detected as: {signal.state}
        Confidence: {signal.confidence}
        Trend: {signal.trend}
        
        Current Difficulty Level: {current_difficulty}
        
        TASK:
        Adjust the game configuration to optimize for emotional regulation.
        
        RULES:
        1. "overstimulated" or "frustrated": LOWER difficulty, REDUCE speed, choose calming colors (greens/blues).
        2. "understimulated": INCREASE difficulty, INCREASE speed, choose vibrant colors.
        3. "calm": Maintain current settings or slightly nudge difficulty up to keep flow.
        
        Generate a GameConfig JSON.
        """

        try:
            return self.structured.invoke(prompt)
        except Exception as e:
            print(f"Architect Error: {e}")
            # Fallback default config
            return GameConfig(
                difficulty_level=1,
                speed_multiplier=1.0,
                color_theme="default",
                instruction_text="Let's try again gently."
            )
