# 🎨 Frontend Integration - Wellness Check-ins

## Overview

This guide shows how to integrate the Pattern Detection Agent into your frontend to display wellness insights and check-ins to users.

---

## 📊 1. Wellness Insights Dashboard Widget

Add this component to your dashboard to show users their wellness patterns.

### Create Component: `frontend/src/components/WellnessInsights.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { neuroNestApi } from '../api/neuroNestApi';

interface Pattern {
  type: string;
  severity?: string;
  message: string;
  metric?: number;
}

interface WellnessData {
  patterns: {
    activity_level: number;
    mood_trend: number;
    engagement_trend: number;
    days_inactive: number;
    concerning_patterns: Pattern[];
    positive_patterns: Pattern[];
    data_points: {
      games: number;
      diary_entries: number;
      chat_messages: number;
    };
  };
  needs_check_in: boolean;
  check_in_message: string | null;
  encouragement_message: string | null;
}

export const WellnessInsights: React.FC<{ userId: string }> = ({ userId }) => {
  const [wellness, setWellness] = useState<WellnessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWellness = async () => {
      try {
        const response = await fetch(
          `${neuroNestApi.defaults.baseURL}/api/wellness/analyze-patterns/${userId}`
        );
        const data = await response.json();
        if (data.status === 'success') {
          setWellness(data);
        }
      } catch (error) {
        console.error('Failed to fetch wellness data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWellness();
  }, [userId]);

  if (loading) {
    return (
      <div className="wellness-card animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!wellness) return null;

  return (
    <div className="wellness-card bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">💙</span>
        Your Wellness Insights
      </h3>

      {/* Activity Summary */}
      <div className="mb-4 p-4 bg-white rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-2">This Week</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {wellness.patterns.data_points.games}
            </div>
            <div className="text-xs text-gray-600">Games</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {wellness.patterns.data_points.diary_entries}
            </div>
            <div className="text-xs text-gray-600">Diary</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-600">
              {wellness.patterns.data_points.chat_messages}
            </div>
            <div className="text-xs text-gray-600">Chats</div>
          </div>
        </div>
      </div>

      {/* Positive Patterns */}
      {wellness.patterns.positive_patterns.length > 0 && (
        <div className="mb-4">
          {wellness.patterns.positive_patterns.map((pattern, idx) => (
            <div
              key={idx}
              className="flex items-start p-3 bg-green-50 border-l-4 border-green-400 rounded mb-2"
            >
              <span className="text-2xl mr-3">🌟</span>
              <div>
                <p className="text-green-800 font-medium">{pattern.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Encouragement Message */}
      {wellness.encouragement_message && (
        <div className="p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg mb-4">
          <p className="text-gray-800">{wellness.encouragement_message}</p>
        </div>
      )}

      {/* Concerning Patterns (shown sensitively) */}
      {wellness.patterns.concerning_patterns.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2">
            Areas to Focus On
          </h4>
          {wellness.patterns.concerning_patterns.map((pattern, idx) => (
            <div
              key={idx}
              className="flex items-start p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded mb-2"
            >
              <span className="text-2xl mr-3">💡</span>
              <div>
                <p className="text-yellow-800">{pattern.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Check-in Message */}
      {wellness.check_in_message && (
        <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
          <p className="text-gray-800 mb-3">{wellness.check_in_message}</p>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
            Let's Talk
          </button>
        </div>
      )}
    </div>
  );
};
```

### Add to Dashboard: `frontend/src/pages/Home.tsx`

```typescript
import { WellnessInsights } from '../components/WellnessInsights';

// Inside your Home component
<div className="dashboard-grid">
  {/* Existing components */}
  
  {/* Add Wellness Insights */}
  <WellnessInsights userId={user.id} />
  
  {/* Other components */}
</div>
```

---

## 📬 2. Check-in Notifications Component

Display proactive check-ins from the agent.

### Create Component: `frontend/src/components/WellnessCheckIns.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { neuroNestApi } from '../api/neuroNestApi';

interface CheckIn {
  id: string;
  user_id: string;
  check_in_type: string;
  message: string;
  user_response: string | null;
  patterns_detected: any;
  created_at: string;
  responded_at: string | null;
}

export const WellnessCheckIns: React.FC<{ userId: string }> = ({ userId }) => {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [response, setResponse] = useState('');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  useEffect(() => {
    fetchCheckIns();
  }, [userId]);

  const fetchCheckIns = async () => {
    try {
      const res = await fetch(
        `${neuroNestApi.defaults.baseURL}/api/wellness/check-ins/${userId}?limit=5`
      );
      const data = await res.json();
      if (data.status === 'success') {
        setCheckIns(data.check_ins);
      }
    } catch (error) {
      console.error('Failed to fetch check-ins:', error);
    }
  };

  const handleRespond = async (checkInId: string) => {
    if (!response.trim()) return;

    try {
      await fetch(`${neuroNestApi.defaults.baseURL}/api/wellness/respond-to-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkin_id: checkInId,
          response: response,
        }),
      });

      setResponse('');
      setRespondingTo(null);
      fetchCheckIns(); // Refresh
    } catch (error) {
      console.error('Failed to respond:', error);
    }
  };

  const unrespondedCheckIns = checkIns.filter((c) => !c.user_response);

  if (unrespondedCheckIns.length === 0) return null;

  return (
    <div className="wellness-checkins">
      {unrespondedCheckIns.map((checkIn) => (
        <div
          key={checkIn.id}
          className="check-in-card bg-white rounded-xl shadow-lg p-6 mb-4 border-l-4 border-purple-500"
        >
          <div className="flex items-start mb-4">
            <div className="text-4xl mr-4">💙</div>
            <div className="flex-1">
              <p className="text-gray-800 text-lg mb-2">{checkIn.message}</p>
              <p className="text-gray-500 text-sm">
                {new Date(checkIn.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {respondingTo === checkIn.id ? (
            <div className="mt-4">
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                placeholder="Share what's on your mind..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleRespond(checkIn.id)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Send
                </button>
                <button
                  onClick={() => {
                    setRespondingTo(null);
                    setResponse('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setRespondingTo(checkIn.id)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Respond
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
```

### Add to Home Page

```typescript
import { WellnessCheckIns } from '../components/WellnessCheckIns';

// At the top of your dashboard
<WellnessCheckIns userId={user.id} />
```

---

## 🔔 3. Notification Badge

Show unread check-ins count in navbar.

### Update Navbar: `frontend/src/components/Navbar.tsx`

```typescript
import { useEffect, useState } from 'react';

const [unreadCheckIns, setUnreadCheckIns] = useState(0);

useEffect(() => {
  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(
        `${neuroNestApi.defaults.baseURL}/api/wellness/check-ins/${userId}?limit=10`
      );
      const data = await res.json();
      if (data.status === 'success') {
        const unread = data.check_ins.filter((c: any) => !c.user_response).length;
        setUnreadCheckIns(unread);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  fetchUnreadCount();
  // Poll every 5 minutes
  const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, [userId]);

// In your navbar JSX
<div className="relative">
  <button className="nav-button">
    <span>💙</span>
    {unreadCheckIns > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        {unreadCheckIns}
      </span>
    )}
  </button>
</div>
```

---

## 📱 4. Mobile Integration

For the React Native mobile app, create similar components:

### `mobile/src/components/WellnessInsights.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const WellnessInsights = ({ userId }: { userId: string }) => {
  const [wellness, setWellness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/wellness/analyze-patterns/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') {
          setWellness(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return <ActivityIndicator size="large" color="#667eea" />;
  }

  if (!wellness) return null;

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.title}>💙 Your Wellness</Text>
      
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {wellness.patterns.data_points.games}
          </Text>
          <Text style={styles.statLabel}>Games</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {wellness.patterns.data_points.diary_entries}
          </Text>
          <Text style={styles.statLabel}>Diary</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {wellness.patterns.data_points.chat_messages}
          </Text>
          <Text style={styles.statLabel}>Chats</Text>
        </View>
      </View>

      {wellness.encouragement_message && (
        <View style={styles.message}>
          <Text style={styles.messageText}>
            {wellness.encouragement_message}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  message: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 16,
  },
  messageText: {
    color: 'white',
    fontSize: 14,
  },
});
```

---

## 🎨 Styling Tips

### Tailwind CSS Classes (Web)

```css
/* Wellness Card */
.wellness-card {
  @apply bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 shadow-lg;
}

/* Positive Pattern */
.positive-pattern {
  @apply flex items-start p-3 bg-green-50 border-l-4 border-green-400 rounded mb-2;
}

/* Concerning Pattern */
.concerning-pattern {
  @apply flex items-start p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded mb-2;
}

/* Check-in Card */
.check-in-card {
  @apply bg-white rounded-xl shadow-lg p-6 mb-4 border-l-4 border-purple-500;
}
```

---

## 🔄 Real-Time Updates (Optional)

For real-time check-ins, use WebSockets or polling:

### Polling Approach (Simple)

```typescript
useEffect(() => {
  const pollCheckIns = setInterval(() => {
    fetchCheckIns();
  }, 60000); // Every minute

  return () => clearInterval(pollCheckIns);
}, []);
```

### WebSocket Approach (Advanced)

```typescript
useEffect(() => {
  const ws = new WebSocket('ws://localhost:8000/ws/wellness');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'new_checkin') {
      fetchCheckIns();
      // Show notification
      showNotification(data.message);
    }
  };

  return () => ws.close();
}, []);
```

---

## 📊 Analytics Integration

Track user engagement with wellness features:

```typescript
// When user views wellness insights
analytics.track('Wellness Insights Viewed', {
  userId: user.id,
  hasCheckIns: checkIns.length > 0,
  hasConcerns: wellness.patterns.concerning_patterns.length > 0,
});

// When user responds to check-in
analytics.track('Check-in Responded', {
  userId: user.id,
  checkInType: checkIn.check_in_type,
  responseLength: response.length,
});
```

---

## ✅ Integration Checklist

- [ ] WellnessInsights component created
- [ ] WellnessCheckIns component created
- [ ] Components added to dashboard
- [ ] Notification badge in navbar
- [ ] Mobile components created (if applicable)
- [ ] Styling matches design system
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Analytics tracking added
- [ ] Tested with real data

---

## 🎉 Result

Users will now see:
- ✅ Personalized wellness insights on dashboard
- ✅ Proactive check-in messages
- ✅ Celebration of positive patterns
- ✅ Gentle nudges for concerning patterns
- ✅ Notification badges for unread check-ins
- ✅ Beautiful, empathetic UI

All powered by the free Pattern Detection Agent! 🚀
