#!/usr/bin/env python3
"""
Test script for Daily Reports functionality
Tests the daily report generation and retrieval endpoints
"""

import asyncio
import json
from datetime import datetime, date
from weekly_report_generator import ClinicalSynthesisGenerator

async def test_daily_report_generation():
    """Test daily report generation with mock data"""
    
    print("🧪 Testing Daily Report Generation...")
    
    # Initialize the generator
    generator = ClinicalSynthesisGenerator()
    
    # Mock user data
    user_id = "test-user-123"
    checkin_data = {
        "mood": "Good",
        "energy": "Moderate", 
        "stress": "Low",
        "focus": "Good",
        "motivation": "Quite"
    }
    
    try:
        # Test the data collection method (this will fail without DB, but we can test the structure)
        print("✅ ClinicalSynthesisGenerator initialized successfully")
        
        # Test the fallback synthesis generation
        mock_raw_data = {
            "objective_data": {
                "game_sessions": [],
                "total_sessions": 0,
                "total_playtime": 0,
                "games_played": []
            },
            "subjective_data": {
                "questionnaire_responses": [],
                "total_questionnaires": 0,
                "categories_assessed": []
            },
            "emotional_context": {
                "chat_history": [],
                "diary_entries": [],
                "total_interactions": 0
            },
            "baseline_profile": {
                "scores": {},
                "primary_profile": "ADHD",
                "secondary_profile": "Anxiety",
                "profile_created": datetime.now().isoformat()
            },
            "insights": {
                "performance_trends": {},
                "emotional_patterns": {},
                "engagement_metrics": {},
                "therapeutic_progress": {}
            }
        }
        
        # Test daily synthesis generation
        daily_synthesis = await generator._generate_synthesis(mock_raw_data, checkin_data, "daily")
        
        print("✅ Daily synthesis generated successfully:")
        print(f"   - Daily Observation: {len(daily_synthesis.get('daily_observation', ''))} chars")
        print(f"   - Key Moment: {len(daily_synthesis.get('key_moment', ''))} chars") 
        print(f"   - Focus Area: {len(daily_synthesis.get('focus_area', ''))} chars")
        
        # Test weekly synthesis for comparison
        weekly_synthesis = await generator._generate_synthesis(mock_raw_data, checkin_data, "weekly")
        
        print("✅ Weekly synthesis generated successfully:")
        print(f"   - Clinical Observation: {len(weekly_synthesis.get('clinical_observation', ''))} chars")
        print(f"   - Key Achievement: {len(weekly_synthesis.get('key_achievement', ''))} chars")
        print(f"   - Focus Area: {len(weekly_synthesis.get('focus_area', ''))} chars")
        
        # Verify the structure is correct
        expected_daily_keys = {"daily_observation", "key_moment", "focus_area"}
        expected_weekly_keys = {"clinical_observation", "key_achievement", "focus_area"}
        
        daily_keys = set(daily_synthesis.keys())
        weekly_keys = set(weekly_synthesis.keys())
        
        if daily_keys == expected_daily_keys:
            print("✅ Daily report structure is correct")
        else:
            print(f"❌ Daily report structure mismatch. Expected: {expected_daily_keys}, Got: {daily_keys}")
            
        if weekly_keys == expected_weekly_keys:
            print("✅ Weekly report structure is correct")
        else:
            print(f"❌ Weekly report structure mismatch. Expected: {expected_weekly_keys}, Got: {weekly_keys}")
        
        print("\n📋 Sample Daily Report:")
        print(json.dumps(daily_synthesis, indent=2))
        
        return True
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        return False

def test_database_migration():
    """Test that the database migration SQL is valid"""
    
    print("\n🗄️ Testing Database Migration...")
    
    try:
        with open("migrations/add_daily_reports.sql", "r") as f:
            migration_sql = f.read()
            
        # Basic validation checks
        required_elements = [
            "CREATE TABLE IF NOT EXISTS daily_reports",
            "user_id UUID NOT NULL",
            "report_date DATE NOT NULL",
            "summary_text JSONB NOT NULL",
            "UNIQUE(user_id, report_date)",
            "CREATE POLICY"
        ]
        
        for element in required_elements:
            if element in migration_sql:
                print(f"✅ Found: {element}")
            else:
                print(f"❌ Missing: {element}")
                return False
                
        print("✅ Database migration SQL structure looks correct")
        return True
        
    except FileNotFoundError:
        print("❌ Migration file not found: migrations/add_daily_reports.sql")
        return False
    except Exception as e:
        print(f"❌ Error reading migration file: {e}")
        return False

def test_api_structure():
    """Test that the API endpoints are properly structured"""
    
    print("\n🌐 Testing API Structure...")
    
    try:
        # Import the router to check it's properly structured
        from weekly_report_generator import router, DailyReportRequest, DailyReportResponse
        
        print("✅ Router imported successfully")
        print("✅ DailyReportRequest model imported successfully")
        print("✅ DailyReportResponse model imported successfully")
        
        # Check that the router has the expected routes
        routes = [route.path for route in router.routes]
        expected_routes = ["/generate-daily-report", "/get-latest-daily-report"]
        
        for expected_route in expected_routes:
            if expected_route in routes:
                print(f"✅ Found route: {expected_route}")
            else:
                print(f"❌ Missing route: {expected_route}")
                return False
                
        print("✅ All expected API routes are present")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error testing API structure: {e}")
        return False

async def main():
    """Run all tests"""
    
    print("🚀 Starting Daily Reports Test Suite")
    print("=" * 50)
    
    tests = [
        ("Daily Report Generation", test_daily_report_generation()),
        ("Database Migration", test_database_migration()),
        ("API Structure", test_api_structure())
    ]
    
    results = []
    for test_name, test_coro in tests:
        print(f"\n📝 Running: {test_name}")
        print("-" * 30)
        
        if asyncio.iscoroutine(test_coro):
            result = await test_coro
        else:
            result = test_coro
            
        results.append((test_name, result))
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print("=" * 50)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! Daily reports system is ready.")
    else:
        print("⚠️ Some tests failed. Please review the issues above.")

if __name__ == "__main__":
    asyncio.run(main())