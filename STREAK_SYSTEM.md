# Streak System Documentation

## Overview

The Streak System tracks consecutive days of completed revisions, encouraging users to maintain consistent study habits. It calculates current streaks, records personal bests, and provides milestone targets with progress tracking.

---

## Features

### 1. **Current Streak** 🔥
- Counts consecutive days (from today backwards) where ALL revisions are completed
- Resets to 0 if any day has incomplete revisions
- Only counts days that have at least one revision scheduled

### 2. **Longest Streak** 🏆
- Records the user's best streak ever achieved
- Persists across all time periods
- Automatically updates when current streak exceeds previous record

### 3. **Milestone Tracking** 🎯
- **7 days** - First milestone (beginner)
- **30 days** - Second milestone (committed)
- **100 days** - Third milestone (master)
- **Beyond 100** - Increments of 100 days

### 4. **Progress Visualization**
- Animated progress bar showing advancement to next milestone
- Real-time countdown of days remaining
- Percentage-based progress indicator

### 5. **Completion Celebration** 🎉
- Full-screen animated celebration when daily goal is achieved
- Confetti animation with 50 colorful pieces
- Trophy emoji with rotation and scaling effects
- Auto-dismisses after 3 seconds

---

## API Endpoints

### GET /streaks

Calculate and return current streak and longest streak information.

**Request:**
```http
GET http://localhost:8000/streaks
```

**Response:**
```json
{
  "current_streak": 5,
  "longest_streak": 12,
  "next_milestone": {
    "target": 7,
    "progress": 71,
    "days_remaining": 2
  },
  "streak_dates": [
    "2026-01-19",
    "2026-01-18",
    "2026-01-17",
    "2026-01-16",
    "2026-01-15"
  ]
}
```

**Response Fields:**
- `current_streak` (int): Number of consecutive days with 100% completion
- `longest_streak` (int): Personal record for consecutive days
- `next_milestone` (object):
  - `target` (int): Next milestone day count
  - `progress` (int): Percentage progress towards milestone (0-100)
  - `days_remaining` (int): Days needed to reach milestone
- `streak_dates` (array): ISO date strings of dates in current streak

---

## Streak Calculation Logic

### Algorithm

1. **Fetch all revision dates** from database with completion status
2. **Group by date** and calculate completion percentage for each day
3. **Current Streak Calculation:**
   - Start from today
   - Go backwards day by day
   - Count consecutive days where ALL revisions are completed
   - Stop when hitting an incomplete day or a day with no revisions
4. **Longest Streak Calculation:**
   - Scan all dates chronologically
   - Track running streak count
   - Reset on incomplete days or gaps
   - Record maximum streak achieved

### Rules

✅ **A day counts towards streak if:**
- It has at least 1 revision scheduled
- ALL revisions for that day are marked as completed (100%)

❌ **Streak breaks if:**
- Any day has incomplete revisions (< 100%)
- There's a gap in scheduled revision dates
- Today has incomplete revisions

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| No revisions exist | `current_streak: 0`, `longest_streak: 0` |
| Only future revisions | `current_streak: 0` |
| Gap in past dates | Streak resets at gap |
| Partially complete today | Current streak = 0 |
| 100% complete today | Current streak includes today |

---

## Frontend Integration

### Components

#### 1. **StreakDisplay.tsx**
Located: `frontend/components/StreakDisplay.tsx`

**Props:**
```typescript
interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  nextMilestone?: number;
  milestoneProgress?: number;
  daysRemaining?: number;
}
```

**Features:**
- Gradient background (orange to red)
- Animated fire emoji (🔥) that pulses when streak is active
- Trophy emoji (🏆) for personal record
- Progress bar with smooth animation
- Milestone countdown

**Usage:**
```tsx
<StreakDisplay
  currentStreak={5}
  longestStreak={12}
  nextMilestone={7}
  milestoneProgress={71}
  daysRemaining={2}
/>
```

#### 2. **CompletionCelebration.tsx**
Located: `frontend/components/CompletionCelebration.tsx`

**Props:**
```typescript
interface CompletionCelebrationProps {
  show: boolean;
  onClose: () => void;
}
```

**Features:**
- Full-screen overlay (fixed positioning)
- 50 animated confetti pieces
- Trophy emoji with scale and rotation
- "Amazing Work!" message
- "100% Daily Goal Achieved!" card
- Auto-dismiss after 3 seconds

**Usage:**
```tsx
<CompletionCelebration
  show={showCelebration}
  onClose={() => setShowCelebration(false)}
/>
```

### Pages Using Streak System

#### List View (`frontend/app/list/page.tsx`)
- Displays StreakDisplay component at top of page
- Loads streak data via `/streaks` API endpoint
- Refreshes streaks when revisions are updated
- Integrates CompletionCelebration on modal close

---

## Backend Implementation

### Files

#### 1. **streak_calculator.py**
Located: `backend/streak_calculator.py`

**Functions:**

##### `calculate_streaks(db: Session) -> dict`
Main function to calculate current and longest streaks.

**Returns:**
```python
{
    "current_streak": int,
    "longest_streak": int,
    "streak_dates": list[str]  # ISO format
}
```

