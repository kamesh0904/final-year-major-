from typing import List

GAME_MAP = {
    "ADHD": [
        "Chromatic Rush",
        "Impulse Guard"
    ],
    "OCD": [
        "Pattern Release",  # <--- Primary OCD Recommendation
        "Order Shift"
    ],
    "ASD": [
        "Sensory Flow",
        "Emotion Match"
    ],
    "Anxiety": [
        "Breath Sync",
        "Calm Path"
    ],
    "Depression": [
        "Light Builder",
        "Momentum Steps"
    ],
    "General": [
        "Calm Path"
    ]
}


def get_recommended_games(profile: str) -> List[str]:
    return GAME_MAP.get(profile, GAME_MAP["General"])
