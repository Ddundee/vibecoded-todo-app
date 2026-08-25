from datetime import date, datetime, time
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.enums import (
    ApplicationStatus,
    OAUrgency,
    RecurrencePattern,
    TaskPriority,
    TaskStatus,
)


# ---------------------------------------------------------------------------
# Recruiting
# ---------------------------------------------------------------------------


class RecruitingDetailIn(BaseModel):
    company: Optional[str] = None
    position: Optional[str] = None
    application_url: Optional[str] = None
    application_status: Optional[ApplicationStatus] = None
    applied_date: Optional[date] = None
    recruiter: Optional[str] = None
    oa_received_date: Optional[date] = None
    oa_deadline: Optional[date] = None
    interview_date: Optional[date] = None
    interview_stage: Optional[str] = None
    prep_notes: Optional[str] = None


class RecruitingDetailRead(RecruitingDetailIn):
    id: str
    task_id: str
    application_status: ApplicationStatus


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
    recruiting: Optional[RecruitingDetailIn] = None


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
    recruiting: Optional[RecruitingDetailIn] = None


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
    oa_urgency: Optional[OAUrgency] = None
    oa_days_remaining: Optional[int] = None
    recruiting: Optional[RecruitingDetailRead] = None


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
# Internship application convenience payload
# ---------------------------------------------------------------------------


class InternshipApplicationCreate(BaseModel):
    company: str
    position: Optional[str] = None
    application_url: Optional[str] = None
    application_status: ApplicationStatus = ApplicationStatus.planning_to_apply
    applied_date: Optional[date] = None
    recruiter: Optional[str] = None
    due_date: Optional[date] = None
    priority: TaskPriority = TaskPriority.medium
    notes: Optional[str] = None


class OACreate(BaseModel):
    company: str
    oa_name: Optional[str] = None
    received_date: Optional[date] = None
    deadline: Optional[date] = None
    priority: TaskPriority = TaskPriority.high
    prep_notes: Optional[str] = None
    estimated_duration: Optional[int] = None


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


class OADeadlineItem(BaseModel):
    task: TaskRead
    company: Optional[str]
    oa_name: str
    received_date: Optional[date]
    deadline: Optional[date]
    days_remaining: Optional[int]
    urgency: OAUrgency
    completed: bool


class RecruitingPipelineStage(BaseModel):
    status: ApplicationStatus
    count: int
    tasks: List[TaskRead]


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
