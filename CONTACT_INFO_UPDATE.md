# Contact Information Feature Implementation

This document explains the changes made to add address and emergency phone number fields to the NeuroNest profile system.

## Changes Made

### 1. Database Schema Update
- **File**: `backend/migrations/add_contact_info.sql`
- **Action**: Run this SQL script in your Supabase SQL editor to add the new columns:
  ```sql
  ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20);
  ```

### 2. Frontend Updates
- **File**: `frontend/src/pages/Profile.tsx`
- **Changes**:
  - Added contact information editing interface
  - Added state management for address and emergency phone
  - Added save/cancel functionality with inline editing
  - Added icons and styling for the contact section

### 3. Backend API Updates
- **File**: `backend/main.py`
- **Changes**:
  - Added `ContactInfoUpdate` Pydantic model
  - Added `/update-contact-info` endpoint
  - Added proper error handling and logging

- **File**: `backend/database.py`
- **Changes**:
  - Added `update_contact_info()` function
  - Added database update logic with error handling

### 4. Frontend API Integration
- **File**: `frontend/src/api/neuroNestApi.ts`
- **Changes**:
  - Added `updateContactInfo()` function
  - Added TypeScript interfaces for the API call

## How to Deploy

### Step 1: Update Database Schema
1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Run the SQL script from `backend/migrations/add_contact_info.sql`

### Step 2: Test Database Connection
```bash
cd backend
python test_contact_info.py
```

### Step 3: Restart Backend Server
```bash
cd backend
python -m uvicorn main:app --reload
```

### Step 4: Test Frontend
1. Navigate to the Profile page
2. Click the edit icon next to "Emergency Contact"
3. Enter address and phone number
4. Click save

## Features

### User Interface
- **Inline Editing**: Click edit icon to modify contact information
- **Visual Feedback**: Icons for address (MapPin) and phone (Phone)
- **Validation**: Basic form validation and error handling
- **Responsive Design**: Works on mobile and desktop

### Security Considerations
- Contact information is stored in the profiles table
- Updates require user authentication
- Data is validated on both frontend and backend
- Proper error handling prevents data corruption

### Database Structure
```sql
profiles table:
- address (TEXT): User's residential address
- emergency_phone (VARCHAR(20)): Emergency contact phone number
```

## API Endpoints

### POST /update-contact-info
**Request Body**:
```json
{
  "address": "123 Main St, City, State 12345",
  "emergency_phone": "+1-555-123-4567"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Contact information update processed",
  "data": {
    "address_length": 35,
    "has_emergency_phone": true
  }
}
```

## Testing

### Manual Testing
1. Log into the application
2. Navigate to Profile page
3. Click edit icon next to Emergency Contact
4. Enter test data:
   - Address: "123 Test Street, Test City, TC 12345"
   - Phone: "+1-555-123-4567"
5. Click save
6. Verify data persists after page refresh

### Automated Testing
Run the test script:
```bash
cd backend
python test_contact_info.py
```

## Future Enhancements

1. **Phone Number Validation**: Add regex validation for phone number formats
2. **Address Geocoding**: Integrate with Google Maps API for address validation
3. **Emergency Contact Types**: Add relationship field (parent, spouse, friend, etc.)
4. **Multiple Contacts**: Allow multiple emergency contacts
5. **Privacy Settings**: Allow users to control who can see their contact info
6. **Export Feature**: Allow users to export their profile data including contact info

## Troubleshooting

### Common Issues

1. **Database columns don't exist**
   - Solution: Run the SQL migration script in Supabase

2. **API endpoint returns 404**
   - Solution: Restart the backend server

3. **Frontend shows "No address provided"**
   - Solution: Check if the database update was successful

4. **Save button doesn't work**
   - Solution: Check browser console for JavaScript errors

### Debug Commands
```bash
# Check database connection
python backend/test_connection.py

# Test contact info functionality
python backend/test_contact_info.py

# Check backend logs
tail -f backend/logs/app.log
```

## Security Notes

- Contact information is sensitive data
- Consider implementing field-level encryption for addresses
- Add audit logging for contact information changes
- Implement rate limiting on the update endpoint
- Consider GDPR compliance for EU users

## Support

If you encounter issues:
1. Check the console logs (browser and backend)
2. Verify database schema is updated
3. Ensure all dependencies are installed
4. Test with the provided test scripts