import json
import uuid

from sqlalchemy import Column, String, Date, Boolean, ForeignKey, Integer, Index
from sqlalchemy.orm import relationship

try:
    from .database import Base
except ImportError:
    from database import Base


def uid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=uid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(Date, nullable=False)
    # JSON-encoded list of ints, e.g. "[1,3,7,21,30]".  NULL → use defaults.
    revision_intervals = Column(String, nullable=True)
    # Ongoing repeat gap (days).  NULL → use last element of intervals.
    repeat_interval = Column(Integer, nullable=True)

    topics = relationship("Topic", back_populates="user")

    def get_intervals(self) -> list[int] | None:
        """Parse stored intervals JSON or return None (use defaults)."""
        if not self.revision_intervals:
            return None
        try:
            parsed = json.loads(self.revision_intervals)
            if isinstance(parsed, list) and all(isinstance(x, int) and x > 0 for x in parsed):
                return parsed
        except (json.JSONDecodeError, TypeError):
            pass
        return None

    def get_repeat(self) -> int | None:
        if self.repeat_interval and self.repeat_interval > 0:
            return self.repeat_interval
        return None


class Topic(Base):
    __tablename__ = "topics"

    id = Column(String, primary_key=True, default=uid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    created_at = Column(Date, nullable=False)
    category = Column(String, nullable=True)
    chapter = Column(String, nullable=True)
    description = Column(String, nullable=True)
    # Per-topic overrides.  NULL → inherit from user settings (or global defaults).
    revision_intervals = Column(String, nullable=True)
    repeat_interval = Column(Integer, nullable=True)

    user = relationship("User", back_populates="topics")
    revisions = relationship("Revision", back_populates="topic")

    def get_intervals(self) -> list[int] | None:
        if not self.revision_intervals:
            return None
        try:
            parsed = json.loads(self.revision_intervals)
            if isinstance(parsed, list) and all(isinstance(x, int) and x > 0 for x in parsed):
                return parsed
        except (json.JSONDecodeError, TypeError):
            pass
        return None

    def get_repeat(self) -> int | None:
        if self.repeat_interval and self.repeat_interval > 0:
            return self.repeat_interval
        return None


class ScheduleBlock(Base):
    """A recurring time block on a weekly schedule template.

    Tied to a weekday (0=Mon … 6=Sun) rather than a calendar date, so a day's
    blocks can be copied onto other weekdays (weekdays / weekends / all).
    """

    __tablename__ = "schedule_blocks"
    __table_args__ = (
        Index("ix_schedule_user_weekday", "user_id", "weekday"),
    )

    id = Column(String, primary_key=True, default=uid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    weekday = Column(Integer, nullable=False)  # 0=Mon … 6=Sun
    start_time = Column(String, nullable=False)  # "HH:MM"
    end_time = Column(String, nullable=False)    # "HH:MM"
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    color = Column(String, nullable=True)        # hex swatch, e.g. "#6366f1"


class BlockCompletion(Base):
    """Marks a recurring schedule block done on a specific calendar date.

    Presence of a row = completed. Toggling off deletes the row. The block is a
    weekly template; this pins completion to one real date so weekly reports can
    track what actually got done.
    """

    __tablename__ = "block_completions"
    __table_args__ = (
        Index("ix_completion_user_date", "user_id", "date"),
        Index("ix_completion_block_date", "block_id", "date"),
    )

    id = Column(String, primary_key=True, default=uid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    block_id = Column(String, ForeignKey("schedule_blocks.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)


class Revision(Base):
    __tablename__ = "revisions"
    __table_args__ = (
        Index("ix_revisions_topic_date", "topic_id", "revision_date"),
        Index("ix_revisions_date", "revision_date"),
    )

    id = Column(String, primary_key=True, default=uid)
    topic_id = Column(String, ForeignKey("topics.id"), index=True)
    revision_date = Column(Date, nullable=False)
    completed = Column(Boolean, default=False)

    topic = relationship("Topic", back_populates="revisions")
