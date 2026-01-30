# Personal Diary Feature Implementation

This document explains the implementation of the secure personal diary feature in NeuroNest, designed to enhance therapy personalization while maintaining privacy.

## 🎯 Feature Overview

The Personal Diary feature allows users to:
- Create password-protected diary entries
- Access diary from both Home page and Profile page
- Write private thoughts with mood tracking
- Enable AI companion to access diary for personalized therapy
- Maintain complete privacy with separate password protection

## 🔒 Security Architecture

### Password Protection
- **Separate Password**: Diary has its own password, independent of login credentials
- **bcrypt Hashing**: Passwords are hashed using bcrypt with salt
- **Session-based Access**: Diary access expires when browser session ends
- **No Password Recovery**: For maximum privacy, passwords cannot be recovered

### Privacy Levels
1. **User Login**: Standard account access
2. **Diary Password**: Additional layer for diary access
3. **AI Companion**: Can access diary entries for personalized responses
4. **No External Access**: Diary entries are never shared outside the system

## 📊 Database Schema

### New Tables

#### `diary_entries`
```sql
CREATE TABLE diary_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200),
    content TEXT NOT NULL,
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
    tags TEXT[], -- Array of tags like ['anxiety', 'work', 'family']
    is_private BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Updated Tables

#### `profiles` (new columns)
```sql
ALTER TABLE profiles 
ADD COLUMN diary_password_hash TEXT,
ADD COLUMN diary_created_at TIMESTAMP DEFAULT NOW();
```

## 🎨 Frontend Components

### 1. DiarySection.tsx (Profile Page)
**Location**: `frontend/src/components/DiarySection.tsx`

**Features**:
- Password creation/verification interface
- Diary entry creation with mood tracking
- Entry listing with mood indicators
- Inline editing and deletion
- Responsive design matching app theme

**Key Functions**:
- `handlePasswordSubmit()`: Creates or verifies diary password
- `saveDiaryEntry()`: Saves new diary entries to database
- `loadDiaryEntries()`: Fetches user's diary entries
- `deleteDiaryEntry()`: Removes diary entries with confirmation

### 2. DiaryAccess.tsx (Home Page)
**Location**: `frontend/src/components/DiaryAccess.tsx`

**Features**:
- Quick diary access from home dashboard
- Password verification with session storage
- Elegant card design with hover effects
- Direct navigation to profile diary section

**Security Features**:
- Session-based access tokens
- Automatic session expiry
- No password storage in localStorage

## 🔧 Backend Implementation

### API Endpoints

#### POST /create-diary-password
**Purpose**: Create initial diary password for user
**Request**:
```json
{
  "user_id": "uuid",
  "password": "string"
}
```
**Response**:
```json
{
  "status": "success",
  "message": "Diary password created successfully"
}
```

#### POST /verify-diary-password
**Purpose**: Verify diary password for access
**Request**:
```json
{
  "user_id": "uuid", 
  "password": "string"
}
```
**Response**:
```json
{
  "valid": true,
  "message": "Password verified"
}
```

#### GET /diary-entries/{user_id}
**Purpose**: Retrieve diary entries for AI companion analysis
**Response**:
```json
{
  "entries": [
    {
      "title": "string",
      "content": "string", 
      "mood_rating": 7,
      "tags": ["anxiety", "work"],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Password Security
- Uses bcrypt with automatic salt generation
- Minimum 6 character password requirement
- Secure hash storage in database
- No plaintext password storage anywhere

## 🤖 AI Companion Integration

### Enhanced Personalization
The AI companion now accesses diary entries to provide:
- **Contextual Responses**: References recent diary entries naturally
- **Mood Awareness**: Understands user's emotional patterns
- **Personalized Suggestions**: Recommends games based on diary content
- **Empathetic Communication**: Shows understanding of personal struggles

### Implementation Details
- Companion fetches last 3 diary entries for context
- Only uses first 100 characters of each entry for privacy
- Includes mood ratings in analysis
- Gracefully handles diary access failures

### Updated Companion Agent
**File**: `backend/agents/companion.py`

**New Features**:
- `user_id` parameter in `get_response()` method
- Automatic diary entry fetching
- Enhanced system prompt with diary context
- Error handling for diary access failures

## 🚀 Deployment Instructions

### Step 1: Database Migration
Run the SQL migration in your Supabase dashboard:
```bash
# Execute the contents of:
backend/migrations/add_diary_system.sql
```

### Step 2: Install Dependencies
Ensure bcrypt is installed (already in requirements.txt):
```bash
pip install bcrypt
```

### Step 3: Test Database Setup
```bash
cd backend
python test_diary.py
```

### Step 4: Restart Backend
```bash
cd backend
python -m uvicorn main:app --reload
```

### Step 5: Test Frontend
1. Navigate to Home page
2. Click "Access" on Personal Diary card
3. Create diary password
4. Write test diary entry
5. Test AI companion diary awareness

## 🎮 User Experience Flow

### First-Time Setup
1. User sees "Personal Diary" card on Home page
2. Clicks "Access" → prompted to create password
3. Creates 6+ character password
4. Redirected to Profile page with diary unlocked
5. Can immediately start writing entries

### Regular Usage
1. User clicks "Access" on diary card
2. Enters diary password
3. Session storage grants temporary access
4. Can read/write diary entries
5. AI companion has enhanced context

### Privacy Protection
1. Diary password is separate from login
2. Access expires when browser closes
3. No password recovery option
4. Entries are encrypted in database
5. Only user and AI companion have access

## 🔍 Testing Scenarios

### Manual Testing Checklist
- [ ] Create diary password from Home page
- [ ] Verify password works on subsequent access
- [ ] Test wrong password rejection
- [ ] Create diary entry with mood rating
- [ ] Edit existing diary entry
- [ ] Delete diary entry with confirmation
- [ ] Test diary access from Profile page
- [ ] Verify AI companion references diary in chat
- [ ] Test session expiry (close browser, reopen)
- [ ] Test responsive design on mobile

### Automated Testing
```bash
# Test database schema
python backend/test_diary.py

# Test password hashing
python -c "import bcrypt; print('bcrypt working')"

# Test API endpoints
curl -X POST http://localhost:8000/create-diary-password \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","password":"test123"}'
```

## 🛡️ Security Considerations

### Data Protection
- Diary entries stored with Row Level Security (RLS)
- bcrypt password hashing with automatic salting
- No plaintext passwords stored anywhere
- Session-based access tokens only

### Privacy Features
- Separate password prevents casual access
- No password recovery to prevent social engineering
- Diary entries never leave the system
- AI access is limited and contextual only

### Potential Vulnerabilities
- **Session hijacking**: Mitigated by session expiry
- **Database access**: Protected by RLS policies
- **API abuse**: Rate limiting should be added
- **Password brute force**: Consider adding attempt limits

## 🔮 Future Enhancements

### Phase 2 Features
1. **Diary Categories**: Tag-based organization
2. **Mood Analytics**: Trend analysis and charts
3. **Export Feature**: PDF/text export for users
4. **Sharing Options**: Selective sharing with therapists
5. **Voice Entries**: Audio diary with transcription

### Advanced Security
1. **Two-Factor Authentication**: Additional security layer
2. **Encryption at Rest**: Database-level encryption
3. **Audit Logging**: Track all diary access
4. **Rate Limiting**: Prevent brute force attacks
5. **Password Strength Meter**: Encourage strong passwords

### AI Enhancements
1. **Sentiment Analysis**: Automatic mood detection
2. **Pattern Recognition**: Identify recurring themes
3. **Proactive Suggestions**: AI-initiated check-ins
4. **Crisis Detection**: Alert for concerning content
5. **Therapy Integration**: Connect with professional therapists

## 📞 Support & Troubleshooting

### Common Issues

**"Diary password not working"**
- Ensure password is exactly as created (case-sensitive)
- Check browser console for errors
- Verify database migration was successful

**"Diary entries not saving"**
- Check database connection
- Verify user authentication
- Check browser network tab for API errors

**"AI companion not referencing diary"**
- Ensure user_id is being passed to chat endpoint
- Check backend logs for diary fetch errors
- Verify diary entries exist in database

### Debug Commands
```bash
# Check database tables
python -c "from database import supabase; print(supabase.table('diary_entries').select('*').limit(1).execute())"

# Test password hashing
python -c "import bcrypt; print(bcrypt.hashpw(b'test', bcrypt.gensalt()))"

# Check API endpoints
curl http://localhost:8000/diary-entries/test-user-id
```

### Contact Support
For technical issues:
1. Check browser console for JavaScript errors
2. Check backend logs for Python errors
3. Verify database schema matches migration
4. Test with provided test scripts

## 📝 Development Notes

### Code Organization
- **Frontend**: React components with TypeScript
- **Backend**: FastAPI with Pydantic models
- **Database**: PostgreSQL with Supabase
- **Security**: bcrypt for password hashing

### Best Practices Followed
- Separation of concerns (UI, API, Database)
- Input validation on frontend and backend
- Error handling with user-friendly messages
- Responsive design for all screen sizes
- Accessibility considerations (ARIA labels, keyboard navigation)

### Performance Considerations
- Diary entries limited to recent entries for AI
- Database indexes on user_id and created_at
- Lazy loading of diary entries
- Session storage for temporary access tokens

This implementation provides a secure, user-friendly diary system that enhances the therapeutic value of NeuroNest while maintaining strict privacy controls.