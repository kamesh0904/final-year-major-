#!/usr/bin/env python3
"""
Test OpenAI API connection and functionality
"""

import os
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_openai_key_exists():
    """Test if OpenAI API key is configured"""
    print("🔑 Testing OpenAI API Key Configuration...")
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY not found in environment variables")
        return False
    
    if api_key.startswith("sk-"):
        print("✅ OpenAI API key format looks correct")
        print(f"   Key starts with: {api_key[:10]}...")
        return True
    else:
        print("❌ OpenAI API key format looks incorrect (should start with 'sk-')")
        return False

def test_openai_import():
    """Test if OpenAI libraries can be imported"""
    print("\n📦 Testing OpenAI Library Import...")
    
    try:
        from langchain_openai import ChatOpenAI
        print("✅ langchain_openai imported successfully")
        
        from langchain_core.prompts import ChatPromptTemplate
        print("✅ langchain_core imported successfully")
        
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

async def test_openai_api_call():
    """Test actual OpenAI API call"""
    print("\n🌐 Testing OpenAI API Call...")
    
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.prompts import ChatPromptTemplate
        
        # Initialize the LLM
        llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.7,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # Create a simple test prompt
        prompt = ChatPromptTemplate.from_template("Say 'Hello, NeuroNest!' in a friendly way.")
        chain = prompt | llm
        
        # Make the API call
        response = chain.invoke({})
        
        if response and response.content:
            print("✅ OpenAI API call successful!")
            print(f"   Response: {response.content[:100]}...")
            return True
        else:
            print("❌ OpenAI API call returned empty response")
            return False
            
    except Exception as e:
        print(f"❌ OpenAI API call failed: {e}")
        
        # Check for specific error types
        error_str = str(e).lower()
        if "authentication" in error_str or "api key" in error_str:
            print("   🔍 This looks like an API key authentication issue")
        elif "quota" in error_str or "billing" in error_str:
            print("   🔍 This looks like a billing/quota issue")
        elif "rate limit" in error_str:
            print("   🔍 This looks like a rate limiting issue")
        elif "network" in error_str or "connection" in error_str:
            print("   🔍 This looks like a network connectivity issue")
        
        return False

async def test_companion_agent():
    """Test the companion agent specifically"""
    print("\n🤖 Testing Companion Agent...")
    
    try:
        from agents.companion import CompanionAgent
        
        # Initialize companion
        companion = CompanionAgent()
        print("✅ CompanionAgent initialized successfully")
        
        # Test a simple response
        test_message = "Hello, I'm feeling a bit anxious today."
        test_history = []
        test_profile = "Anxiety"
        test_stats = "No recent games"
        
        response = companion.get_response(
            user_message=test_message,
            history=test_history,
            profile=test_profile,
            game_stats=test_stats
        )
        
        if response and len(response) > 10:
            print("✅ Companion agent response generated successfully!")
            print(f"   Response length: {len(response)} characters")
            print(f"   Response preview: {response[:150]}...")
            return True
        else:
            print("❌ Companion agent returned empty or very short response")
            return False
            
    except Exception as e:
        print(f"❌ Companion agent test failed: {e}")
        return False

async def test_report_generator():
    """Test the report generator"""
    print("\n📊 Testing Report Generator...")
    
    try:
        from weekly_report_generator import ClinicalSynthesisGenerator
        
        # Initialize generator
        generator = ClinicalSynthesisGenerator()
        print("✅ ClinicalSynthesisGenerator initialized successfully")
        
        # Test synthesis generation with mock data
        mock_raw_data = {
            "objective_data": {"game_sessions": [], "total_sessions": 0, "total_playtime": 0, "games_played": []},
            "subjective_data": {"questionnaire_responses": [], "total_questionnaires": 0, "categories_assessed": []},
            "emotional_context": {"chat_history": [], "diary_entries": [], "total_interactions": 0},
            "baseline_profile": {"scores": {}, "primary_profile": "ADHD", "secondary_profile": None, "profile_created": "2024-01-01"},
            "insights": {"performance_trends": {}, "emotional_patterns": {}, "engagement_metrics": {}, "therapeutic_progress": {}}
        }
        
        mock_checkin = {"mood": "Good", "energy": "Moderate", "stress": "Low"}
        
        # Test weekly synthesis
        weekly_synthesis = await generator._generate_synthesis(mock_raw_data, mock_checkin, "weekly")
        
        if weekly_synthesis and len(weekly_synthesis) >= 3:
            print("✅ Weekly report synthesis generated successfully!")
            print(f"   Keys: {list(weekly_synthesis.keys())}")
            return True
        else:
            print("❌ Weekly report synthesis failed or incomplete")
            return False
            
    except Exception as e:
        print(f"❌ Report generator test failed: {e}")
        return False

async def main():
    """Run all OpenAI tests"""
    
    print("🚀 Starting OpenAI Connection Test Suite")
    print("=" * 60)
    
    tests = [
        ("API Key Configuration", test_openai_key_exists()),
        ("Library Import", test_openai_import()),
        ("API Call", test_openai_api_call()),
        ("Companion Agent", test_companion_agent()),
        ("Report Generator", test_report_generator())
    ]
    
    results = []
    for test_name, test_coro in tests:
        print(f"\n📝 Running: {test_name}")
        print("-" * 40)
        
        if asyncio.iscoroutine(test_coro):
            result = await test_coro
        else:
            result = test_coro
            
        results.append((test_name, result))
    
    print("\n" + "=" * 60)
    print("📊 Test Results Summary:")
    print("=" * 60)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All OpenAI tests passed! The integration should be working.")
    else:
        print("⚠️ Some OpenAI tests failed. This explains why companion and reports aren't working.")
        
        # Provide troubleshooting suggestions
        print("\n🔧 Troubleshooting Suggestions:")
        if passed == 0:
            print("1. Check if your OpenAI API key is valid and has credits")
            print("2. Verify your internet connection")
            print("3. Check if OpenAI services are currently down")
        elif passed < 3:
            print("1. Your API key might be invalid or expired")
            print("2. Check your OpenAI account billing status")
            print("3. Try regenerating your API key")
        else:
            print("1. The basic connection works, but there might be issues with specific components")
            print("2. Check the error messages above for specific guidance")

if __name__ == "__main__":
    asyncio.run(main())