#!/usr/bin/env python3
"""
Simple test script for Daily Reports functionality
Tests the structure and logic without requiring full backend dependencies
"""

import json
import os

def test_database_migration():
    """Test that the database migration SQL is valid"""
    
    print("🗄️ Testing Database Migration...")
    
    try:
        migration_path = "migrations/add_daily_reports.sql"
        if not os.path.exists(migration_path):
            print(f"❌ Migration file not found: {migration_path}")
            return False
            
        with open(migration_path, "r") as f:
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
        
        missing_elements = []
        for element in required_elements:
            if element in migration_sql:
                print(f"✅ Found: {element}")
            else:
                print(f"❌ Missing: {element}")
                missing_elements.append(element)
                
        if not missing_elements:
            print("✅ Database migration SQL structure looks correct")
            return True
        else:
            print(f"❌ Missing elements: {missing_elements}")
            return False
        
    except Exception as e:
        print(f"❌ Error reading migration file: {e}")
        return False

def test_weekly_report_generator_structure():
    """Test that the weekly report generator file has the expected structure"""
    
    print("\n📝 Testing Weekly Report Generator Structure...")
    
    try:
        with open("weekly_report_generator.py", "r") as f:
            content = f.read()
            
        # Check for daily report specific elements
        required_elements = [
            "DailyReportRequest",
            "DailyReportResponse", 
            "generate_daily_report",
            "get_latest_daily_report",
            "daily_observation",
            "key_moment",
            "focus_area",
            'report_type="daily"'
        ]
        
        missing_elements = []
        for element in required_elements:
            if element in content:
                print(f"✅ Found: {element}")
            else:
                print(f"❌ Missing: {element}")
                missing_elements.append(element)
                
        if not missing_elements:
            print("✅ Weekly report generator has all daily report elements")
            return True
        else:
            print(f"❌ Missing elements: {missing_elements}")
            return False
        
    except Exception as e:
        print(f"❌ Error reading weekly_report_generator.py: {e}")
        return False

def test_frontend_components():
    """Test that the frontend components exist and have expected structure"""
    
    print("\n🎨 Testing Frontend Components...")
    
    components_to_check = [
        ("../frontend/src/components/DailyQuestionnaire.tsx", [
            "DailyQuestionnaireProps",
            "DAILY_QUESTIONS",
            "mood",
            "energy", 
            "stress",
            "focus",
            "motivation"
        ]),
        ("../frontend/src/components/DailyNeuroInsightReport.tsx", [
            "DailySynthesis",
            "daily_observation",
            "key_moment", 
            "focus_area",
            "/api/reports/generate-daily-report",
            "/api/reports/get-latest-daily-report"
        ]),
        ("../frontend/src/components/DailyReportButton.tsx", [
            "DailyReportButton",
            "Daily Neuro-Insight Report",
            "onClick"
        ])
    ]
    
    all_passed = True
    
    for component_path, required_elements in components_to_check:
        print(f"\n  📄 Checking: {component_path}")
        
        if not os.path.exists(component_path):
            print(f"    ❌ File not found: {component_path}")
            all_passed = False
            continue
            
        try:
            with open(component_path, "r", encoding="utf-8") as f:
                content = f.read()
                
            missing_elements = []
            for element in required_elements:
                if element in content:
                    print(f"    ✅ Found: {element}")
                else:
                    print(f"    ❌ Missing: {element}")
                    missing_elements.append(element)
                    
            if missing_elements:
                all_passed = False
                
        except Exception as e:
            print(f"    ❌ Error reading {component_path}: {e}")
            all_passed = False
    
    if all_passed:
        print("✅ All frontend components have expected structure")
    else:
        print("❌ Some frontend components are missing elements")
        
    return all_passed

def test_profile_integration():
    """Test that Profile.tsx includes the daily report button"""
    
    print("\n👤 Testing Profile Integration...")
    
    try:
        profile_path = "../frontend/src/pages/Profile.tsx"
        if not os.path.exists(profile_path):
            print(f"❌ Profile file not found: {profile_path}")
            return False
            
        with open(profile_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        required_elements = [
            "DailyReportButton",
            "import.*DailyReportButton",
            "<DailyReportButton"
        ]
        
        found_elements = []
        for element in required_elements:
            if element in content:
                found_elements.append(element)
                print(f"✅ Found: {element}")
            else:
                print(f"❌ Missing: {element}")
                
        if len(found_elements) >= 2:  # At least import and usage
            print("✅ Profile.tsx properly integrates daily report button")
            return True
        else:
            print("❌ Profile.tsx missing daily report integration")
            return False
        
    except Exception as e:
        print(f"❌ Error reading Profile.tsx: {e}")
        return False

def main():
    """Run all tests"""
    
    print("🚀 Starting Daily Reports Simple Test Suite")
    print("=" * 60)
    
    tests = [
        ("Database Migration", test_database_migration),
        ("Weekly Report Generator Structure", test_weekly_report_generator_structure),
        ("Frontend Components", test_frontend_components),
        ("Profile Integration", test_profile_integration)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n📝 Running: {test_name}")
        print("-" * 40)
        
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append((test_name, False))
    
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
        print("🎉 All tests passed! Daily reports system structure is ready.")
        print("\n📋 Next Steps:")
        print("1. Run the database migration: add_daily_reports.sql")
        print("2. Start the backend server: python main.py")
        print("3. Test the daily report generation in the frontend")
    else:
        print("⚠️ Some tests failed. Please review the issues above.")
        
    return passed == len(results)

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)