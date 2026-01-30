from typing import Dict
from schemas.questionnaire import QUESTIONNAIRE, CATEGORIES


def score_questionnaire(answers: Dict[int, int]) -> Dict[str, int]:
    """
    Scores answers (1–5 scale) into category totals.
    """

    scores = {category: 0 for category in CATEGORIES}
    question_map = {q.id: q for q in QUESTIONNAIRE}

    for q_id, value in answers.items():
        question = question_map.get(q_id)
        if not question:
            continue

        scores[question.category] += value

    return scores
