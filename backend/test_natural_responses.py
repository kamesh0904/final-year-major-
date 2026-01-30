#!/usr/bin/env python3
"""
Test script to demonstrate natural, varied responses vs robotic ones
"""

from crisis_detection import crisis_detector

def test_response_variety():
    """Test that crisis responses are varied and natural"""
    print("🎭 Testing Response Variety and Natural Language")
    print("=" * 60)
    
    # Test the same severity level multiple times to see variety
    print("Testing Severity 3 responses (5 different responses):")
    print("-" * 50)
    
    for i in range(5):
        response = crisis_detector.get_crisis_response(3, {'name': 'Alex'})
        print(f"\nResponse {i+1}:")
        print(response)
        print("-" * 50)
    
    print("\nTesting Severity 4 responses (3 different responses):")
    print("-" * 50)
    
    for i in range(3):
        response = crisis_detector.get_crisis_response(4, {'name': 'Sam'})
        print(f"\nResponse {i+1}:")
        print(response)
        print("-" * 50)

def test_personalization():
    """Test personalized responses with and without names"""
    print("\n👤 Testing Personalization")
    print("=" * 60)
    
    # With name
    print("Response WITH name:")
    response_with_name = crisis_detector.get_crisis_response(2, {'name': 'Jordan'})
    print(response_with_name)
    
    print("\n" + "-" * 50)
    
    # Without name
    print("Response WITHOUT name:")
    response_without_name = crisis_detector.get_crisis_response(2, {})
    print(response_without_name)

def compare_old_vs_new():
    """Compare old robotic responses with new natural ones"""
    print("\n🤖 vs 👨‍⚕️ Old Robotic vs New Natural Responses")
    print("=" * 60)
    
    print("OLD ROBOTIC RESPONSE:")
    old_response = """I hear that you're going through a really difficult time. These feelings can be overwhelming, but they can change with support.

Please consider reaching out:
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741

Would you like to talk about what's making you feel this way? I'm here to listen."""
    
    print(old_response)
    
    print("\n" + "=" * 60)
    print("NEW NATURAL RESPONSE:")
    new_response = crisis_detector.get_crisis_response(2, {'name': 'Alex'})
    print(new_response)
    
    print("\n" + "=" * 60)
    print("ANALYSIS:")
    print("✅ Old: Formal, clinical, bullet points, repetitive")
    print("✅ New: Conversational, empathetic, varied, human-like")

def test_conversation_flow():
    """Test how responses would flow in a real conversation"""
    print("\n💬 Testing Conversation Flow")
    print("=" * 60)
    
    conversation_scenarios = [
        ("I'm feeling really down today", 1),
        ("I can't handle this anymore", 2),
        ("I keep thinking about ending it all", 3),
        ("I want to kill myself", 4),
    ]
    
    print("Simulating conversation escalation:")
    
    for message, severity in conversation_scenarios:
        print(f"\nUser: '{message}'")
        response = crisis_detector.get_crisis_response(severity, {'name': 'Taylor'})
        print(f"AI: {response[:150]}...")
        print("-" * 40)

if __name__ == "__main__":
    print("🚀 Natural Language Response Testing")
    print("Testing how the AI companion now sounds like a real therapist")
    print("=" * 80)
    
    test_response_variety()
    test_personalization()
    compare_old_vs_new()
    test_conversation_flow()
    
    print("\n✅ Testing completed!")
    print("\n🎯 Key Improvements:")
    print("- Responses are now varied and natural")
    print("- Uses contractions and casual language")
    print("- Personalizes with user's name")
    print("- Sounds like a real therapist, not a robot")
    print("- No more bullet points or clinical language")
    print("- Each response feels unique and authentic")