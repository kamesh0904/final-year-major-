from pydantic import BaseModel
from typing import List


class Question(BaseModel):
    id: int
    text: str
    category: str


CATEGORIES = [
    "ADHD",
    "OCD",
    "ASD",
    "Anxiety",
    "Depression",
]


QUESTIONNAIRE: List[Question] = [

    # ADHD (1–5)
    Question(id=1, text="Struggle to stay focused on important tasks?",
             category="ADHD"),
    Question(id=2, text="Start many projects but struggle to finish?",
             category="ADHD"),
    Question(id=3, text="Act or speak impulsively?", category="ADHD"),
    Question(id=4, text="Feel mentally restless?", category="ADHD"),
    Question(id=5, text="Trouble managing time or deadlines?", category="ADHD"),

    # OCD (6–10)
    Question(id=6, text="Urge to check things repeatedly?", category="OCD"),
    Question(id=7, text="Intrusive thoughts hard to ignore?", category="OCD"),
    Question(id=8, text="Repeat actions to reduce anxiety?", category="OCD"),
    Question(id=9, text="Discomfort when things aren't symmetrical?",
             category="OCD"),
    Question(id=10, text="Daily life disrupted by rituals?", category="OCD"),

    # ASD (11–15)
    Question(id=11, text="Social interactions feel exhausting?", category="ASD"),
    Question(id=12, text="Distressed by routine changes?", category="ASD"),
    Question(id=13, text="Notice small patterns others miss?", category="ASD"),
    Question(id=14, text="Overwhelmed by sensory input?", category="ASD"),
    Question(id=15, text="Deep focus on specific interests?", category="ASD"),

    # Anxiety (16–20)
    Question(id=16, text="Worry without clear reason?", category="Anxiety"),
    Question(id=17, text="Difficulty relaxing?", category="Anxiety"),
    Question(id=18, text="Overthink past interactions?", category="Anxiety"),
    Question(id=19, text="Physical anxiety symptoms?", category="Anxiety"),
    Question(id=20, text="Sense something bad might happen?", category="Anxiety"),

    # Depression (21–25)
    Question(id=21, text="Feel drained even after rest?",
             category="Depression"),
    Question(id=22, text="Loss of interest in activities?",
             category="Depression"),
    Question(id=23, text="Emotions feel intense or unstable?",
             category="Depression"),
    Question(id=24, text="Feel disconnected from self?", category="Depression"),
    Question(id=25, text="Struggle to find joy or purpose?",
             category="Depression"),
]
