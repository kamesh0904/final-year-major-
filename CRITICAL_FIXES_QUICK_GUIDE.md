# 🚨 Critical Fixes Quick Reference Guide

## Fix These IMMEDIATELY (Before Production Use)

### 1. Authentication Bypass (CRITICAL)
**File**: `backend/auth.py`

Replace entire `get_current_user` function:

```python
import jwt
from datetime import datetime
from fastapi import HTTPException, Header
from typing import Optional

async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = jwt.decode(
            token, 
            os.getenv("SECRET_KEY"), 
            algorithms=["HS256"]
        )
        
        if payload.get('exp') and datetime.fromtimestamp(payload['exp']) < datetime.now():
            raise HTTPException(status_code=401, detail="Token expired")
        
        user_id = payload.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return user_id
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

---

### 2. SQL Injection (CRITICAL)
**Files**: `backend/post_game_questionnaire.py`, `backend/weekly_report_generator.py`

Find and replace ALL instances:

```python
# ❌ WRONG:
cursor.execute(f"SELECT * FROM table WHERE id = '{user_id}'")
cursor.execute("SELECT * FROM table WHERE id = '{}'".format(user_id))

# ✅ CORRECT:
cursor.execute("SELECT * FROM table WHERE id = %s", (user_id,))
```

**Search for these patterns and fix**:
- `f"SELECT`
- `f"INSERT`
- `f"UPDATE`
- `f"DELETE`
- `.format(`

---

### 3. Remove localStorage Token Storage (CRITICAL)
**Files**: `frontend/src/pages/Login.tsx`, `frontend/src/pages/Signup.tsx`

Remove these lines:
```typescript
// ❌ DELETE THESE:
localStorage.setItem("token", data.session?.access_token || "");
localStorage.setItem("user", JSON.stringify(data.user));
```

Backend should set HTTP-only cookies instead:
```python
# In backend/main.py after successful login:
response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,
    secure=True,
    samesite="strict",
    max_age=3600
)
```

---

### 4. Add Input Validation (CRITICAL)
**File**: `backend/main.py`

Add to all POST endpoints:

```python
from pydantic import BaseModel, validator, constr

class ChatRequest(BaseModel):
    message: constr(min_length=1, max_length=5000)
    history: list
    profile: str
    
    @validator('message')
    def sanitize_message(cls, v):
        import html
        return html.escape(v.strip())
```

---

### 5. Add Rate Limiting (HIGH PRIORITY)
**File**: `backend/main.py`

Add to expensive endpoints:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/chat")
@limiter.limit("10/minute")
async def chat_endpoint(request: Request, ...):
    pass

@app.post("/generate-weekly-report")
@limiter.limit("5/hour")
async def generate_report(request: Request, ...):
    pass
```

---

## Quick Test Commands

### Test SQL Injection:
```bash
# Try injecting SQL in user_id parameter:
curl -X POST http://localhost:8080/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"user_id": "1; DROP TABLE users; --"}'
```

### Test Authentication Bypass:
```bash
# Try accessing with fake user_id:
curl -X GET http://localhost:8080/api/profile \
  -H "Authorization: Bearer fake_user_id_12345"
```

### Test Rate Limiting:
```bash
# Send 20 requests rapidly:
for i in {1..20}; do
  curl -X POST http://localhost:8080/chat
done
```

---

## Environment Variables to Add

Add to `.env`:
```bash
# Security
SECRET_KEY=your-super-secret-key-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Database (if using direct connection)
DB_HOST=db.your-project.supabase.co
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_PORT=5432

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All SQL queries use parameterized queries
- [ ] JWT validation implemented
- [ ] Tokens moved to HTTP-only cookies
- [ ] Input validation on all endpoints
- [ ] Rate limiting enabled
- [ ] Debug endpoints removed or protected
- [ ] Environment variables validated
- [ ] Error messages don't expose internals
- [ ] HTTPS enforced
- [ ] Security headers added

---

## Emergency Rollback Plan

If issues occur after deployment:

1. **Revert to previous version**:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Check logs**:
   ```bash
   # GCP Cloud Run
   gcloud logging read "resource.type=cloud_run_revision"
   ```

3. **Monitor errors**:
   - Check Supabase logs
   - Check application logs
   - Monitor error rates

---

## Support Resources

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **FastAPI Security**: https://fastapi.tiangolo.com/tutorial/security/
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725
- **SQL Injection Prevention**: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html

---

**Last Updated**: February 19, 2026  
**Priority**: CRITICAL - Fix before production deployment
