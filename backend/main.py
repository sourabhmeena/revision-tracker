import json
import os
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy import func, cast, Integer
from sqlalchemy.orm import Session, subqueryload

try:
    from .database import engine, SessionLocal, DATABASE_URL
    from .models import Base, Topic, Revision, User
    from .schemas import TopicCreate, TopicUpdate, UserLogin, UserRegister, SettingsUpdate, TopicScheduleUpdate
    from .scheduler import generate_revisions, extend_revisions, DEFAULT_INTERVALS, DEFAULT_REPEAT
    from .utils import format_date, year_progress
    from .streak_calculator import calculate_streaks, get_next_milestone
except ImportError:
    from database import engine, SessionLocal, DATABASE_URL
    from models import Base, Topic, Revision, User
    from schemas import TopicCreate, TopicUpdate, UserLogin, UserRegister, SettingsUpdate, TopicScheduleUpdate
    from scheduler import generate_revisions, extend_revisions, DEFAULT_INTERVALS, DEFAULT_REPEAT
    from utils import format_date, year_progress
    from streak_calculator import calculate_streaks, get_next_milestone

SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
if not SECRET_KEY:
    import warnings
    warnings.warn("JWT_SECRET_KEY not set – using an insecure dev-only default. "
                   "Set JWT_SECRET_KEY in the environment before deploying to production.")
    SECRET_KEY = "dev-only-insecure-secret-do-not-use-in-production"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
MIN_PASSWORD_LENGTH = 8

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI(title="Revision Planner API")


# ------------------------------------------
# CORS
# ------------------------------------------

