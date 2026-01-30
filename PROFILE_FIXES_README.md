# Profile Page Fixes & Weekly Report Setup

## Issues Fixed

### 1. ✅ Profile Page Layout Overlapping
**Problem**: Elements were overlapping and the layout was broken on the Profile page.

**Solution**: 
- Restructured the Profile page with proper grid layout (`xl:grid-cols-12`)
- Changed from `flex flex-col` to `space-y-6` for better spacing
- Separated left sidebar (profile info) from right main content (stats, goals, diary)
- Fixed responsive design for better mobile/desktop experience

### 2. ✅ Weekly Report PDF Generation Error
**Problem**: "Failed to load weekly report" error when clicking the Weekly Report button.

**Root Cause**: The frontend is trying to call backend API endpoints (`/api/reports/`) but the backend server is not running.

**Solution**: 
- Improved error handling with clear messages
- Added helpful instructions when backend is not running
- Created startup scripts for easy backend launching

## How to Fix the Weekly Report Error

The weekly report feature requires the backend server to be running. Here's how to start it:

### Option 1: Using the Startup Scripts (Recommended)

**Windows:**
```bash
# Double-click start_backend.bat
# OR run in command prompt:
start_backend.bat
```

**Mac/Linux:**
```bash
# Make executable and run:
chmod +x start_backend.sh
./start_backend.sh
```

### Option 2: Manual Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the server:**
   ```bash
   python main.py
   ```

4. **Verify it's running:**
   - Backend should be available at: `http://localhost:8000`
   - You should see FastAPI startup messages

### Option 3: Check Backend Status

If you're unsure if the backend is running, check:
- Open `http://localhost:8000/docs` in your browser
- If you see the FastAPI documentation page, the backend is running
- If you get a connection error, the backend is not running

## Environment Setup Required

Make sure you have the following environment variables set in `backend/.env`:

```env
# Database
DB_HOST=your_database_host
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_PORT=5432

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI (for weekly reports)
OPENAI_API_KEY=your_openai_api_key
```

## What the Weekly Report Does

The Weekly Neuro-Insight Report is a "Clinical Synthesis" that:

1. **Triangulates 4 data sources:**
   - Objective Data (game performance)
   - Subjective Data (questionnaire responses)  
   - Emotional Context (chat/diary entries)
   - Baseline Profile (initial assessment)

2. **Generates 3 sections:**
   - Clinical Observation & Insight
   - Key Achievement
   - Focus Area for Next Week

3. **Uses GPT-4 with "Dr. Nexus" persona** for professional therapeutic insights

## Testing the Fixes

1. **Profile Page**: Navigate to `/profile` - layout should be clean with no overlapping
2. **Weekly Report**: Click "Weekly Neuro-Insight Report" button:
   - If backend is running: Should generate or show existing report
   - If backend is not running: Should show helpful error message with instructions

## Files Modified

- `frontend/src/pages/Profile.tsx` - Fixed layout and spacing issues
- `frontend/src/components/WeeklyNeuroInsightReport.tsx` - Improved error handling
- `start_backend.bat` - Windows startup script
- `start_backend.sh` - Mac/Linux startup script
- `PROFILE_FIXES_README.md` - This documentation

## Next Steps

1. Start the backend server using one of the methods above
2. Test the weekly report generation
3. Verify the profile page layout looks good on different screen sizes
4. Enjoy the improved user experience! 🎉