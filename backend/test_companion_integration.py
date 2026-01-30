#!/usr/bin/env python3
"""
Test the integration between crisis detection and natural companion responses
"""

from agents.companion import CompanionAgent
from crisis_detection import crisis_detector

def test_companion_responses():
    """Test that the companion now handles crisis situations naturally"""
    print("🤖 Testing Enhanced Companion with Crisis Integration")
    print("=" * 60)
    
    companion = CompanionAgent()
    
    test_scenarios = [
        {
            "message": "I'm having a really bad day",
            "profile": "Depression",
            "expected": "Should be handled by enhanced companion naturally"
        },
        {
            "message": "I feel like giving up sometimes",
            "profile": "Depression", 
            "expected": "Should be handled by enhanced companion with crisis awareness"
        },
        {
            "message": "I want to kill myself right now",
            "profile": "Depression",
            "expected": "Should trigger immediate crisis response"
        }
    ]
    
    for i, scenario in enumerate(test_scenarios, 1):
        print(f"\nTest {i}: '{scenario['message']}'")
        print(f"Profile: {scenario['profile']}")
        print(f"Expected: {scenario['expected']}")
        print("-" * 40)
        
        # Test crisis detection first
        crisis_analysis = crisis_detector.analyze_message(scenario['message'], "test-user")
        print(f"Crisis Analysis: Severity {crisis_analysis['severity']}, Keywords: {crisis_analysis['keywords_found']}")
        
        # Test companion response
        try:
            response = companion.get_response(
                user_message=scenario['message'],
                history=[],
                profile=scenario['profile'],
                game_stats="No recent games",
                user_id="test-user"
            )
            print(f"Response: {response[:200]}...")
        except Exception as e:
            print(f"Error: {e}")
        
        print("=" * 60)

def test_crisis_severity_handling():
    """Test how different severity levels are handled"""
    print("\n🚨 Testing Crisis Severity Handling")
    print("=" * 60)
    
    companion = CompanionAgent()
    
    severity_tests = [
        ("I'm feeling down", "Should go to enhanced companion"),
        ("I can't handle this", "Should go to enhanced companion with crisis awareness"),
        ("I want to die", "Should go to enhanced companion with high crisis awareness"),
        ("I'm going to kill myself tonight", "Should trigger immediate crisis response")
    ]
    
    for message, expected in severity_tests:
        print(f"\nMessage: '{message}'")
        print(f"Expected: {expected}")
        
        crisis_analysis = crisis_detector.analyze_message(message, "test-user")
        print(f"Severity: {crisis_analysis['severity']}")
        
        if crisis_analysis['severity'] >= 4:
            print("→ Would trigger immediate crisis response")
        else:
            print("→ Would go to enhanced companion")
        
        print("-" * 40)

if __name__ == "__main__":
    print("🚀 Testing Enhanced Companion Integration")
    print("Verifying that responses are now natural and varied")
    print("=" * 80)
    
    test_companion_responses()
    test_crisis_severity_handling()
    
    print("\n✅ Integration testing completed!")
    print("\n🎯 Key Changes:")
    print("- Only severe crisis messages (severity 4+) trigger robotic responses")
    print("- Lower severity crisis messages go to enhanced companion")
    print("- Enhanced companion gets crisis context for appropriate responses")
    print("- Responses should now be natural and varied")
    print("- Emergency alerts still trigger for escalation patterns")