##### `get_next_milestone(current_streak: int) -> dict`
Calculates next milestone and progress.

**Returns:**
```python
{
    "next_milestone": int,     # Target day count
    "progress": int,           # 0-100 percentage
    "days_remaining": int      # Days until milestone
}
```

#### 2. **main.py**
Located: `backend/main.py`

**New Endpoint:**
```python
@app.get("/streaks")
def get_streaks():
    """
    Calculate and return current streak and longest streak.
    """
```

**Imports Added:**
```python
from streak_calculator import calculate_streaks, get_next_milestone
```

---

## Database Schema

No schema changes required. The streak system uses existing tables:

- **topics** - Contains user's study topics
- **revisions** - Contains scheduled revision dates with completion status

---

## Testing

### Manual Testing Steps

1. **Test No Data:**
   ```bash
   curl http://localhost:8000/streaks
   # Expected: current_streak: 0, longest_streak: 0
   ```

2. **Test with Topics:**
   ```bash
   # Add a topic
   curl -X POST http://localhost:8000/topics \
     -H "Content-Type: application/json" \
     -d '{"title": "Test Topic"}'
   
   # Check streaks
   curl http://localhost:8000/streaks
   ```

3. **Test Completion:**
   ```bash
   # Get today's revisions
   curl http://localhost:8000/revision-date/2026-01-19
   
   # Complete a revision
   curl -X PATCH http://localhost:8000/revision/{revision_id} \
     -H "Content-Type: application/json" \
     -d '{"completed": true}'
   
   # Check streaks again
   curl http://localhost:8000/streaks
   ```

### Frontend Testing

1. Navigate to List View page
2. Verify StreakDisplay component renders
3. Complete all revisions for today
4. Close the date modal
5. Verify CompletionCelebration appears
6. Check streak increments

---

## Performance Considerations

- **Database Query:** Single query groups all revisions by date
- **Complexity:** O(n) where n = number of unique revision dates
- **Caching:** Consider caching streak data for 1 hour if performance becomes an issue
- **Indexing:** Ensure `revision_date` column is indexed

---

## Future Enhancements

### Potential Improvements

1. **Streak History Graph** 📊
   - Visualize streak trends over time
   - Show peaks and valleys

2. **Streak Notifications** 🔔
   - Remind users to maintain streak
   - Warn when streak is at risk

3. **Social Features** 👥
   - Compare streaks with friends
   - Leaderboards

4. **Streak Recovery** 💪
   - Allow one "skip day" per month
   - Streak freeze power-ups

5. **Achievements System** 🎖️
   - Badges for milestone achievements
   - Special titles for long streaks

6. **Weekly/Monthly Streaks** 📅
   - Track perfect weeks
   - Track perfect months

---

## Troubleshooting

### Common Issues

**Issue:** Streak not updating after completing revisions
- **Solution:** Ensure all revisions for the day are completed (100%)
- Check that modal close triggers streak refresh

**Issue:** Celebration not showing
- **Solution:** Verify all topics are completed before closing modal
- Check browser console for errors

**Issue:** Milestone progress stuck
- **Solution:** Refresh the page to reload streak data
- Verify backend endpoint is returning correct data

**Issue:** Backend error on /streaks endpoint
- **Solution:** Check database connection
- Ensure SQLAlchemy is installed: `pip install sqlalchemy`

---

## Example Workflows

### Scenario 1: New User
1. User adds first topic → 87 revisions generated (5 years)
2. User visits List View → Sees "Current Streak: 0 days"
3. User completes today's revisions → Celebration appears
4. User checks List View → "Current Streak: 1 day"

### Scenario 2: Maintaining Streak
1. User has 5-day streak
2. User completes all revisions for day 6
3. Streak increases to 6 days
4. Progress shows 86% towards 7-day milestone

### Scenario 3: Breaking Streak
1. User has 10-day streak
2. User misses day 11 (incomplete revisions)
3. Current streak resets to 0
4. Longest streak remains 10

### Scenario 4: Milestone Achievement
1. User reaches day 7 → First milestone achieved! 🎯
2. Next target automatically set to 30 days
3. Progress bar starts from 0% towards 30

---

## Code Examples

### Backend: Custom Streak Query

```python
from sqlalchemy import func, case
from models import Revision

# Get completion status by date
dates = db.query(
    Revision.revision_date,
    func.count(Revision.id).label('total'),
    func.sum(case((Revision.completed == True, 1), else_=0)).label('completed')
).group_by(Revision.revision_date).all()
```

### Frontend: Load and Display Streaks

```tsx
const loadStreaks = async () => {
  try {
    const res = await API.get("/streaks");
    setStreakData(res.data);
  } catch (error) {
    console.error("Failed to load streaks:", error);
  }
};

useEffect(() => {
  loadStreaks();
}, [refreshKey]);
```

---

## Summary

The Streak System is a comprehensive gamification feature that:
- ✅ Tracks consecutive days of completion
- ✅ Provides visual feedback and motivation
- ✅ Celebrates achievements with animations
- ✅ Sets clear milestone goals
- ✅ Records personal bests
- ✅ Integrates seamlessly with existing revision system

This encourages users to build consistent study habits and maintain long-term engagement with the revision planner application.