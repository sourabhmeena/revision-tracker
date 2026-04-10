from datetime import datetime


def format_date(dt) -> str:
    """Convert a date/datetime to 'Jan 20, 2026' format."""
    return dt.strftime("%b %d, %Y")


def year_progress(dt) -> float:
    """Calculate % of year passed with 3 decimals."""
    year_start = datetime(dt.year, 1, 1)
    year_end = datetime(dt.year + 1, 1, 1)

    total_days = (year_end - year_start).days
    passed_days = (dt - year_start.date()).days + 1

    return round((passed_days / total_days) * 100, 3)
