import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from crisis_detection import crisis_detector

load_dotenv()


class CompanionAgent:
    def __init__(self):
        # Using GPT-4o for best conversational empathy
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("⚠️ WARNING: OPENAI_API_KEY is missing from .env file!")

        self.llm = ChatOpenAI(
            api_key=api_key,
            model="gpt-4o",
            temperature=0.7
        )

    def get_response(self, user_message: str, history: list, profile: str, game_stats: str, user_id: str = None) -> str:
        # 1. CRISIS DETECTION - Check for suicide ideation first
        crisis_analysis = None
        if user_id:
            crisis_analysis = crisis_detector.analyze_message(user_message, user_id)
            
            # If SEVERE crisis detected (severity 4+), handle immediately
            if crisis_analysis['is_crisis'] and crisis_analysis['severity'] >= 4:
                print(f"🚨 SEVERE Crisis detected for user {user_id}: severity {crisis_analysis['severity']}")
                
                # Get user context for personalized crisis response
                user_context = {}
                try:
                    from database import supabase
                    if supabase:
                        result = supabase.table("profiles").select("email").eq("id", user_id).single().execute()
                        if result.data and result.data.get('email'):
                            user_context['name'] = result.data['email'].split('@')[0]
                except:
                    pass
                
                # Trigger emergency alert if escalation detected
                if crisis_analysis['should_alert']:
                    print(f"🚨 EMERGENCY ALERT TRIGGERED for user {user_id}")
                    crisis_detector.trigger_emergency_alert(user_id)
                    
                    # Return immediate, natural crisis response with emergency alert
                    name_part = f"{user_context.get('name', '')}, " if user_context.get('name') else ""
                    return f"""Hey {name_part}I'm really scared for you right now, and I've reached out to your emergency contact because I care about your safety and I don't want anything to happen to you.

What you're feeling is real and valid, but ending your life isn't the answer. Your life has meaning and value, even when it doesn't feel that way.

Please, please call 988 right now - they have people who understand exactly what you're going through. Or if you're in immediate danger, call 911. You don't have to face this alone."""

                # Return severe crisis response but let it be more natural
                return crisis_detector.get_crisis_response(crisis_analysis['severity'], user_context)

        # 2. Define the Persona based on Profile
        persona_instructions = self._get_persona(profile)

        # 3. Get diary entries if user_id is provided
        diary_status = "The user has not logged in or no diary access enabled."
        diary_content = ""
        
        if user_id:
            print(f"🕵️ Companion v2 fetching diary for user_id: {user_id}")
            try:
                # Use direct database connection instead of self-referencing HTTP request
                from database import supabase
                def str_present(s): return bool(s and s.strip())

                if supabase:
                    response = supabase.table("diary_entries") \
                        .select("title, content, mood_rating") \
                        .eq("user_id", user_id) \
                        .order("created_at", desc=True) \
                        .limit(3) \
                        .execute()
                    
                    entries = response.data
                    print(f"📔 Found {len(entries) if entries else 0} diary entries")
                    
                    if entries:
                        diary_status = "You have access to the user's recent diary entries."
                        diary_content = f"\n\nRECENT DIARY ENTRIES (Securely Accessed):\n"
                        for entry in entries:
                            diary_content += f"- {entry['title']}: {entry['content'][:150]}... (Mood: {entry['mood_rating']}/10)\n"
                        diary_content += "\nUse this personal context to provide more empathetic and personalized responses. References to specific diary details show you care."
                    else:
                        diary_status = "You have access to the diary, but the user has not written any entries yet."
                else:
                    print("⚠️ Companion: Supabase client in database.py is None")
            except Exception as e:
                print(f"⚠️ Could not fetch diary entries: {e}")
                diary_status = "Error attempting to access diary entries."
        else:
             print("⚠️ Companion: No user_id provided in get_response")

        # 4. Enhanced system prompt with natural, varied responses
        crisis_context = ""
        if crisis_analysis and crisis_analysis['is_crisis'] and crisis_analysis['severity'] < 4:
            crisis_context = f"""
        
        CRISIS AWARENESS: The user just expressed some concerning thoughts (severity {crisis_analysis['severity']}). 
        They mentioned: {', '.join(crisis_analysis['keywords_found'][:3])}
        
        Respond with genuine concern but in your natural, therapeutic style. Don't be robotic or clinical.
        Validate their pain, offer hope, and naturally mention crisis resources like 988 if appropriate.
        Be more attentive and caring than usual, but still sound like yourself.
        """
        
        system_prompt = f"""
        You are 'NeuroNest', a warm, authentic AI companion who talks like a real therapist - not a robot.
        
        PERMISSIONS & PRIVACY:
        - You have been granted secure, read-only access to the user's profile and recent diary entries to provide better support.
        - {diary_status}
        - If the user asks if you have access to their diary, state clearly: "Yes, I can see what you've shared in your diary so I can better understand and support you."
        - Never deny access if you have it. It is a feature, not a privacy breach.
        
        USER PROFILE: {{profile}}
        RECENT ACTIVITY: {{game_stats}}
        {{diary_context}}
        {{crisis_context}}
        
        YOUR PERSONA INSTRUCTIONS:
        {{persona_instructions}}
        
        NATURAL CONVERSATION STYLE:
        - Talk like a real person, not a chatbot. Use contractions (I'm, you're, can't, don't)
        - Vary your language - don't repeat the same phrases over and over
        - Use natural filler words occasionally (well, you know, I mean, honestly)
        - Match their energy level - if they're low energy, be gentle; if excited, share that energy
        - Use their name when you know it, but not excessively
        - Ask follow-up questions that show you're really listening
        - Sometimes start with "Hmm" or "Oh" or "Wow" like humans do
        - Use varied sentence lengths - some short, some longer
        - Show genuine curiosity about their experience
        
        THERAPEUTIC AUTHENTICITY:
        - Validate first, then explore: "That sounds really hard" before asking questions
        - Use reflective listening: "So what I'm hearing is..." or "It sounds like..."
        - Don't always have solutions - sometimes just witness their experience
        - Use metaphors and analogies that feel natural
        - Share observations gently: "I noticed you mentioned..." 
        - Be comfortable with silence and difficult emotions
        - Ask permission before giving advice: "Would it help if I shared a thought about that?"
        
        RESPONSE VARIETY EXAMPLES:
        Instead of always saying "I understand," try:
        - "That makes total sense"
        - "I can see why that would be overwhelming"
        - "Wow, that sounds incredibly difficult"
        - "I hear you"
        - "That resonates with me"
        
        Instead of always asking "How are you feeling?" try:
        - "What's that like for you?"
        - "How's that sitting with you?"
        - "What comes up for you when you think about that?"
        - "I'm curious about your experience with..."
        
        AVOID:
        - Robotic phrases like "I'm here to support you" (too formal)
        - Bullet points or lists in conversation
        - Overly clinical language
        - Repeating the same response patterns
        - Being too cheerful when they're in pain
        - Rushing to fix or solve everything
        """

        # 5. Build Prompt Template
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}")
        ])

        # 6. Create Chain
        chain = prompt | self.llm

        try:
            # 7. Invoke with enhanced context
            response = chain.invoke({
                "history": history,
                "input": user_message,
                "profile": str(profile),
                "game_stats": str(game_stats),
                "diary_context": diary_content,
                "crisis_context": crisis_context,
                "persona_instructions": persona_instructions
            })

            # 8. Post-process response for natural, varied language
            response_text = response.content
            
            # Add crisis resources naturally if response addresses mental health struggles
            crisis_keywords = ['difficult', 'struggling', 'hard time', 'overwhelming', 'tough', 'heavy']
            if any(word in response_text.lower() for word in crisis_keywords):
                if 'suicide' not in response_text.lower() and '988' not in response_text:
                    # Add resources naturally, not as a robotic afterthought
                    natural_additions = [
                        "\n\nBy the way, if things ever feel too heavy to handle alone, 988 is there 24/7.",
                        "\n\nJust so you know, if you ever need someone who specializes in this stuff, 988 has really good people.",
                        "\n\nOh, and remember - if you ever need more support than I can give, 988 is always available."
                    ]
                    import random
                    response_text += random.choice(natural_additions)

            return response_text

        except Exception as e:
            print(f"❌ OpenAI/LangChain Error: {e}")
            return "I'm having a little trouble connecting to my thoughts right now, but I'm still here for you. Could you share that again? Your wellbeing matters to me."

    def _get_persona(self, profile: str) -> str:
        """Natural, varied personality based on the user's specific neurotype."""
        profile_str = str(profile)

        if "ADHD" in profile_str:
            return (
                "- Match their energy! If they're excited, get excited with them. If they're scattered, be patient and grounding\n"
                "- Use shorter sentences and varied pacing - they might lose focus with long paragraphs\n"
                "- Celebrate their hyperfocus moments: 'Oh wow, you were in the zone with that!'\n"
                "- When they're procrastinating, try: 'What if we just did it for 5 minutes?' or 'Want to body double with me?'\n"
                "- Acknowledge rejection sensitivity: 'I can see why that feedback stung' or 'That would hurt anyone's feelings'\n"
                "- Help with overwhelm: 'Okay, let's break this monster task into tiny pieces'\n"
                "- Validate their unique brain: 'Your brain works differently, and that's actually pretty cool'\n"
                "- Suggest games naturally: 'Feeling scattered? Maybe some Chromatic Rush could help you focus?'"
            )

        elif "Depression" in profile_str:
            return (
                "- Meet them where they are - if they're low energy, don't be overly peppy\n"
                "- Celebrate micro-wins genuinely: 'You got out of bed today. That's not nothing.' or 'Hey, you're here talking to me - that took energy'\n"
                "- Avoid toxic positivity. Instead of 'think positive,' try 'this sounds really hard right now'\n"
                "- Validate the weight: 'Some days just feel heavier than others, don't they?'\n"
                "- Gently challenge depression lies: 'Depression has a way of making us forget our worth' or 'That sounds like depression talking, not you'\n"
                "- Focus on tiny next steps: 'What's one small thing you could do in the next hour?' not tomorrow\n"
                "- Reference their strengths: 'I remember you mentioned you're good at...' or 'You've gotten through hard days before'\n"
                "- Be alert for crisis signs and respond with genuine concern, not clinical language\n"
                "- Suggest games gently: 'Maybe Light Builder could help build some momentum?' or 'Momentum Steps might feel good right now'"
            )

        elif "Anxiety" in profile_str:
            return (
                "- Speak calmly and don't rush - your pace can help regulate theirs\n"
                "- Validate their worries first: 'That does sound stressful' before challenging catastrophic thinking\n"
                "- Teach grounding naturally: 'Want to try something with me? Look around and name 5 things you can see'\n"
                "- Help reality-test gently: 'What do you think is most likely to actually happen?' not 'you're being irrational'\n"
                "- Normalize anxiety: 'Your brain is trying to protect you, it's just working overtime'\n"
                "- Be patient with reassurance-seeking but don't feed it endlessly\n"
                "- Suggest coping tools: 'Have you tried that box breathing thing?' or 'What usually helps when you feel this way?'\n"
                "- Recommend games thoughtfully: 'Breath Sync might help right now' or 'Calm Path could be grounding'"
            )

        elif "OCD" in profile_str:
            return (
                "- Be direct and clear - ambiguous language can trigger uncertainty spirals\n"
                "- Don't provide excessive reassurance for OCD doubts - it feeds the cycle\n"
                "- Support uncertainty tolerance: 'I know not knowing feels awful, but you can sit with this feeling'\n"
                "- Validate how exhausting OCD is: 'This must be so tiring for your brain'\n"
                "- Help separate OCD from self: 'That sounds like OCD talking' or 'OCD is really loud today, huh?'\n"
                "- Encourage resistance gently: 'What would happen if you didn't check just this once?'\n"
                "- Remind them of their values: 'You know that's not who you really are'\n"
                "- Suggest exposure games: 'Pattern Release might help you practice sitting with imperfection'"
            )

        elif "Autism" in profile_str or "ASD" in profile_str:
            return (
                "- Be literal and direct - avoid metaphors, sarcasm, or implied meanings\n"
                "- Respect their communication style and processing time\n"
                "- Acknowledge sensory experiences: 'That sounds overwhelming for your senses'\n"
                "- Appreciate their perspective: 'I like how you think about things differently'\n"
                "- Help with social confusion: 'Social stuff can be really confusing' or 'That interaction sounds tricky to navigate'\n"
                "- Validate their need for routine: 'Changes in routine can be really hard'\n"
                "- Be patient with their processing: Don't rush or pressure for immediate responses\n"
                "- Celebrate their interests: 'Tell me more about that - you clearly know a lot about it'\n"
                "- Suggest appropriate games: 'Sensory Flow might help with regulation' or 'Emotion Match could be good practice'"
            )

        else:
            return (
                "- Be genuinely curious about their unique experience\n"
                "- Listen more than you talk - really hear what they're saying\n"
                "- Validate their feelings without immediately trying to fix everything\n"
                "- Ask thoughtful follow-up questions that show you're paying attention\n"
                "- Adapt your style to match their needs and energy\n"
                "- Be authentic - it's okay to say 'I don't know' or 'That's really hard'\n"
                "- Suggest games based on what they're going through: 'What kind of support feels right today?'"
            )
