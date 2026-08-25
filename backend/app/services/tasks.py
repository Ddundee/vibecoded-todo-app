from datetime import date, datetime, timedelta
from typing import List, Optional, Sequence

from sqlmodel import Session, or_, select

from app.models.enums import TaskPriority, TaskStatus
from app.models.recruiting import RecruitingDetail
from app.models.task import Task
from app.schemas import RecruitingDetailIn, TaskCreate, TaskRead, TaskUpdate
from app.services import recurrence as recurrence_service
from app.services.oa import compute_oa_urgency, days_remaining
from app.services.priority import compute_priority
from app.utils import utcnow

ACTIVE_STATUSES = (
    TaskStatus.inbox,
    TaskStatus.todo,
    TaskStatus.in_progress,
    TaskStatus.blocked,
)


def _touch(task: Task) -> None:
    task.updated_at = utcnow()


def _upsert_recruiting(session: Session, task: Task, data: RecruitingDetailIn) -> None:
    detail = task.recruiting_detail
    if detail is None:
        detail = RecruitingDetail(task_id=task.id)
        session.add(detail)

    for field_name, value in data.model_dump(exclude_unset=True).items():
        setattr(detail, field_name, value)

    task.recruiting_detail = detail


def create_task(session: Session, data: TaskCreate) -> Task:
    task = Task(
        title=data.title,
        description=data.description,
        status=data.status,
        priority=data.priority,
        category=data.category,
        tags=data.tags,
        due_date=data.due_date,
        due_time=data.due_time,
        estimated_duration=data.estimated_duration,
        source=data.source,
        external_reference=data.external_reference,
        notes=data.notes,
        planned_for_date=data.planned_for_date,
    )
    session.add(task)
    session.flush()

    if data.recruiting is not None:
        _upsert_recruiting(session, task, data.recruiting)

    session.commit()
    session.refresh(task)
    return task


def get_task(session: Session, task_id: str) -> Optional[Task]:
    return session.get(Task, task_id)


def list_tasks(
    session: Session,
    *,
    status: Optional[TaskStatus] = None,
    statuses: Optional[Sequence[TaskStatus]] = None,
    category: Optional[str] = None,
    priority: Optional[TaskPriority] = None,
    tag: Optional[str] = None,
    due_before: Optional[date] = None,
    due_after: Optional[date] = None,
    planned_for_date: Optional[date] = None,
    include_completed: bool = True,
) -> List[Task]:
    query = select(Task)

    if status is not None:
        query = query.where(Task.status == status)
    elif statuses is not None:
        query = query.where(Task.status.in_(statuses))
    elif not include_completed:
        query = query.where(Task.status.in_(ACTIVE_STATUSES))

    if category is not None:
        query = query.where(Task.category == category)
    if priority is not None:
        query = query.where(Task.priority == priority)
    if due_before is not None:
        query = query.where(Task.due_date <= due_before)
    if due_after is not None:
        query = query.where(Task.due_date >= due_after)
    if planned_for_date is not None:
        query = query.where(Task.planned_for_date == planned_for_date)

    query = query.order_by(Task.due_date.is_(None), Task.due_date, Task.created_at)
    tasks = list(session.exec(query).all())

    if tag is not None:
        tasks = [t for t in tasks if tag in (t.tags or [])]

    return tasks


def search_tasks(session: Session, query_text: str) -> List[Task]:
    like = f"%{query_text}%"
    stmt = select(Task).where(
        or_(
            Task.title.ilike(like),
            Task.description.ilike(like),
            Task.notes.ilike(like),
        )
    )
    return list(session.exec(stmt).all())


def update_task(session: Session, task: Task, data: TaskUpdate) -> Task:
    updates = data.model_dump(exclude_unset=True, exclude={"recruiting"})
    for field_name, value in updates.items():
        setattr(task, field_name, value)
    _touch(task)

    if data.recruiting is not None:
        _upsert_recruiting(session, task, data.recruiting)

    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def complete_task(session: Session, task: Task) -> Task:
    task.status = TaskStatus.completed
    task.completed_at = utcnow()
    _touch(task)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def cancel_task(session: Session, task: Task) -> Task:
    task.status = TaskStatus.cancelled
    _touch(task)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def reschedule_task(
    session: Session,
    task: Task,
    due_date: Optional[date],
    due_time: Optional[object] = None,
) -> Task:
    task.due_date = due_date
    if due_time is not None:
        task.due_time = due_time
    _touch(task)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def set_priority(session: Session, task: Task, priority: TaskPriority) -> Task:
    task.priority = priority
    _touch(task)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def add_note(session: Session, task: Task, note: str) -> Task:
    stamp = utcnow().strftime("%Y-%m-%d %H:%M UTC")
    entry = f"[{stamp}] {note}"
    task.notes = f"{task.notes}\n{entry}" if task.notes else entry
    _touch(task)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def plan_task_for_today(session: Session, task: Task, for_date: Optional[date] = None) -> Task:
    task.planned_for_date = for_date or date.today()
    _touch(task)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def remove_task_from_today(session: Session, task: Task) -> Task:
    task.planned_for_date = None
    _touch(task)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def carry_unfinished_forward(
    session: Session,
    from_date: date,
    to_date: date,
    priorities: Optional[Sequence[TaskPriority]] = None,
) -> List[Task]:
    query = select(Task).where(
        Task.planned_for_date == from_date,
        Task.status.in_(ACTIVE_STATUSES),
    )
    if priorities:
        query = query.where(Task.priority.in_(priorities))

    tasks = list(session.exec(query).all())
    for task in tasks:
        task.planned_for_date = to_date
        if task.due_date == from_date:
            task.due_date = to_date
        _touch(task)
        session.add(task)

    if tasks:
        session.commit()
        for task in tasks:
            session.refresh(task)

    return tasks


