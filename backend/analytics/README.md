# Backend Analytics Foundation - README

## 📊 Overview
The NeuroNest Analytics system provides comprehensive metrics calculation, trend analysis, and chart data generation for daily and weekly reports.

## 🗂️ Module Structure

```
backend/analytics/
├── __init__.py                  # Package initialization
├── metrics_calculator.py        # Core metrics calculations
├── trend_analyzer.py           # Trend analysis & comparisons
└── chart_data_generator.py     # Chart-ready data generation
```

---

## 📦 MetricsCalculator

**Purpose**: Calculate comprehensive metrics from raw user data

### Methods

#### `calculate_all_metrics(user_id, start_date, end_date, metric_type='weekly')`
Calculates all metrics for a given period.

**Returns**:
```python
{
    "engagement": {...},
    "mood": {...},
    "performance": {...},
    "therapeutic_progress": {...}
}
```

#### `calculate_engagement_metrics(user_id, start_date, end_date)`
Calculates user engagement metrics.

**Returns**:
- `total_sessions`: Number of game sessions
- `total_playtime_minutes`: Total playtime in minutes
- `unique_games_played`: Count of unique games
- `daily_average`: Average sessions per day
- `streak_days`: Current consecutive days streak

#### `calculate_mood_metrics(user_id, start_date, end_date)`
Calculates mood-related metrics from diary entries.

**Returns**:
- `average_mood`: Average mood rating (1-10)
- `mood_trend`: "improving", "stable", or "declining"
- `mood_stability`: 0-1 scale (higher is more stable)
- `best_day` / `worst_day`: Days with extreme moods

#### `calculate_performance_metrics(user_id, start_date, end_date)`
Calculates game performance metrics.

**Returns**:
- `avg_game_score`: Overall average score
- `score_trend`: Performance trend direction
- `focus_score` / `memory_score` / `emotional_score`: Category scores
- `by_game_type`: Breakdown by game type

#### `calculate_therapeutic_progress(user_id, start_date, end_date)`
Calculates therapeutic metrics.

**Returns**:
- `questionnaire_positivity`: % of positive responses
- `diary_entries_count`: Number of diary entries
- `chat_messages_count`: Number of chat interactions

---

## 📈 TrendAnalyzer

**Purpose**: Analyze trends and generate comparative insights

### Methods

#### `compare_with_previous_period(current_metrics, previous_metrics)`
Generates week-over-week or day-over-day comparisons.

**Returns**:
```python
{
    "comparisons": {
        "engagement": {...},
        "mood": {...},
        "performance": {...}
    },
    "insights": ["Your mood improved by 11% this week.", ...],
    "overall_trend": "improving"  # or "stable" / "declining"
}
```

#### `predict_mood_forecast(user_id, days_ahead=7)`
Simple mood forecasting using moving average.

**Returns**:
```python
[
    {
        "date": "2026-02-11",
        "predicted_mood": 7.2,
        "confidence": "medium"
    },
    ...
]
```

---

## 📊 ChartDataGenerator

**Purpose**: Generate chart-ready data structures for frontend

### Methods

#### `generate_all_chart_data(user_id, days=7)`
Generates all chart data for reports.

**Returns**:
```python
{
    "mood_timeline": [...],
    "game_performance": [...],
    "engagement_heatmap": [...],
    "daily_activity": [...]
}
```

#### `generate_mood_timeline(user_id, days=7)`
Mood timeline for line chart.

**Format**:
```python
[
    {"date": "Mon", "mood": 7, "baseline": 6.5, "has_data": true},
    ...
]
```

#### `generate_performance_by_game(user_id, days=7)`
Game performance for bar chart.

**Format**:
```python
[
    {
        "game": "Focus",
        "thisWeek": 88,
        "lastWeek": 76,
        "sessions": 5,
        "improvement": 12
    },
    ...
]
```

#### `generate_engagement_heatmap(user_id, days=7)`
Activity heatmap data.

**Format**:
```python
[
    {"day": "Monday", "hour": 9, "activity": 3, "time": "09:00"},
    ...
]
```

#### `generate_daily_activity(user_id, days=7)`
Daily activity summary.

**Format**:
```python
[
    {
        "date": "Mon",
        "games": 3,
        "chats": 2,
        "diary": 1,
        "total": 6
    },
    ...
]
```

---

## 💾 Database Schema

### `user_metrics_history` Table

Stores calculated metrics over time.

**Columns**:
- `user_id`: UUID reference to profiles
- `metric_date`: Date of metric period
- `metric_type`: 'daily' or 'weekly'
- Engagement: `total_sessions`, `total_playtime_seconds`, `unique_games_played`, `streak_days`
- Mood: `avg_mood_rating`, `mood_entries_count`, `mood_variance`
- Performance: `avg_game_score`, `focus_score`, `memory_score`, `emotional_score`
- Therapeutic: `questionnaire_positivity`, `chat_messages_count`, `diary_entries_count`

### `weekly_metrics_with_comparison` View

Provides week-over-week comparison with percentage changes.

---

## 🚀 Usage Example

```python
from analytics import MetricsCalculator, TrendAnalyzer, ChartDataGenerator
from datetime import datetime, timedelta

# Initialize
calculator = MetricsCalculator()
analyzer = TrendAnalyzer()
chart_gen = ChartDataGenerator()

# Calculate metrics
end_date = datetime.now()
start_date = end_date - timedelta(days=7)
metrics = await calculator.calculate_all_metrics(
    user_id="user-uuid",
    start_date=start_date,
    end_date=end_date,
    metric_type="weekly"
)

# Compare with previous week
prev_start = start_date - timedelta(days=7)
prev_metrics = await calculator.calculate_all_metrics(
    user_id="user-uuid",
    start_date=prev_start,
    end_date=start_date,
    metric_type="weekly"
)

comparison = analyzer.compare_with_previous_period(metrics, prev_metrics)

# Generate chart data
charts = await chart_gen.generate_all_chart_data(
    user_id="user-uuid",
    days=7
)

print(f"Mood changed by: {comparison['comparisons']['mood']['mood_change']['formatted']}")
print(f"Insights: {comparison['insights']}")
```

---

## 🧪 Testing

Run unit tests:

```bash
cd backend
pytest test_analytics.py -v
```

---

## 📋 Next Steps

1. **Run database migration**: `add_analytics_tables.sql` in Supabase
2. **Integrate with reports**: Update `weekly_report_generator_simple.py`
3. **Create API endpoints**: `/api/analytics/metrics`, `/api/analytics/charts`
4. **Add to weekly reports**: Include metrics and chart data in report generation

---

## 🔒 Security

- RLS policies enabled on `user_metrics_history`
- Users can only access their own metrics
- All queries use authenticated user context

---

**Status**: ✅ Core modules complete, ready for integration
