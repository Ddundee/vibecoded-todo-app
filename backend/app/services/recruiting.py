from collections import OrderedDict
from datetime import date
from typing import List, Optional

from sqlmodel import Session, select

from app.models.enums import ApplicationStatus, TaskStatus
from app.models.recruiting import RecruitingDetail
from app.models.task import Task
from app.schemas import InternshipApplicationCreate, OACreate
from app.services.oa import compute_oa_urgency, days_remaining
from app.services.tasks import ACTIVE_STATUSES
from app.utils import local_today


def create_internship_application(session: Session, data: InternshipApplicationCreate) -> Task:
    task = Task(
        title=f"{data.company} - {data.position}" if data.position else data.company,
        category="internship",
        priority=data.priority,
        status=TaskStatus.todo,
        due_date=data.due_date,
        notes=data.notes,
        source="manual",
    )
    session.add(task)
    session.flush()

    detail = RecruitingDetail(
        task_id=task.id,
        company=data.company,
        position=data.position,
        application_url=data.application_url,
        application_status=data.application_status,
        applied_date=data.applied_date,
        recruiter=data.recruiter,
    )
    session.add(detail)
    session.commit()
    session.refresh(task)
    return task


def create_oa(session: Session, data: OACreate) -> Task:
    oa_name = data.oa_name or f"{data.company} OA"
    task = Task(
        title=f"{data.company}: {oa_name}",
        category="OA",
        priority=data.priority,
        status=TaskStatus.todo,
        due_date=data.deadline,
        estimated_duration=data.estimated_duration,
        source="manual",
    )
    session.add(task)
    session.flush()

    detail = RecruitingDetail(
        task_id=task.id,
        company=data.company,
        application_status=ApplicationStatus.oa,
        oa_received_date=data.received_date,
        oa_deadline=data.deadline,
        prep_notes=data.prep_notes,
    )
    session.add(detail)
    session.commit()
    session.refresh(task)
    return task


def get_oa_tasks(session: Session) -> List[Task]:
    query = (
        select(Task)
        .join(RecruitingDetail, RecruitingDetail.task_id == Task.id)
        .where(RecruitingDetail.oa_deadline.is_not(None))
        .order_by(RecruitingDetail.oa_deadline)
    )
    return list(session.exec(query).all())


def get_oa_deadlines(session: Session, today: Optional[date] = None) -> List[dict]:
    today = today or local_today()
    tasks = get_oa_tasks(session)
    items = []
    for task in tasks:
        detail = task.recruiting_detail
        completed = task.status == TaskStatus.completed
        urgency = compute_oa_urgency(detail.oa_deadline, today, completed=completed)
        items.append(
            {
                "task": task,
                "company": detail.company,
                "oa_name": task.title,
                "received_date": detail.oa_received_date,
                "deadline": detail.oa_deadline,
                "days_remaining": days_remaining(detail.oa_deadline, today),
                "urgency": urgency,
                "completed": completed,
            }
        )
    return items


def get_recruiting_pipeline(session: Session) -> List[dict]:
    query = select(Task).join(RecruitingDetail, RecruitingDetail.task_id == Task.id)
    tasks = list(session.exec(query).all())

    order = list(ApplicationStatus)
    grouped: "OrderedDict[ApplicationStatus, list]" = OrderedDict((s, []) for s in order)
    for task in tasks:
        status = task.recruiting_detail.application_status
        grouped.setdefault(status, []).append(task)

    return [
        {"status": status, "count": len(items), "tasks": items}
        for status, items in grouped.items()
        if items or status in order
    ]


def get_urgent_recruiting_tasks(session: Session, today: Optional[date] = None) -> List[Task]:
    """Internship-related tasks (any recruiting category) that are still
    open, ordered so the most time-pressured ones come first."""
    today = today or local_today()
    query = (
        select(Task)
        .where(
            Task.category.in_(["internship", "OA", "interview"]),
            Task.status.in_(ACTIVE_STATUSES),
        )
        .order_by(Task.due_date.is_(None), Task.due_date)
    )
    return list(session.exec(query).all())
