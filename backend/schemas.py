from pydantic import BaseModel


class UserLogin(BaseModel):
    email: str
    password: str


class UserRegister(BaseModel):
    email: str
    password: str


class TopicCreate(BaseModel):
    title: str


class TopicUpdate(BaseModel):
    title: str


class SettingsUpdate(BaseModel):
    intervals: list[int] | None = None
    repeat_interval: int | None = None


class TopicScheduleUpdate(BaseModel):
    intervals: list[int]
    repeat_interval: int
