# Upstash Redis Setup Guide

## 🌍 Recommended Region Selection

**For your deployment (Google Cloud Run on us-central1):**

### Primary Recommendation: **US Central (Iowa)**
- **Why**: Same region as your Cloud Run backend (us-central1)
- **Latency**: <5ms
- **Cost**: Free tier available

### Alternative Option: **US East (Virginia)**
- **Why**: Close to us-central1, good fallback
- **Latency**: ~20-30ms
- **Cost**: Free tier available

### ⚠️ Avoid:
- Europe/Asia regions (100-200ms+ latency)
- Will slow down your chat responses significantly

---

## 📋 Step-by-Step Setup

### 1. Create Upstash Account
1. Go to https://console.upstash.com/
2. Sign up with Google or email
3. Verify your email

### 2. Create Redis Database
1. Click **"Create Database"**
2. **Name**: `neuronest-cache`
3. **Region**: Select **"US Central 1 (Iowa)"** or **"US East 1 (Virginia)"**
4. **Type**: **"Regional"** (not Global - lower latency)
5. **Eviction**: **"allkeys-lru"** (automatically removes old cache)
6. Click **"Create"**

### 3. Get Your Credentials
After creation, you'll see:
- **UPSTASH_REDIS_REST_URL**: Copy this
- **UPSTASH_REDIS_REST_TOKEN**: Copy this

### 4. Add to Your `.env` File
```bash
# Add to backend/.env

UPSTASH_REDIS_URL=https://us1-charming-xyz.upstash.io
UPSTASH_REDIS_TOKEN=AcabcdEFGHIJKLMNOPQRSTUVWXYZ1234567890
```

### 5. Test Locally
```bash
cd backend
python main.py
```

**Expected output:**
```
💾 Initializing Redis cache...
✅ Redis cache connected successfully
🤖 Initializing AI Agents...
✅ AI agents initialized successfully
```

Visit `http://localhost:8000/health` - should show:
```json
{
  "status": "healthy",
  "redis_connected": true
}
```

---

## 🧪 Testing Cache

### Test 1: Send Same Message Twice
```bash
# First request - should be slow (calls OpenAI)
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "user_id": "test-123",
    "history": [],
    "profile": "General",
    "game_stats": ""
  }'

# Second request - should be instant (from cache)
# Same exact message
```

**Expected:**
- First response: `"cached": false` (slow, ~2-3s)
- Second response: `"cached": true` (fast, <100ms)

### Test 2: Rate Limiting
Send 11 requests in 1 minute - 11th should fail with:
```json
{
  "error": "Rate limit exceeded: 10 per 1 minute"
}
```

---

## 📊 Monitoring Your Cache

### Upstash Dashboard
- Go to your database in Upstash console
- View **Metrics** tab:
  - **Hit Rate**: Should be >30% after a few days
  - **Memory Usage**: Should stay under 100MB on free tier
  - **Commands/sec**: Monitor traffic

### Cache Performance
Good cache hit rates:
- First week: 20-30%
- After month: 40-60%
- Mature system: 60-80%

---

## 💰 Cost Estimates

### Free Tier (Upstash)
- **10,000 commands/day** = ~500-1000 chat messages/day
- **256MB storage** = enough for thousands of cached responses
- **Perfect for**: 0-100 active users

### When to Upgrade ($10/month)
- 100+ active users
- 5,000+ messages/day
- Need more than 256MB cache

---

## 🚨 Troubleshooting

### "Redis initialization failed"
**Cause**: Wrong credentials or network issue

**Fix**:
1. Check `.env` has correct `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN`
2. Ensure no extra spaces in `.env`
3. Restart Python: `Ctrl+C` and `python main.py`

### "redis_connected: false" in health check
**Cause**: Redis URL/token incorrect

**Fix**:
```python
# Test credentials directly
from upstash_redis import Redis
redis = Redis(
    url="YOUR_URL_HERE",
    token="YOUR_TOKEN_HERE"
)
redis.ping()  # Should return "PONG"
```

### Cache not working (always "cached": false)
**Cause**: Different user_id or history on each request

**Debug**:
```python
# Check cache keys in cache.py
print(f"Cache key: {cache_key}")
print(f"History hash: {history_hash}")
```

---

## ✅ Verification Checklist

- [ ] Upstash account created
- [ ] Redis database created in **US Central 1**
- [ ] Credentials copied to `backend/.env`
- [ ] `pip install -r requirements.txt` completed
- [ ] `python main.py` shows "✅ Redis cache connected"
- [ ] `/health` endpoint shows `"redis_connected": true`
- [ ] Same chat message returns faster the second time
- [ ] 11th request in 1 minute gets rate limited

---

**Need help?** Let me know if you get stuck on any step!
