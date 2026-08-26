"""Optional demo data, only inserted when SEED_DEMO_DATA=true and the tasks
table is empty. Meant to give a fresh install something to look at."""

from datetime import timedelta

from sqlmodel import Session, select

from app.models.enums import RecurrencePattern, TaskPriority, TaskStatus
from app.models.task import Task
from app.schemas import RecurringTaskCreate, TaskCreate
from app.services import recurrence as recurrence_service
from app.services import tasks as tasks_service
from app.utils import local_today


def seed_demo_data(session: Session) -> None:
    existing = session.exec(select(Task)).first()
    if existing is not None:
        return

    today = local_today()

    tasks_service.create_task(
        session,
        TaskCreate(
            title="Finish problem set 3",
            category="school",
            status=TaskStatus.todo,
            priority=TaskPriority.high,
            due_date=today + timedelta(days=3),
        ),
    )
    tasks_service.create_task(
        session,
        TaskCreate(
            title="Set up the project's CI pipeline",
            category="project",
            status=TaskStatus.todo,
            priority=TaskPriority.medium,
            estimated_duration=60,
        ),
    )
    recurrence_service.create_recurring_task(
        session,
        RecurringTaskCreate(
            title="Solve 1-2 LeetCode problems",
            category="LeetCode",
            priority=TaskPriority.medium,
            pattern=RecurrencePattern.daily,
            start_date=today,
        ),
    )
    recurrence_service.create_recurring_task(
        session,
        RecurringTaskCreate(
            title="Grocery shopping",
            category="errands",
            priority=TaskPriority.low,
            pattern=RecurrencePattern.specific_days,
            days_of_week=[6],  # Sunday
            start_date=today,
        ),
    )