def get_overdue(session: Session, today: Optional[date] = None) -> List[Task]:
    today = today or date.today()
    query = (
        select(Task)
        .where(Task.due_date < today, Task.status.in_(ACTIVE_STATUSES))
        .order_by(Task.due_date)
    )
    return list(session.exec(query).all())


def get_upcoming(session: Session, today: Optional[date] = None, days: int = 7) -> List[Task]:
    today = today or date.today()
    end = today + timedelta(days=days)
    query = (
        select(Task)
        .where(
            Task.due_date >= today,
            Task.due_date <= end,
            Task.status.in_(ACTIVE_STATUSES),
        )
        .order_by(Task.due_date)
    )
    return list(session.exec(query).all())


def get_today_bundle(session: Session, today: Optional[date] = None) -> dict:
    today = today or date.today()

    # Materialize any recurring tasks due to fire today before assembling
    # the view, so they show up immediately without a separate cron job.
    recurrence_service.ensure_occurrences_for_date(session, today)

    scheduled = list(
        session.exec(
            select(Task).where(
                Task.planned_for_date == today, Task.status.in_(ACTIVE_STATUSES)
            )
        ).all()
    )
    due_today = list(
        session.exec(
            select(Task).where(
                Task.due_date == today, Task.status.in_(ACTIVE_STATUSES)
            )
        ).all()
    )
    overdue = get_overdue(session, today)
    recurring_today = [t for t in due_today if t.recurrence_rule_id is not None]

    already_shown = {t.id for t in scheduled} | {t.id for t in due_today} | {
        t.id for t in overdue
    }
    high_priority_unscheduled = list(
        session.exec(
            select(Task).where(
                Task.status.in_(ACTIVE_STATUSES),
                Task.priority.in_([TaskPriority.critical, TaskPriority.high]),
                Task.due_date.is_(None),
                Task.planned_for_date.is_(None),
            )
        ).all()
    )
    high_priority_unscheduled = [
        t for t in high_priority_unscheduled if t.id not in already_shown
    ][:5]

    return {
        "date": today,
        "scheduled": scheduled,
        "due_today": due_today,
        "overdue": overdue,
        "recurring_today": recurring_today,
        "suggested_high_priority": high_priority_unscheduled,
    }


def get_week_summary(session: Session, start_date: Optional[date] = None) -> dict:
    start_date = start_date or (date.today() - timedelta(days=date.today().weekday()))
    end_date = start_date + timedelta(days=6)

    completed = list(
        session.exec(
            select(Task).where(
                Task.status == TaskStatus.completed,
                Task.completed_at >= datetime.combine(start_date, datetime.min.time()),
                Task.completed_at
                <= datetime.combine(end_date, datetime.max.time()),
            )
        ).all()
    )
    created = list(
        session.exec(
            select(Task).where(
                Task.created_at >= datetime.combine(start_date, datetime.min.time()),
                Task.created_at <= datetime.combine(end_date, datetime.max.time()),
            )
        ).all()
    )
    overdue = get_overdue(session, end_date)

    by_category: dict = {}
    for task in completed:
        by_category[task.category] = by_category.get(task.category, 0) + 1

    return {
        "start_date": start_date,
        "end_date": end_date,
        "completed_count": len(completed),
        "completed_by_category": by_category,
        "created_count": len(created),
        "overdue_count": len(overdue),
        "completed_tasks": completed,
    }


def serialize_task(task: Task, today: Optional[date] = None) -> TaskRead:
    today = today or date.today()
    priority_result = compute_priority(task, today)

    is_overdue = (
        task.due_date is not None
        and task.due_date < today
        and task.status not in (TaskStatus.completed, TaskStatus.cancelled)
    )

    oa_urgency = None
    oa_days = None
    if task.recruiting_detail and task.recruiting_detail.oa_deadline:
        oa_urgency = compute_oa_urgency(
            task.recruiting_detail.oa_deadline,
            today,
            completed=task.status == TaskStatus.completed,
        )
        oa_days = days_remaining(task.recruiting_detail.oa_deadline, today)

    recruiting_read = None
    if task.recruiting_detail:
        d = task.recruiting_detail
        recruiting_read = {
            "id": d.id,
            "task_id": d.task_id,
            "company": d.company,
            "position": d.position,
            "application_url": d.application_url,
            "application_status": d.application_status,
            "applied_date": d.applied_date,
            "recruiter": d.recruiter,
            "oa_received_date": d.oa_received_date,
            "oa_deadline": d.oa_deadline,
            "interview_date": d.interview_date,
            "interview_stage": d.interview_stage,
            "prep_notes": d.prep_notes,
        }

    return TaskRead(
        id=task.id,
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        category=task.category,
        tags=task.tags or [],
        created_at=task.created_at,
        updated_at=task.updated_at,
        due_date=task.due_date,
        due_time=task.due_time,
        completed_at=task.completed_at,
        estimated_duration=task.estimated_duration,
        source=task.source,
        external_reference=task.external_reference,
        notes=task.notes,
        planned_for_date=task.planned_for_date,
        recurrence_rule_id=task.recurrence_rule_id,
        occurrence_date=task.occurrence_date,
        is_overdue=is_overdue,
        priority_score=priority_result.score,
        priority_reasons=priority_result.reasons,
        oa_urgency=oa_urgency,
        oa_days_remaining=oa_days,
        recruiting=recruiting_read,
    )
