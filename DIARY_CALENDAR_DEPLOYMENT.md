# Diary Calendar Feature - Deployment Guide

## ⚠️ IMPORTANT: Complete These Steps In Order

### Step 1: Run Database Migration (REQUIRED FIRST)

**Before deploying code**, you must run the SQL migration in Supabase:

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Select your NeuroNest project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the entire contents of:
   ```
   backend/migrations/add_diary_calendar.sql
   ```

6. Click **Run** button
7. Verify success message: "Success. No rows returned"

**What this migration does:**
- Adds `entry_date` column to `diary_entries` table
- Backfills existing entries with their created_at date
- Creates database index for fast calendar queries
- Adds trigger to prevent future-dated entries

---

### Step 2: Deploy Backend

From the project root directory, run:

```bash
# On Windows (Git Bash or WSL)
bash deploy.sh backend

# The script will:
# 1. Deploy updated backend with new API endpoints
# 2. Update environment variables
# 3. Run health check
```

**New API Endpoints Added:**
- `GET /diary-entries-by-date/{user_id}` - Calendar view
- `POST /create-diary-entry` - Create with date
- `DELETE /diary-entry/{entry_id}` - Delete entry

---

### Step 3: Deploy Frontend

From the project root directory, run:

```bash
bash deploy.sh frontend

# The script will:
# 1. Install dependencies
# 2. Build production bundle
# 3. Deploy to Firebase Hosting
```

---

### Step 4: Full Deployment (Both)

Or deploy everything at once:

```bash
bash deploy.sh all
```

---

## Environment Variables Required

Make sure these are set in your environment:

```bash
export SUPABASE_URL='your-supabase-url'
export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'
export OPENAI_API_KEY='your-openai-key'
```

---

## Verification Checklist

After deployment, test these flows:

### ✅ Password Protection
1. Go to dashboard
2. Click "Personal Diary" card
3. Enter diary password
4. Should redirect to `/diary` calendar page

### ✅ Calendar Display
1. Verify current month displays
2. Check today's date is highlighted (emerald)
3. Confirm future dates are grayed out
4. Test month navigation (arrows)

### ✅ Entry Creation
1. Click on today's date (or past date)
2. Modal should open
3. Enter title, content, mood
4. Click "Save Entry"
5. Calendar should show purple dot on that date

### ✅ View Entries
1. Click on date with entries (purple dot)
2. Entries should display in modal
3. Test delete functionality
4. Test creating multiple entries on same date

### ✅ Mobile Responsiveness
1. Open on mobile device or Chrome DevTools
2. Calendar grid should adapt to screen size
3. Modals should be readable and centered

---

## Troubleshooting

### Migration Errors

**Error: column "entry_date" already exists**
- Migration already ran successfully, proceed to deployment

**Error: cannot insert NULL into "entry_date"**
- Run the backfill query manually:
  ```sql
  UPDATE diary_entries 
  SET entry_date = DATE(created_at) 
  WHERE entry_date IS NULL;
  ```

### Backend Errors

**Error: Cannot find module**
- Clear build cache and redeploy:
  ```bash
  cd backend
  rm -rf __pycache__
  bash ../deploy.sh backend
  ```

### Frontend Errors

**Error: VITE_API_BASE_URL not defined**
- Check `frontend/.env.production.local` exists
- Should contain your backend URL from Step 2

**Calendar not loading entries**
- Check browser console for CORS errors
- Verify backend URL is correct
- Check Supabase RLS policies allow diary access

---

## Rollback Plan

If you need to rollback:

### Database Rollback
```sql
-- Remove trigger
DROP TRIGGER IF EXISTS enforce_diary_entry_date ON diary_entries;
DROP FUNCTION IF EXISTS check_diary_entry_date();

-- Remove column (⚠️ This will delete entry_date data)
ALTER TABLE diary_entries DROP COLUMN IF EXISTS entry_date;
```

### Code Rollback
```bash
# Checkout previous commit
git log --oneline  # Find commit hash before diary feature
git checkout <previous-commit-hash>

# Redeploy
bash deploy.sh all
```

---

## Production URLs

After deployment, your app will be live at:

- **Frontend**: `https://neuronest-v2-prod.web.app`
- **Backend**: Check deployment output for Cloud Run URL
- **Supabase**: Your existing Supabase project URL

---

## Support

If you encounter any issues during deployment:

1. Check deployment logs in GCP Console
2. Check Supabase logs for database errors
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

---

## Summary

✅ **Step 1**: Run SQL migration in Supabase  
✅ **Step 2**: Deploy backend (`bash deploy.sh backend`)  
✅ **Step 3**: Deploy frontend (`bash deploy.sh frontend`)  
✅ **Step 4**: Test all features in production  

🎉 Your diary calendar feature will be live!
