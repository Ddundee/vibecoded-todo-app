from datetime import timedelta

from app.models.enums import TaskPriority, TaskStatus
from app.schemas import TaskCreate
from app.services import tasks as tasks_service
from app.services.priority import compute_priority, rank_tasks
from app.utils import local_today


def make_task(session, **overrides):
    payload = TaskCreate(title="Priority test", **overrides)
    return tasks_service.create_task(session, payload)


def test_higher_manual_priority_scores_higher(session):
    low = make_task(session, priority=TaskPriority.low)
    critical = make_task(session, priority=TaskPriority.critical)

    today = local_today()
    assert compute_priority(critical, today).score > compute_priority(low, today).score


def test_overdue_task_scores_higher_than_same_priority_not_due(session):
    today = local_today()
    overdue = make_task(session, priority=TaskPriority.medium, due_date=today - timedelta(days=2))
    no_due = make_task(session, priority=TaskPriority.medium)

    assert compute_priority(overdue, today).score > compute_priority(no_due, today).score


def test_planned_for_today_adds_score(session):
    today = local_today()
    task = make_task(session, priority=TaskPriority.medium)
    baseline = compute_priority(task, today).score

    planned = tasks_service.plan_task_for_today(session, task, today)
    boosted = compute_priority(planned, today).score

    assert boosted > baseline


def test_manual_priority_field_is_never_overwritten_by_scoring(session):
    task = make_task(session, priority=TaskPriority.low, due_date=local_today() - timedelta(days=5))
    compute_priority(task, local_today())
    assert task.priority == TaskPriority.low  # scoring must not mutate the stored priority


def test_rank_tasks_orders_descending_by_score(session):
    today = local_today()
    low = make_task(session, priority=TaskPriority.low)
    high_overdue = make_task(
        session, priority=TaskPriority.high, due_date=today - timedelta(days=3)
    )
    medium = make_task(session, priority=TaskPriority.medium)

    ranked = rank_tasks([low, high_overdue, medium], today)
    ordered_ids = [t.id for t, _ in ranked]
    assert ordered_ids[0] == high_overdue.id
    assert ordered_ids[-1] == low.id


def test_blocked_status_reduces_score(session):
    today = local_today()
    todo_task = make_task(session, priority=TaskPriority.medium, status=TaskStatus.todo)
    blocked_task = make_task(session, priority=TaskPriority.medium, status=TaskStatus.blocked)

    assert compute_priority(blocked_task, today).score < compute_priority(todo_task, today).score


def test_priority_result_includes_human_readable_reasons(session):
    today = local_today()
    task = make_task(session, priority=TaskPriority.critical, due_date=today)
    result = compute_priority(task, today)
    assert len(result.reasons) >= 2
    assert any("critical" in r for r in result.reasons)
    assert any("today" in r.lower() for r in result.reasons)
