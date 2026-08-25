from datetime import timedelta

from app.models.enums import RecurrencePattern, TaskPriority
from app.schemas import RecurringTaskCreate, TaskCreate
from app.services import recurrence as recurrence_service
from app.services import tasks as tasks_service
from app.utils import local_today


def make_task(session, title="Today test", **overrides):
    return tasks_service.create_task(session, TaskCreate(title=title, **overrides))


def test_today_bundle_includes_due_today(session):
    make_task(session, due_date=local_today())
    bundle = tasks_service.get_today_bundle(session)
    assert len(bundle["due_today"]) == 1


def test_today_bundle_includes_overdue(session):
    make_task(session, due_date=local_today() - timedelta(days=3))
    bundle = tasks_service.get_today_bundle(session)
    assert len(bundle["overdue"]) == 1


def test_today_bundle_includes_explicitly_planned_tasks(session):
    task = make_task(session, due_date=local_today() + timedelta(days=20))
    tasks_service.plan_task_for_today(session, task)
    bundle = tasks_service.get_today_bundle(session)
    assert task.id in {t.id for t in bundle["scheduled"]}


def test_today_bundle_materializes_recurring_tasks(session):
    recurrence_service.create_recurring_task(
        session,
        RecurringTaskCreate(
            title="Daily LeetCode",
            category="LeetCode",
            pattern=RecurrencePattern.daily,
            start_date=local_today(),
        ),
    )
    bundle = tasks_service.get_today_bundle(session)
    assert any(t.title == "Daily LeetCode" for t in bundle["recurring_today"])
    assert any(t.title == "Daily LeetCode" for t in bundle["due_today"])


def test_today_bundle_suggests_high_priority_unscheduled(session):
    make_task(session, priority=TaskPriority.critical)
    make_task(session, priority=TaskPriority.low)
    bundle = tasks_service.get_today_bundle(session)
    assert len(bundle["suggested_high_priority"]) == 1


def test_today_bundle_does_not_duplicate_task_across_sections(session):
    task = make_task(session, due_date=local_today(), priority=TaskPriority.critical)
    tasks_service.plan_task_for_today(session, task)
    bundle = tasks_service.get_today_bundle(session)
    # It's due today AND planned, but must not also show up as "suggested"
    suggested_ids = {t.id for t in bundle["suggested_high_priority"]}
    assert task.id not in suggested_ids


def test_week_summary_counts_completed_tasks(session):
    task = make_task(session, title="finish me")
    tasks_service.complete_task(session, task)
    make_task(session, title="still open")

    start = local_today() - timedelta(days=local_today().weekday())
    summary = tasks_service.get_week_summary(session, start)
    assert summary["completed_count"] == 1
    assert summary["completed_by_category"].get("personal") == 1
