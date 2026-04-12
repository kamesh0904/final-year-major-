# 🚨 CRITICAL FIX NEEDED in main.py

## Problem
Lines 38-40 reference `app` before it's created (app is created on line 62).

## Fix
Move lines 38-40 to AFTER line 69 (after app creation).

### Current Code (WRONG - lines 34-41):
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter  # ❌ ERROR: app doesn't exist yet!
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 1. LOAD ENV VARIABLES (only in development)
```

### Fixed Code:
**Step 1:** Delete lines 38-40 (keep the imports on 34-36)
**Step 2:** Add this code AFTER line 69 (after the app = FastAPI(...) block):

```python
# ------------------ App Initialization ------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Personalization & Adaptive Logic API for NeuroNest",
    version=settings.VERSION,
    debug=settings.DEBUG,
    docs_url="/docs",  # Enable Swagger UI
    redoc_url="/redoc"  # Enable ReDoc
)

# Rate Limiting Setup (must be AFTER app creation)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ------------------ Middleware ------------------
app.add_middleware(
    CORSMiddleware,
    ...
```

## Quick Fix Commands

```python
# In main.py around line 34-41, change:
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# DELETE these 3 lines (38-40):
# limiter = Limiter(key_func=get_remote_address)
# app.state.limiter = limiter
# app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Then AFTER line 69 (after app = FastAPI(...) closing paren), ADD:
# Rate Limiting Setup
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

This will allow the server to start correctly!
