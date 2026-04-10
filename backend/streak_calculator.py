"""
Streak calculation utility for tracking consecutive days of completed revisions.
"""

from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

try:
    from .models import Revision, Topic
except ImportError:
    from models import Revision, Topic


def calculate_streaks(db: Session, user_id: str) -> dict:
    """
    Calculate current streak and longest streak based on completed revision sessions.
    
    Streak Rules (Spaced Repetition Optimized):
    - A scheduled revision day counts if ALL revisions for that day are completed (100%)
    - Streaks count CONSECUTIVE SCHEDULED REVISION DAYS (ignoring calendar gaps)
    - Perfect for spaced repetition schedules
    - Current streak: trailing completed sessions up to most recent scheduled day
    - Longest streak: longest sequence of consecutive completed sessions ever
    
    Args:
        db: SQLAlchemy database session
    
    Returns:
        dict: {
            "current_streak": int,
            "longest_streak": int,
            "streak_dates": list[str]  # ISO dates in current streak
        }
    """
    
    # Get all unique revision dates with completion status, sorted chronologically
    dates_query = (
        db.query(
            Revision.revision_date,
            func.count(Revision.id).label('total'),
            func.sum(Revision.completed).label('completed')
        )
        .join(Revision.topic)
        .filter(Topic.user_id == user_id)
        .group_by(Revision.revision_date)
        .order_by(Revision.revision_date.asc())  # Oldest first
        .all()
    )
    
    if not dates_query:
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "streak_dates": []
        }
    
    # Only consider past scheduled days (<= today)
    today = date.today()
    past_scheduled_days = []
    for row in dates_query:
        date_obj = row[0]
        if date_obj > today:
            continue
        total = int(row[1])
        completed = int(row[2] or 0)
        is_complete = (completed == total and total > 0)
        past_scheduled_days.append((date_obj, is_complete))

    if not past_scheduled_days:
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "streak_dates": []
        }

    past_scheduled_days.sort(key=lambda x: x[0])

    # Calculate longest streak: max consecutive completed scheduled days
    longest_streak = 0
    temp_streak = 0
    for _, is_complete in past_scheduled_days:
        if is_complete:
            temp_streak += 1
            longest_streak = max(longest_streak, temp_streak)
        else:
            temp_streak = 0

    # Calculate current streak: trailing completed from the most recent past day
    current_streak = 0
    streak_dates = []
    for i in range(len(past_scheduled_days) - 1, -1, -1):
        date_obj, is_complete = past_scheduled_days[i]
        if is_complete:
            current_streak += 1
            streak_dates.append(date_obj.isoformat())
        else:
            break

    streak_dates.reverse()
    
    
    
    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "streak_dates": streak_dates
    }


def get_next_milestone(current_streak: int) -> dict:
    """
    Calculate the next streak milestone and progress towards it.
    
    Milestones: 7 days, 30 days, 100 days
    
    Args:
        current_streak: Current streak count
    
    Returns:
        dict: {
            "next_milestone": int,
            "progress": int,  # 0-100 percentage
            "days_remaining": int
        }
    """
    milestones = [7, 30, 100]
    
    # Find next milestone
    next_milestone = None
    for milestone in milestones:
        if current_streak < milestone:
            next_milestone = milestone
            break
    
    if next_milestone is None:
        # Beyond all milestones - set next as +100
        next_milestone = ((current_streak // 100) + 1) * 100
    
    # Calculate progress
    if next_milestone == 7:
        prev_milestone = 0
    elif next_milestone == 30:
        prev_milestone = 7
    elif next_milestone == 100:
        prev_milestone = 30
    else:
        prev_milestone = (next_milestone // 100 - 1) * 100
    
    milestone_range = next_milestone - prev_milestone
    progress_in_range = current_streak - prev_milestone
    progress_percent = int((progress_in_range / milestone_range) * 100)
    
    return {
        "next_milestone": next_milestone,
        "progress": max(0, min(100, progress_percent)),
        "days_remaining": next_milestone - current_streak
    }