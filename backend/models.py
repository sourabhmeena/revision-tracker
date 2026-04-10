import json
import uuid

from sqlalchemy import Column, String, Date, Boolean, ForeignKey, Integer
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


class Revision(Base):
    __tablename__ = "revisions"

    id = Column(String, primary_key=True, default=uid)
    topic_id = Column(String, ForeignKey("topics.id"))
    revision_date = Column(Date, nullable=False)
    completed = Column(Boolean, default=False)

    topic = relationship("Topic", back_populates="revisions")
