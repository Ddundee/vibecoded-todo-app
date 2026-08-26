from datetime import date, datetime, time
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.enums import RecurrencePattern, TaskPriority, TaskStatus


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.inbox
    priority: TaskPriority = TaskPriority.medium
    category: str = "personal"
    tags: List[str] = Field(default_factory=list)
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    estimated_duration: Optional[int] = None
    source: str = "manual"
    external_reference: Optional[str] = None
    notes: Optional[str] = None
    planned_for_date: Optional[date] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    estimated_duration: Optional[int] = None
    external_reference: Optional[str] = None
    notes: Optional[str] = None
    planned_for_date: Optional[date] = None


class TaskRead(BaseModel):
    id: str
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    category: str
    tags: List[str]
    created_at: datetime
    updated_at: datetime
    due_date: Optional[date]
    due_time: Optional[time]
    completed_at: Optional[datetime]
    estimated_duration: Optional[int]
    source: str
    external_reference: Optional[str]
    notes: Optional[str]
    planned_for_date: Optional[date]
    recurrence_rule_id: Optional[str]
    occurrence_date: Optional[date]

    is_overdue: bool = False
    priority_score: float = 0.0
    priority_reasons: List[str] = Field(default_factory=list)


class TaskListResponse(BaseModel):
    tasks: List[TaskRead]
    count: int


# ---------------------------------------------------------------------------
# Recurrence
# ---------------------------------------------------------------------------


class RecurringTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "personal"
    priority: TaskPriority = TaskPriority.medium
    estimated_duration: Optional[int] = None
    tags: List[str] = Field(default_factory=list)

    pattern: RecurrencePattern
    days_of_week: Optional[List[int]] = None
    interval_days: Optional[int] = None
    day_of_month: Optional[int] = None

    start_date: date
    end_date: Optional[date] = None


class RecurrenceRuleRead(BaseModel):
    id: str
    title: str
    description: Optional[str]
    category: str
    priority: TaskPriority
    estimated_duration: Optional[int]
    tags: List[str]
    pattern: RecurrencePattern
    days_of_week: Optional[List[int]]
    interval_days: Optional[int]
    day_of_month: Optional[int]
    start_date: date
    end_date: Optional[date]
    active: bool
    created_at: datetime


# ---------------------------------------------------------------------------
# Composite views
# ---------------------------------------------------------------------------


class TodayView(BaseModel):
    date: date
    scheduled: List[TaskRead]
    due_today: List[TaskRead]
    overdue: List[TaskRead]
    recurring_today: List[TaskRead]
    suggested_high_priority: List[TaskRead]


class WeekSummary(BaseModel):
    start_date: date
    end_date: date
    completed_count: int
    completed_by_category: dict
    created_count: int
    overdue_count: int
    completed_tasks: List[TaskRead]


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


class LoginRequest(BaseModel):
    username: str
    password: str
