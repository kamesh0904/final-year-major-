from pydantic import BaseModel, Field
from typing import Literal, Dict, Optional

# --- OBSERVER AGENT SCHEMAS ---


class ObserverSignal(BaseModel):
    """
    Machine-readable summary of the user's current state.
    """
    state: Literal[
        "calm",
        "overstimulated",
        "frustrated",
        "understimulated"
    ] = Field(description="Primary detected user state")

    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence in the detected state"
    )

    trend: Literal[
        "improving",
        "stable",
        "worsening"
    ] = Field(description="Short-term trend of user state")


# --- ARCHITECT AGENT SCHEMAS ---
class GameConfig(BaseModel):
    """
    Adaptive game configuration shared with frontend.
    """
    difficulty_level: int = Field(ge=1, le=5, description="1=Easy, 5=Hard")
    speed_multiplier: float = Field(ge=0.1, le=3.0, description="Speed factor")
    color_theme: str = Field(
        description="Hex code or theme name like 'calm_blue'")
    instruction_text: str = Field(
        description="Motivational or instructional message")


# --- INPUT SCHEMAS ---
class GameSessionInput(BaseModel):
    """
    Data coming from the Frontend after a game.
    """
    user_id: str
    game_name: str
    duration_seconds: int
    score: int
    high_score: Optional[int] = 0
    mistakes: Optional[int] = 0
    difficulty_level: int
    feedback: Optional[Dict[str, str]] = {}
