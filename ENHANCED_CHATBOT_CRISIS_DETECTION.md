# Enhanced Chatbot with Crisis Detection System

This document outlines the implementation of an enhanced AI companion with advanced crisis detection capabilities, specifically designed to protect users with depression and other mental health conditions.

## 🎯 Overview

The enhanced system provides:
- **More Effective Therapy**: Deeper empathy, personalized responses, diary integration
- **Crisis Detection**: Real-time monitoring for suicide ideation and self-harm
- **Emergency Response**: Automatic emergency contact notification after 3 crisis mentions in 10 minutes
- **Safety-First Design**: Prioritizes user wellbeing above all else

## 🚨 Crisis Detection System

### Core Features

#### 1. **Keyword & Pattern Detection**
- **Direct Expressions**: "kill myself", "want to die", "suicide", "end my life"
- **Indirect Expressions**: "no point in living", "everyone better without me", "tired of living"
- **Method References**: "pills", "rope", "bridge", "overdose", "hanging"
- **Hopelessness Indicators**: "no hope", "trapped", "worthless", "burden"

#### 2. **Escalation Monitoring**
- Tracks crisis mentions across conversation history
- **Trigger Threshold**: 3 crisis mentions within 10 minutes
- **Automatic Alert**: Calls emergency contact when threshold reached
- **Real-time Analysis**: Every message analyzed for crisis indicators

#### 3. **Severity Scoring (1-5 Scale)**
- **Level 1-2**: Mild distress, supportive response
- **Level 3**: Moderate concern, crisis resources provided
- **Level 4-5**: High risk, immediate intervention response

### Technical Implementation

#### Database Schema
```sql
-- Crisis event tracking
CREATE TABLE crisis_events (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    severity INTEGER,
    keywords_found TEXT[],
    created_at TIMESTAMP
);

-- Emergency alert logging
CREATE TABLE emergency_alerts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    emergency_phone VARCHAR(20),
    alert_type VARCHAR(50),
    status VARCHAR(20),
    created_at TIMESTAMP
);
```

#### Crisis Detection Algorithm
```python
def analyze_message(message, user_id):
    # 1. Keyword matching
    # 2. Pattern recognition (regex)
    # 3. Severity calculation
    # 4. Escalation check (10-minute window)
    # 5. Emergency alert trigger
```

## 🤖 Enhanced AI Companion

### Improved Effectiveness

#### 1. **Deeper Empathy**
- Validates feelings before offering solutions
- Uses "I" statements to show personal investment
- References diary entries for personalized context
- Acknowledges user's unique journey and struggles

#### 2. **Profile-Specific Responses**

**Depression-Specific Enhancements**:
- Celebrates micro-victories (getting out of bed, eating)
- Uses realistic hope without toxic positivity
- Acknowledges that "some days are harder than others"
- Reminds users that "depression lies to them"
- Encourages tiny, achievable steps
- References past successes when user feels worthless

**Anxiety-Specific Enhancements**:
- Speaks in calm, measured tones
- Teaches specific grounding techniques (5-4-3-2-1 method)
- Helps distinguish realistic concerns from anxiety-driven fears
- Provides concrete coping strategies

**ADHD-Specific Enhancements**:
- Matches their energy and attention patterns
- Acknowledges rejection sensitivity
- Suggests dopamine stacking and micro-steps
- Celebrates hyperfocus moments and creativity

#### 3. **Contextual Awareness**
- Integrates diary entries for personal context
- Remembers conversation history
- Adapts responses based on recent game activity
- Provides specific game recommendations for current emotional state

### Enhanced System Prompt
```
You are 'NeuroNest', a highly empathetic AI companion for a neurodivergent user.

ENHANCED EFFECTIVENESS RULES:
- Be deeply empathetic and validate feelings first
- Ask follow-up questions to understand emotional state
- Reference diary entries naturally
- Provide specific, actionable suggestions
- Acknowledge progress and celebrate small wins
- Be warm but professional - like a caring therapist friend

CRISIS AWARENESS:
- Always prioritize user safety and wellbeing
- Validate pain but offer hope
- Encourage professional help when appropriate
- Be alert to signs of deteriorating mental health
```

## 🚨 Emergency Response Protocol

### Trigger Conditions
1. **Immediate Trigger**: Severity 5 crisis message (direct suicide threat)
2. **Escalation Trigger**: 3+ crisis mentions within 10 minutes
3. **Pattern Trigger**: Multiple high-severity messages over time

### Response Sequence
1. **Crisis Detection**: Message analyzed in real-time
2. **Immediate Response**: Crisis-appropriate AI response provided
3. **Alert Generation**: Emergency contact retrieved from profile
4. **Contact Notification**: Emergency contact called/texted
5. **Logging**: All events logged for safety analysis
6. **Follow-up**: Continued monitoring and support

### Emergency Contact Integration
```python
def trigger_emergency_alert(user_id):
    # 1. Retrieve emergency contact from profile
    # 2. Generate crisis alert message
    # 3. Send notification (call/SMS)
    # 4. Log alert for tracking
    # 5. Continue crisis support
```