allowed_origins = os.environ.get("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------
# Database setup + lightweight migration
# ------------------------------------------

Base.metadata.create_all(bind=engine)

try:
    from sqlalchemy import text

    if DATABASE_URL.startswith("sqlite"):
        with engine.connect() as conn:
            cols = conn.execute(text("PRAGMA table_info(users)")).fetchall()
            col_names = {c[1] for c in cols}

            if cols:
                if "hashed_password" not in col_names:
                    conn.execute(text("ALTER TABLE users ADD COLUMN hashed_password VARCHAR"))
                if "revision_intervals" not in col_names:
                    conn.execute(text("ALTER TABLE users ADD COLUMN revision_intervals VARCHAR"))
                if "repeat_interval" not in col_names:
                    conn.execute(text("ALTER TABLE users ADD COLUMN repeat_interval INTEGER"))

            topic_cols = conn.execute(text("PRAGMA table_info(topics)")).fetchall()
            topic_col_names = {c[1] for c in topic_cols}
            if topic_cols:
                if "revision_intervals" not in topic_col_names:
                    conn.execute(text("ALTER TABLE topics ADD COLUMN revision_intervals VARCHAR"))
                if "repeat_interval" not in topic_col_names:
                    conn.execute(text("ALTER TABLE topics ADD COLUMN repeat_interval INTEGER"))
                if "category" not in topic_col_names:
                    conn.execute(text("ALTER TABLE topics ADD COLUMN category VARCHAR"))
                if "chapter" not in topic_col_names:
                    conn.execute(text("ALTER TABLE topics ADD COLUMN chapter VARCHAR"))
                if "description" not in topic_col_names:
                    conn.execute(text("ALTER TABLE topics ADD COLUMN description VARCHAR"))

            conn.commit()
    else:
        with engine.connect() as conn:
            for col_name in ("category", "chapter", "description"):
                result = conn.execute(text(
                    "SELECT column_name FROM information_schema.columns "
                    f"WHERE table_name='topics' AND column_name='{col_name}'"
                ))
                if not result.fetchone():
                    conn.execute(text(f"ALTER TABLE topics ADD COLUMN {col_name} VARCHAR"))
            conn.commit()
except Exception:
    pass


# ------------------------------------------
# Dependencies
# ------------------------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class RevisionUpdate(BaseModel):
    completed: bool


# ------------------------------------------
# Auth helpers
# ------------------------------------------

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return user_id


def _user_schedule_params(user: User) -> dict:
    """Extract intervals/repeat kwargs for the scheduler from a User row."""
    return {
        "intervals": user.get_intervals(),
        "repeat": user.get_repeat(),
    }


def _topic_schedule_params(topic: Topic, user: User) -> dict:
    """
    Resolve the effective schedule for a topic.
    Priority: topic override > user setting > global default.
    """
    intervals = topic.get_intervals() or user.get_intervals()
    repeat = topic.get_repeat() or user.get_repeat()
    return {"intervals": intervals, "repeat": repeat}


def _effective_schedule(topic: Topic, user: User) -> tuple[list[int], int]:
    """Return the (intervals, repeat) that are effectively active for display."""
    intervals = topic.get_intervals() or user.get_intervals() or DEFAULT_INTERVALS
    repeat = topic.get_repeat() or user.get_repeat()
    if repeat is None:
        repeat = intervals[-1] if intervals else DEFAULT_REPEAT
    return intervals, repeat


# ------------------------------------------
# Authentication
# ------------------------------------------

@app.post("/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    if len(user.password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(status_code=400, detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters")

    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = User(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        created_at=date.today(),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    token = create_access_token(data={"user_id": db_user.id})
    return {"user_id": db_user.id, "token": token}


@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if (
        not db_user
        or not getattr(db_user, "hashed_password", None)
        or not verify_password(user.password, db_user.hashed_password)
    ):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token(data={"user_id": db_user.id})
    return {"user_id": db_user.id, "token": token}


# ------------------------------------------
# Settings (revision intervals)
# ------------------------------------------

@app.get("/settings")
def get_settings(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    intervals = user.get_intervals() or DEFAULT_INTERVALS
    repeat = user.get_repeat()
    if repeat is None:
        repeat = intervals[-1] if intervals else DEFAULT_REPEAT

    return {
        "intervals": intervals,
        "repeat_interval": repeat,
        "is_custom": user.revision_intervals is not None,
        "defaults": {
            "intervals": DEFAULT_INTERVALS,
            "repeat_interval": DEFAULT_REPEAT,
        },
    }


@app.patch("/settings")
def update_settings(payload: SettingsUpdate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.intervals is not None:
        if len(payload.intervals) < 1:
            raise HTTPException(status_code=400, detail="At least one interval is required")
        if any(v < 1 for v in payload.intervals):
            raise HTTPException(status_code=400, detail="All intervals must be at least 1 day")
        user.revision_intervals = json.dumps(payload.intervals)
    else:
        user.revision_intervals = None

    if payload.repeat_interval is not None:
        if payload.repeat_interval < 1:
            raise HTTPException(status_code=400, detail="Repeat interval must be at least 1 day")
        user.repeat_interval = payload.repeat_interval
    else:
        user.repeat_interval = None

    db.commit()
    db.refresh(user)

    intervals = user.get_intervals() or DEFAULT_INTERVALS
    repeat = user.get_repeat()
    if repeat is None:
        repeat = intervals[-1] if intervals else DEFAULT_REPEAT

    return {
        "message": "Settings updated",
        "intervals": intervals,
        "repeat_interval": repeat,
        "is_custom": user.revision_intervals is not None,
    }


@app.post("/settings/reset")
def reset_settings(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.revision_intervals = None
    user.repeat_interval = None
    db.commit()

    return {
        "message": "Settings reset to defaults",
        "intervals": DEFAULT_INTERVALS,
        "repeat_interval": DEFAULT_REPEAT,
        "is_custom": False,
    }


# ------------------------------------------
# Topics
# ------------------------------------------

@app.get("/topics")
def list_topics(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()

    # Single query: topics + aggregated revision counts (no N+1)
    rows = (
        db.query(
            Topic,
            func.count(Revision.id).label("total"),
            func.sum(cast(Revision.completed, Integer)).label("done"),
        )
        .outerjoin(Revision, Revision.topic_id == Topic.id)
        .filter(Topic.user_id == user_id)
        .group_by(Topic.id)
        .order_by(Topic.created_at.desc())
        .all()
    )

    result = []
    for topic, total, done in rows:
        total = total or 0
        done = done or 0
        intervals, repeat = _effective_schedule(topic, user)

        result.append({
            "id": topic.id,
            "title": topic.title,
            "category": topic.category,
            "chapter": topic.chapter,
            "description": topic.description,
            "created_at": topic.created_at.isoformat(),
            "created_at_formatted": format_date(topic.created_at),
            "total_revisions": total,
            "completed_revisions": done,
            "progress_percent": round((done / total * 100) if total > 0 else 0, 1),
            "has_custom_schedule": topic.revision_intervals is not None,
            "intervals": intervals,
            "repeat_interval": repeat,
        })

    return result


def _title_case(s: str | None) -> str | None:
    """Convert to Title Case for consistent display."""
    if not s or not s.strip():
        return None
    return s.strip().title()


@app.post("/topics")
def create_topic(topic: TopicCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()

    existing = (
        db.query(Topic)
        .filter(Topic.user_id == user_id, func.lower(Topic.title) == topic.title.strip().lower())
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="A topic with this name already exists")

    new_topic = Topic(
        user_id=user_id,
        title=topic.title.strip().title(),
        category=_title_case(topic.category),
        chapter=topic.chapter,
        description=topic.description,
        created_at=date.today(),
    )
    db.add(new_topic)
    db.flush()

    params = _topic_schedule_params(new_topic, user) if user else {}
    revision_dates = generate_revisions(new_topic.created_at, years=5, **params)

    for d in revision_dates:
        db.add(Revision(topic_id=new_topic.id, revision_date=d))

    db.commit()

    return {
        "message": "Topic added successfully",
        "topic_id": new_topic.id,
        "revisions_generated": len(revision_dates),
        "period": "5 years",
    }


@app.get("/topics/{topic_id}")
def get_topic(topic_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    topic = db.query(Topic).filter(Topic.id == topic_id, Topic.user_id == user_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    total_revisions = len(topic.revisions)
    completed_revisions = sum(1 for r in topic.revisions if r.completed)

    return {
        "id": topic.id,
        "title": topic.title,
        "category": topic.category,
        "chapter": topic.chapter,
        "description": topic.description,
        "created_at": topic.created_at.isoformat(),
        "created_at_formatted": format_date(topic.created_at),
        "total_revisions": total_revisions,
        "completed_revisions": completed_revisions,
        "revisions": [
            {
                "id": r.id,
                "date": r.revision_date.isoformat(),
                "date_formatted": format_date(r.revision_date),
                "completed": r.completed,
            }
            for r in sorted(topic.revisions, key=lambda x: x.revision_date)
        ],
    }


@app.patch("/topics/{topic_id}")
def update_topic(topic_id: str, topic_update: TopicUpdate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    topic = db.query(Topic).filter(Topic.id == topic_id, Topic.user_id == user_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    if topic_update.title is not None:
        new_title = topic_update.title.strip()
        if new_title.lower() != topic.title.lower():
            dup = (
                db.query(Topic)
                .filter(Topic.user_id == user_id, Topic.id != topic_id, func.lower(Topic.title) == new_title.lower())
                .first()
            )
            if dup:
                raise HTTPException(status_code=400, detail="A topic with this name already exists")
        topic.title = new_title.title()
    if topic_update.category is not None:
        topic.category = _title_case(topic_update.category)
    if topic_update.chapter is not None:
        topic.chapter = topic_update.chapter if topic_update.chapter != "" else None
    if topic_update.description is not None:
        topic.description = topic_update.description if topic_update.description != "" else None
    db.commit()
    db.refresh(topic)

    return {
        "message": "Topic updated successfully",
        "topic": {
            "id": topic.id,
            "title": topic.title,
            "category": topic.category,
            "chapter": topic.chapter,
            "description": topic.description,
        },
    }


@app.post("/topics/{topic_id}/extend-revisions")
def extend_topic_revisions(topic_id: str, years: int = 1, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    topic = db.query(Topic).filter(Topic.id == topic_id, Topic.user_id == user_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    user = db.query(User).filter(User.id == user_id).first()
    params = _topic_schedule_params(topic, user) if user else {}

    existing_count = len(topic.revisions)
    new_dates = extend_revisions(topic.created_at, existing_count, years, **params)

    added_count = 0
    for d in new_dates:
        exists = db.query(Revision).filter(Revision.topic_id == topic_id, Revision.revision_date == d).first()
        if not exists:
            db.add(Revision(topic_id=topic_id, revision_date=d))
            added_count += 1

    db.commit()

    return {
        "message": f"Extended revisions by {years} year(s)",
        "revisions_added": added_count,
        "total_revisions": existing_count + added_count,
    }


@app.delete("/topics/{topic_id}")
def delete_topic(topic_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    topic = db.query(Topic).filter(Topic.id == topic_id, Topic.user_id == user_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    db.query(Revision).filter(Revision.topic_id == topic_id).delete()
    db.delete(topic)
    db.commit()

    return {"message": "Topic deleted successfully"}


# ------------------------------------------
# Topic schedule override
# ------------------------------------------

@app.get("/topics/{topic_id}/schedule")
def get_topic_schedule(topic_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    topic = db.query(Topic).filter(Topic.id == topic_id, Topic.user_id == user_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    user = db.query(User).filter(User.id == user_id).first()
    intervals, repeat = _effective_schedule(topic, user)

    return {
        "topic_id": topic_id,
        "intervals": intervals,
        "repeat_interval": repeat,
        "has_custom_schedule": topic.revision_intervals is not None,
    }


@app.patch("/topics/{topic_id}/schedule")
def update_topic_schedule(
    topic_id: str,
    payload: TopicScheduleUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    Reschedule a single topic.  Keeps all completed revisions intact,
    removes uncompleted ones, and regenerates from the new intervals.
    """
    topic = db.query(Topic).filter(Topic.id == topic_id, Topic.user_id == user_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    if len(payload.intervals) < 1:
        raise HTTPException(status_code=400, detail="At least one interval is required")
    if any(v < 1 for v in payload.intervals):
        raise HTTPException(status_code=400, detail="All intervals must be at least 1 day")
    if payload.repeat_interval < 1:
        raise HTTPException(status_code=400, detail="Repeat interval must be at least 1 day")

    # Only store as a per-topic override if it actually differs from
    # what the topic would inherit (user setting → global default).
    user = db.query(User).filter(User.id == user_id).first()
    inherited_intervals = (user.get_intervals() if user else None) or DEFAULT_INTERVALS
    inherited_repeat = (user.get_repeat() if user else None)
    if inherited_repeat is None:
        inherited_repeat = inherited_intervals[-1] if inherited_intervals else DEFAULT_REPEAT

    is_same_as_inherited = (
        payload.intervals == inherited_intervals
        and payload.repeat_interval == inherited_repeat
    )

    if is_same_as_inherited:
        topic.revision_intervals = None
        topic.repeat_interval = None
    else:
        topic.revision_intervals = json.dumps(payload.intervals)
        topic.repeat_interval = payload.repeat_interval

    # Collect dates that have completed revisions (we keep these)
    completed_dates = set()
    for r in topic.revisions:
        if r.completed:
            completed_dates.add(r.revision_date)

    # Delete all uncompleted revisions
    db.query(Revision).filter(
        Revision.topic_id == topic_id,
        Revision.completed == False,  # noqa: E712
    ).delete(synchronize_session="fetch")

    # Generate the full new schedule
    new_dates = generate_revisions(
        topic.created_at,
        years=5,
        intervals=payload.intervals,
        repeat=payload.repeat_interval,
    )

    added = 0
    for d in new_dates:
        if d in completed_dates:
            continue
        exists = (
            db.query(Revision)
            .filter(Revision.topic_id == topic_id, Revision.revision_date == d)
            .first()
        )
        if not exists:
            db.add(Revision(topic_id=topic_id, revision_date=d))
            added += 1

    db.commit()

    total = len(topic.revisions)
    completed = sum(1 for r in topic.revisions if r.completed)

    return {
        "message": "Schedule updated",
        "topic_id": topic_id,
        "intervals": payload.intervals,
        "repeat_interval": payload.repeat_interval,
        "completed_kept": len(completed_dates),
        "new_revisions_added": added,
        "total_revisions": total,
        "completed_revisions": completed,
    }


@app.post("/topics/{topic_id}/schedule/reset")
def reset_topic_schedule(topic_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    """Remove the per-topic override so it falls back to user/global defaults."""
    topic = db.query(Topic).filter(Topic.id == topic_id, Topic.user_id == user_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    topic.revision_intervals = None
    topic.repeat_interval = None
    db.commit()

    user = db.query(User).filter(User.id == user_id).first()
    intervals, repeat = _effective_schedule(topic, user)

    return {
        "message": "Topic schedule reset to defaults",
        "intervals": intervals,
        "repeat_interval": repeat,
        "has_custom_schedule": False,
    }


# ------------------------------------------
# Revisions
# ------------------------------------------

@app.get("/revisions")
def list_revision_summary(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    # Single GROUP BY query instead of loading all rows into Python
    rows = (
        db.query(
            Revision.revision_date,
            func.count(Revision.id).label("total"),
            func.sum(cast(Revision.completed, Integer)).label("done"),
        )
        .join(Revision.topic)
        .filter(Topic.user_id == user_id)
        .group_by(Revision.revision_date)
        .order_by(Revision.revision_date.asc())
        .all()
    )

    return [
        {
            "iso_date": row.revision_date.isoformat(),
            "date": format_date(row.revision_date),
            "done": row.done or 0,
            "total": row.total or 0,
            "progress_percent": year_progress(row.revision_date),
        }
        for row in rows
    ]


@app.get("/revision-date/{iso_date}")
def revision_detail(iso_date: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    dt = date.fromisoformat(iso_date)

    revisions = (
        db.query(Revision)
        .join(Revision.topic)
        .options(subqueryload(Revision.topic))
        .filter(Revision.revision_date == dt, Topic.user_id == user_id)
        .all()
    )

    topics = []
    for r in revisions:
        topics.append({
            "revision_id": r.id,
            "topic_id": r.topic.id,
            "title": r.topic.title,
            "category": r.topic.category,
            "chapter": r.topic.chapter,
            "description": r.topic.description,
            "completed": r.completed,
        })

    return {
        "iso_date": iso_date,
        "date": format_date(dt),
        "topics": topics,
    }


@app.patch("/revision/{revision_id}")
def update_revision(revision_id: str, payload: RevisionUpdate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    revision = (
        db.query(Revision)
        .join(Revision.topic)
        .filter(Revision.id == revision_id, Topic.user_id == user_id)
        .first()
    )
    if not revision:
        raise HTTPException(status_code=404, detail="Revision not found")

    revision.completed = payload.completed
    db.commit()
    db.refresh(revision)

    return {
        "success": True,
        "revision_id": revision_id,
        "completed": revision.completed,
    }


# ------------------------------------------
# Streaks
# ------------------------------------------

@app.get("/streaks")
def get_streaks(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    streak_data = calculate_streaks(db, user_id)
    milestone_data = get_next_milestone(streak_data["current_streak"])

    return {
        "current_streak": streak_data["current_streak"],
        "longest_streak": streak_data["longest_streak"],
        "next_milestone": {
            "target": milestone_data["next_milestone"],
            "progress": milestone_data["progress"],
            "days_remaining": milestone_data["days_remaining"],
        },
        "streak_dates": streak_data["streak_dates"],
    }
