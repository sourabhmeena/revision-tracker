"""
Test script for streak calculation logic.

Usage:
    cd backend
    python test_streaks.py
"""

import sys
from datetime import date, timedelta
from database import SessionLocal, Base, engine
from models import User, Topic, Revision
from streak_calculator import calculate_streaks, get_next_milestone

TEST_USER_ID = "test-streak-user-001"


def create_test_data():
    """Create test data with various completion scenarios."""
    print("Creating test data...")

    db = SessionLocal()

    db.query(Revision).delete()
    db.query(Topic).delete()
    db.query(User).filter(User.id == TEST_USER_ID).delete()
    db.commit()

    user = User(
        id=TEST_USER_ID,
        email="test-streaks@example.com",
        hashed_password="not-a-real-hash",
        created_at=date.today(),
    )
    db.add(user)
    db.commit()

    topic = Topic(
        user_id=TEST_USER_ID,
        title="Test Streak Topic",
        created_at=date.today() - timedelta(days=30),
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)

    # Scenario 1: Perfect 5-day streak (today backwards)
    for i in range(5):
        rev_date = date.today() - timedelta(days=i)
        db.add(Revision(topic_id=topic.id, revision_date=rev_date, completed=True))

    # Scenario 2: Incomplete day (breaks streak)
    db.add(Revision(
        topic_id=topic.id,
        revision_date=date.today() - timedelta(days=5),
        completed=False,
    ))

    # Scenario 3: Historical 10-day streak
    for i in range(10, 20):
        rev_date = date.today() - timedelta(days=i)
        db.add(Revision(topic_id=topic.id, revision_date=rev_date, completed=True))

    db.commit()
    db.close()
    print("  Test data created")


def test_streak_calculation():
    """Test streak calculation logic."""
    print("\nTesting streak calculation...")

    db = SessionLocal()
    result = calculate_streaks(db, TEST_USER_ID)
    db.close()

    print(f"  Current Streak: {result['current_streak']} days")
    print(f"  Longest Streak: {result['longest_streak']} days")
    print(f"  Streak Dates: {len(result['streak_dates'])} dates")

    assert result["current_streak"] == 5, f"Expected current_streak=5, got {result['current_streak']}"
    assert result["longest_streak"] == 10, f"Expected longest_streak=10, got {result['longest_streak']}"
    assert len(result["streak_dates"]) == 5, f"Expected 5 streak dates, got {len(result['streak_dates'])}"

    print("  Streak calculation test passed")


def test_milestone_calculation():
    """Test milestone calculation logic."""
    print("\nTesting milestone calculation...")

    result = get_next_milestone(5)
    print(f"  5 days -> Next milestone: {result['next_milestone']} days")
    assert result["next_milestone"] == 7
    assert result["days_remaining"] == 2

    result = get_next_milestone(20)
    print(f"  20 days -> Next milestone: {result['next_milestone']} days")
    assert result["next_milestone"] == 30
    assert result["days_remaining"] == 10

    result = get_next_milestone(95)
    print(f"  95 days -> Next milestone: {result['next_milestone']} days")
    assert result["next_milestone"] == 100
    assert result["days_remaining"] == 5

    result = get_next_milestone(150)
    print(f"  150 days -> Next milestone: {result['next_milestone']} days")
    assert result["next_milestone"] == 200
    assert result["days_remaining"] == 50

    print("  Milestone calculation test passed")


def test_edge_cases():
    """Test edge cases."""
    print("\nTesting edge cases...")

    db = SessionLocal()

    db.query(Revision).delete()
    db.query(Topic).delete()
    db.commit()

    result = calculate_streaks(db, TEST_USER_ID)
    print(f"  No data -> Current: {result['current_streak']}, Longest: {result['longest_streak']}")
    assert result["current_streak"] == 0
    assert result["longest_streak"] == 0

    milestone = get_next_milestone(0)
    print(f"  0 days -> Next milestone: {milestone['next_milestone']}")
    assert milestone["next_milestone"] == 7

    db.close()
    print("  Edge case tests passed")


def test_today_in_progress_does_not_break_streak():
    """Regression: an in-progress today must not zero out a real streak."""
    print("\nTesting that today's in-progress state preserves streak...")

    db = SessionLocal()
    db.query(Revision).delete()
    db.query(Topic).delete()
    db.commit()

    topic = Topic(
        user_id=TEST_USER_ID,
        title="In-Progress Today Topic",
        created_at=date.today() - timedelta(days=10),
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)

    # Yesterday and the 4 days before are fully complete -> 5-day streak.
    for i in range(1, 6):
        rev_date = date.today() - timedelta(days=i)
        db.add(Revision(topic_id=topic.id, revision_date=rev_date, completed=True))

    # Today has a scheduled revision but it is NOT yet completed.
    db.add(Revision(
        topic_id=topic.id,
        revision_date=date.today(),
        completed=False,
    ))

    db.commit()

    result = calculate_streaks(db, TEST_USER_ID)
    print(f"  Current: {result['current_streak']}, Longest: {result['longest_streak']}")

    assert result["current_streak"] == 5, (
        f"Expected current_streak=5 (today in progress shouldn't reset), "
        f"got {result['current_streak']}"
    )
    assert result["longest_streak"] == 5
    assert len(result["streak_dates"]) == 5

    db.close()
    print("  In-progress-today test passed")


def cleanup():
    """Clean up test data."""
    print("\nCleaning up...")
    db = SessionLocal()
    db.query(Revision).delete()
    db.query(Topic).delete()
    db.query(User).filter(User.id == TEST_USER_ID).delete()
    db.commit()
    db.close()
    print("  Cleanup complete")


if __name__ == "__main__":
    print("=" * 60)
    print("STREAK SYSTEM TEST SUITE")
    print("=" * 60)

    try:
        Base.metadata.create_all(bind=engine)

        create_test_data()
        test_streak_calculation()
        test_milestone_calculation()
        test_edge_cases()
        test_today_in_progress_does_not_break_streak()
        cleanup()

        print("\n" + "=" * 60)
        print("ALL TESTS PASSED")
        print("=" * 60)

    except AssertionError as e:
        print(f"\nTEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
