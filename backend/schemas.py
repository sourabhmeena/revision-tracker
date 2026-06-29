from pydantic import BaseModel


class UserLogin(BaseModel):
    email: str
    password: str


class UserRegister(BaseModel):
    email: str
    password: str


class TopicCreate(BaseModel):
    title: str
    category: str | None = None
    chapter: str | None = None
    description: str | None = None


class TopicUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    chapter: str | None = None
    description: str | None = None


class SettingsUpdate(BaseModel):
    intervals: list[int] | None = None
    repeat_interval: int | None = None


class TopicScheduleUpdate(BaseModel):
    intervals: list[int]
    repeat_interval: int


class ScheduleBlockCreate(BaseModel):
    weekday: int            # 0=Mon … 6=Sun
    start_time: str         # "HH:MM"
    end_time: str           # "HH:MM"
    title: str
    description: str | None = None
    color: str | None = None


class ScheduleBlockUpdate(BaseModel):
    weekday: int | None = None
    start_time: str | None = None
    end_time: str | None = None
    title: str | None = None
    description: str | None = None
    color: str | None = None


class ScheduleCopy(BaseModel):
    source: int             # weekday to copy from
    targets: list[int]      # weekdays to copy onto
    replace: bool = True    # clear target days first (vs. append)


class CompletionToggle(BaseModel):
    block_id: str
    date: str               # ISO calendar date "YYYY-MM-DD"
    completed: bool
