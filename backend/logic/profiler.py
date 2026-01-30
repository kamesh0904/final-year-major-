from typing import Dict, Optional


def profile_user(scores: Dict[str, int]) -> Dict[str, Optional[str]]:
    """
    Determines primary & secondary neurodivergent profile.
    """

    if not scores:
        return {"primary": "General", "secondary": None}

    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    primary, primary_score = sorted_scores[0]

    if primary_score == 0:
        return {"primary": "General", "secondary": None}

    secondary = None
    if len(sorted_scores) > 1:
        sec_type, sec_score = sorted_scores[1]
        if sec_score >= 0.7 * primary_score:
            secondary = sec_type

    return {
        "primary": primary,
        "secondary": secondary,
    }