## 📱 User Experience Enhancements

### Crisis Response Examples

**Severity 1-2 (Mild Distress)**:
> "It sounds like you're having a tough time. I want you to know that your feelings are valid, and it's okay to not be okay sometimes. What's been weighing on your mind?"

**Severity 3 (Moderate Concern)**:
> "I hear that you're going through a really difficult time. These feelings can be overwhelming, but they can change with support. Please consider reaching out to the 988 Suicide Prevention Lifeline."

**Severity 4-5 (High Risk)**:
> "I'm very concerned about what you're sharing. Your life has value and meaning. Please reach out for immediate help: 988 Suicide Prevention Lifeline, Crisis Text Line (741741), or Emergency Services (911)."

### Personalized Responses
- **Depression**: "I see from your diary that you've been struggling with sleep. That can make everything feel harder. You mentioned last week that morning walks helped - could we start with just stepping outside today?"

- **Anxiety**: "I notice you're worried about tomorrow's meeting. Let's use the 5-4-3-2-1 grounding technique we practiced. Can you name 5 things you can see right now?"

## 🛡️ Safety Features

### Privacy Protection
- Crisis events stored with encryption
- Automatic data cleanup after 30 days
- Emergency contacts only used for genuine crises
- User transparency - they can view their crisis event log

### False Positive Prevention
- Multiple detection methods reduce false alerts
- Severity thresholds prevent over-reaction
- Human-reviewable alert logs
- User feedback integration for system improvement

### Professional Integration
- Encourages professional mental health support
- Provides crisis hotline numbers (988, 741741)
- Never replaces professional intervention
- Designed to bridge gaps in care

## 🚀 Implementation Steps

### 1. Database Setup
```bash
# Run SQL migration
# Execute: backend/migrations/add_crisis_detection.sql
```

### 2. Install Dependencies
```bash
# Crisis detection uses existing dependencies
pip install -r requirements.txt
```

### 3. Test Crisis System
```bash
cd backend
python test_crisis_detection.py
```

### 4. Configure Emergency Services
```python
# In production, integrate with:
# - Twilio for SMS/calls
# - Crisis hotline APIs
# - Emergency services integration
```

### 5. Deploy Enhanced Companion
```bash
# Restart backend with enhanced companion
python -m uvicorn main:app --reload
```

## 📊 Monitoring & Analytics

### Crisis Event Tracking
- Real-time crisis detection logs
- Emergency alert success rates
- False positive analysis
- User safety outcome tracking

### System Performance
- Response time monitoring
- Crisis detection accuracy
- Emergency contact success rates
- User engagement with crisis resources

### Safety Metrics
- Crisis intervention effectiveness
- Professional referral rates
- User safety improvements
- Emergency response times

## ⚖️ Legal & Ethical Considerations

### Duty of Care
- System designed to supplement, not replace professional care
- Clear disclaimers about AI limitations
- Encouragement of professional mental health support
- Documentation of crisis intervention attempts

### Privacy & Consent
- Users informed about crisis monitoring
- Emergency contact consent required
- Data retention policies clearly stated
- Right to disable crisis monitoring (with warnings)

### Professional Standards
- Follows mental health crisis intervention best practices
- Integrates with existing crisis support systems
- Respects user autonomy while prioritizing safety
- Regular review by mental health professionals

## 🔧 Technical Architecture

### Crisis Detection Pipeline
```
User Message → Keyword Analysis → Pattern Matching → 
Severity Scoring → Escalation Check → Emergency Alert → 
Crisis Response → Logging & Monitoring
```

### Integration Points
- **Companion Agent**: Enhanced empathy and personalization
- **Diary System**: Personal context for better responses
- **Profile System**: Emergency contact storage and retrieval
- **Chat System**: Real-time message analysis
- **Database**: Crisis event and alert logging

### Scalability Considerations
- Efficient keyword matching algorithms
- Database indexing for fast crisis event queries
- Asynchronous emergency alert processing
- Load balancing for high-volume crisis detection

## 🎯 Success Metrics

### User Safety
- Reduction in crisis escalation
- Increased help-seeking behavior
- Improved mental health outcomes
- Emergency intervention success rates

### System Effectiveness
- Crisis detection accuracy (>95% target)
- False positive rate (<5% target)
- Emergency contact success rate (>90% target)
- User satisfaction with crisis support

### Clinical Impact
- Professional referral rates
- Crisis hotline usage increases
- Long-term user safety improvements
- Integration with healthcare providers

## 🔮 Future Enhancements

### Advanced Detection
- Machine learning for pattern recognition
- Sentiment analysis integration
- Voice tone analysis for crisis detection
- Behavioral pattern analysis

### Enhanced Response
- Integration with local emergency services
- Automated crisis counselor connections
- Family/friend notification systems
- Professional therapist alerts

### Personalization
- Individual crisis pattern learning
- Customized intervention strategies
- Personal safety plan integration
- Trauma-informed response adaptation

This enhanced system transforms NeuroNest from a supportive companion into a comprehensive mental health safety net, providing both therapeutic support and life-saving crisis intervention when needed most.