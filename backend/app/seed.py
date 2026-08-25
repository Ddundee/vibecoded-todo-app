"""Optional demo data, only inserted when SEED_DEMO_DATA=true and the tasks
table is empty. Meant to give a fresh install something to look at."""

from datetime import date, timedelta

from sqlmodel import Session, select

from app.models.enums import RecurrencePattern, TaskPriority
from app.models.task import Task
from app.schemas import InternshipApplicationCreate, OACreate, RecurringTaskCreate
from app.services import recruiting as recruiting_service
from app.services import recurrence as recurrence_service


def seed_demo_data(session: Session) -> None:
    existing = session.exec(select(Task)).first()
    if existing is not None:
        return

    today = date.today()

    recruiting_service.create_oa(
        session,
        OACreate(
            company="Roblox",
            oa_name="Software Engineer OA",
            received_date=today,
            deadline=today + timedelta(days=3),
            priority=TaskPriority.high,
            prep_notes="Review arrays/strings, 2 questions, 90 minutes.",
        ),
    )
    recruiting_service.create_internship_application(
        session,
        InternshipApplicationCreate(
            company="Akuna Capital",
            position="Quant Dev Intern",
            due_date=today + timedelta(days=7),
            priority=TaskPriority.medium,
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
            title="Apply to 20 internships",
            category="internship",
            priority=TaskPriority.high,
            pattern=RecurrencePattern.weekdays,
            start_date=today,
        ),
    )
