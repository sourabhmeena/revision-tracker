#!/usr/bin/env python3
"""
Test script to verify the revision schedule with CUMULATIVE INTERVALS.
Run: python test_revision_schedule.py
"""

from datetime import date, timedelta
import sys

# Import from scheduler module
try:
    from scheduler import generate_revisions, REVISION_INTERVALS, REPEAT_INTERVAL
except ImportError:
    print("Error: Could not import scheduler module")
    sys.exit(1)

def test_revision_schedule():
    """Test revision schedule with cumulative intervals (1, 3, 7, 21 days between revisions)."""
    
    print("🧪 REVISION SCHEDULE TEST (Cumulative Intervals)")
    print("=" * 80)
    
    # Use a known start date for testing
    start_date = date(2026, 1, 1)  # January 1, 2026
    
    print(f"Topic Created: {start_date} (Day 0)")
    print(f"Configuration: Intervals = {REVISION_INTERVALS} days between revisions")
    print(f"               Then every {REPEAT_INTERVAL} days")
    print()
    
    # Generate revisions for 1 year
    revisions = generate_revisions(start_date, years=1)
    
    print(f"✓ Generated {len(revisions)} revisions for 1 year")
    print()
    
    # Expected schedule (cumulative)
    expected_dates = [
        date(2026, 1, 2),   # Day 1:  start + 1
        date(2026, 1, 5),   # Day 4:  day 1 + 3
        date(2026, 1, 12),  # Day 11: day 4 + 7
        date(2026, 2, 2),   # Day 32: day 11 + 21
        date(2026, 2, 23),  # Day 53: day 32 + 21
        date(2026, 3, 16),  # Day 74: day 53 + 21
        date(2026, 4, 6),   # Day 95: day 74 + 21
        date(2026, 4, 27),  # Day 116: day 95 + 21
        date(2026, 5, 18),  # Day 137: day 116 + 21
        date(2026, 6, 8),   # Day 158: day 137 + 21
    ]
    
    expected_intervals = [1, 3, 7, 21, 21, 21, 21, 21, 21, 21]
    
    print("📅 FIRST 10 REVISIONS:")
    print("-" * 80)
    print(f"{'#':<4} {'Date':<15} {'Days From Start':<17} {'Interval':<12} {'Status'}")
    print("-" * 80)
    
    all_passed = True
    prev_date = start_date
    
    for i in range(10):
        if i < len(revisions):
            actual_date = revisions[i]
            expected_date = expected_dates[i]
            days_from_start = (actual_date - start_date).days
            interval = (actual_date - prev_date).days
            expected_interval = expected_intervals[i]
            
            # Check if matches
            if actual_date == expected_date and interval == expected_interval:
                status = "✅ PASS"
            else:
                status = f"❌ FAIL"
                all_passed = False
            
            print(f"{i+1:<4} {actual_date} {f'Day {days_from_start}':<17} {f'+{interval}d':<12} {status}")
            prev_date = actual_date
        else:
            print(f"{i+1:<4} {'N/A':<15} {'N/A':<17} {'N/A':<12} ⚠️  Missing")
            all_passed = False
    
    print("-" * 80)
    print()
    
    # Check for duplicates
    print("🔍 CHECKING FOR DUPLICATES:")
    print("-" * 80)
    seen_dates = set()
    duplicates = []
    
    for rev_date in revisions:
        if rev_date in seen_dates:
            duplicates.append(rev_date)
        seen_dates.add(rev_date)
    
    if duplicates:
        print(f"❌ FAIL: Found {len(duplicates)} duplicate dates:")
        for dup in duplicates:
            print(f"   - {dup}")
        all_passed = False
    else:
        print("✅ PASS: No duplicates found")
    
    print()
    
    # Check intervals
    print("🔄 CHECKING INTERVALS:")
    print("-" * 80)
    
    intervals_correct = True
    prev = start_date
    
    for i in range(min(10, len(revisions))):
        curr = revisions[i]
        interval = (curr - prev).days
        
        if i < len(REVISION_INTERVALS):
            expected = REVISION_INTERVALS[i]
        else:
            expected = REPEAT_INTERVAL
        
        if interval == expected:
            status = "✅ PASS"
        else:
            status = f"❌ FAIL (expected {expected})"
            intervals_correct = False
            all_passed = False
        
        print(f"Revision {i+1}: {interval} days after previous {status}")
        prev = curr
    
    print()
    print("=" * 80)
    
    # Final result
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
        print()
        print("✓ Schedule uses cumulative intervals: 1, 3, 7, 21, then every 21 days")
        print("✓ No duplicate dates")
        print("✓ Intervals are consistent")
        print()
        print("Example: Jan 1 → Jan 2 (+1d) → Jan 5 (+3d) → Jan 12 (+7d) → Feb 2 (+21d)")
        return True
    else:
        print("❌ SOME TESTS FAILED!")
        print()
        print("Please review the generate_revisions() function")
        return False

if __name__ == "__main__":
    success = test_revision_schedule()
    sys.exit(0 if success else 1)