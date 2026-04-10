"""
Spaced-repetition revision schedule generator.

Default intervals follow the Ebbinghaus forgetting curve:
  +1 day  → immediate reinforcement
  +3 days → short-term consolidation
  +7 days → weekly recall
  +21 days → long-term transfer
  +30 days → monthly maintenance

After the initial intervals, revisions repeat at the last interval
(default 30 days) indefinitely.

Both generate_revisions() and extend_revisions() accept custom
intervals/repeat so each user can override the defaults.
"""

from datetime import timedelta

DEFAULT_INTERVALS = [1, 3, 7, 21, 30]
DEFAULT_REPEAT = 30
DEFAULT_YEARS = 5


def _cumulative_days(intervals: list[int]) -> list[int]:
    """Convert gap-based intervals to cumulative days from creation."""
    result, running = [], 0
    for iv in intervals:
        running += iv
        result.append(running)
    return result


def generate_revisions(
    start_date,
    years: int = DEFAULT_YEARS,
    intervals: list[int] | None = None,
    repeat: int | None = None,
):
    """
    Generate a revision schedule using spaced repetition.

    Args:
        start_date:  Date the topic was created.
        years:       How many years of revisions to produce.
        intervals:   Gap-based intervals (days between each review).
                     Defaults to DEFAULT_INTERVALS.
        repeat:      Ongoing interval after the initial phase.
                     Defaults to the last element of intervals, or DEFAULT_REPEAT.

    Returns:
        List of date objects.
    """
    intervals = intervals or DEFAULT_INTERVALS
    repeat = repeat if repeat is not None else (intervals[-1] if intervals else DEFAULT_REPEAT)

    dates = []
    current = start_date

    for gap in intervals:
        current = current + timedelta(days=gap)
        dates.append(current)

    end = start_date + timedelta(days=years * 365)

    while current < end:
        current += timedelta(days=repeat)
        if current <= end:
            dates.append(current)

    return dates


def extend_revisions(
    topic_created_date,
    existing_revisions_count: int,
    additional_years: int = 1,
    intervals: list[int] | None = None,
    repeat: int | None = None,
):
    """
    Generate extra revision dates beyond what already exists.

    Args:
        topic_created_date:      Original creation date.
        existing_revisions_count: How many revisions already exist.
        additional_years:         Years to extend by.
        intervals / repeat:       Same as generate_revisions().

    Returns:
        List of new date objects to add.
    """
    intervals = intervals or DEFAULT_INTERVALS
    repeat = repeat if repeat is not None else (intervals[-1] if intervals else DEFAULT_REPEAT)
    cumulative = _cumulative_days(intervals)

    if existing_revisions_count <= 0:
        last_day = 0
    elif existing_revisions_count <= len(cumulative):
        last_day = cumulative[existing_revisions_count - 1]
    else:
        repeating_count = existing_revisions_count - len(cumulative)
        last_day = cumulative[-1] + (repeating_count * repeat)

    dates = []
    last = topic_created_date + timedelta(days=last_day)
    end = topic_created_date + timedelta(
        days=last_day + additional_years * 365,
    )

    while last < end:
        last += timedelta(days=repeat)
        dates.append(last)

    return dates
