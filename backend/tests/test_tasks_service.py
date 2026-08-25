from datetime import timedelta

from app.models.enums import TaskPriority, TaskStatus
from app.schemas import TaskCreate, TaskUpdate
from app.services import tasks as tasks_service
from app.utils import local_today


def make_task(session, title="Test task", **overrides):
    payload = TaskCreate(title=title, **overrides)
    return tasks_service.create_task(session, payload)


def test_create_task_defaults_to_inbox(session):
    task = make_task(session)
    assert task.status == TaskStatus.inbox
    assert task.priority == TaskPriority.medium
    assert task.category == "personal"
    assert task.id is not None


def test_create_task_with_recruiting_detail(session):
    from app.schemas import RecruitingDetailIn

    task = make_task(
        session,
        category="OA",
        recruiting=RecruitingDetailIn(company="Roblox", oa_deadline=local_today()),
    )
    assert task.recruiting_detail is not None
    assert task.recruiting_detail.company == "Roblox"


def test_update_task_partial_fields_only(session):
    task = make_task(session, description="original")
    updated = tasks_service.update_task(session, task, TaskUpdate(title="New title"))
    assert updated.title == "New title"
    assert updated.description == "original"  # untouched


def test_complete_task_sets_status_and_timestamp(session):
    task = make_task(session)
    assert task.completed_at is None
    completed = tasks_service.complete_task(session, task)
    assert completed.status == TaskStatus.completed
    assert completed.completed_at is not None


def test_cancel_task(session):
    task = make_task(session)
    cancelled = tasks_service.cancel_task(session, task)
    assert cancelled.status == TaskStatus.cancelled


def test_reschedule_task_changes_due_date(session):
    task = make_task(session, due_date=local_today())
    new_date = local_today() + timedelta(days=5)
    rescheduled = tasks_service.reschedule_task(session, task, new_date)
    assert rescheduled.due_date == new_date


def test_set_priority_never_touches_other_fields(session):
    task = make_task(session, title="Keep me")
    updated = tasks_service.set_priority(session, task, TaskPriority.critical)
    assert updated.priority == TaskPriority.critical
    assert updated.title == "Keep me"


def test_add_note_appends_with_timestamp(session):
    task = make_task(session)
    task = tasks_service.add_note(session, task, "first note")
    task = tasks_service.add_note(session, task, "second note")
    assert "first note" in task.notes
    assert "second note" in task.notes
    assert task.notes.count("\n") == 1  # two entries, one separator


def test_plan_and_remove_from_today_does_not_change_due_date(session):
    due = local_today() + timedelta(days=10)
    task = make_task(session, due_date=due)
    planned = tasks_service.plan_task_for_today(session, task)
    assert planned.planned_for_date == local_today()
    assert planned.due_date == due  # unchanged

    removed = tasks_service.remove_task_from_today(session, planned)
    assert removed.planned_for_date is None
    assert removed.due_date == due


def test_due_date_filtering(session):
    today = local_today()
    make_task(session, title="due today", due_date=today)
    make_task(session, title="due next week", due_date=today + timedelta(days=7))
    make_task(session, title="no due date")

    only_today = tasks_service.list_tasks(session, due_before=today, due_after=today)
    titles = {t.title for t in only_today}
    assert titles == {"due today"}


def test_overdue_detection_excludes_completed_and_cancelled(session):
    yesterday = local_today() - timedelta(days=1)
    overdue_open = make_task(session, title="overdue open", due_date=yesterday)
    overdue_done = make_task(session, title="overdue done", due_date=yesterday)
    tasks_service.complete_task(session, overdue_done)
    make_task(session, title="due later", due_date=local_today() + timedelta(days=1))

    overdue = tasks_service.get_overdue(session)
    titles = {t.title for t in overdue}
    assert titles == {"overdue open"}
    assert overdue_open.id in {t.id for t in overdue}


def test_upcoming_respects_window(session):
    today = local_today()
    make_task(session, title="in window", due_date=today + timedelta(days=3))
    make_task(session, title="out of window", due_date=today + timedelta(days=30))

    upcoming = tasks_service.get_upcoming(session, days=7)
    titles = {t.title for t in upcoming}
    assert "in window" in titles
    assert "out of window" not in titles


def test_carry_unfinished_forward_moves_planned_and_due(session):
    today = local_today()
    tomorrow = today + timedelta(days=1)
    task = make_task(session, due_date=today, priority=TaskPriority.low)
    tasks_service.plan_task_for_today(session, task, today)

    moved = tasks_service.carry_unfinished_forward(session, today, tomorrow, [TaskPriority.low])
    assert len(moved) == 1
    assert moved[0].planned_for_date == tomorrow
    assert moved[0].due_date == tomorrow


def test_carry_unfinished_forward_respects_priority_filter(session):
    today = local_today()
    tomorrow = today + timedelta(days=1)
    low = make_task(session, title="low", priority=TaskPriority.low)
    high = make_task(session, title="high", priority=TaskPriority.high)
    tasks_service.plan_task_for_today(session, low, today)
    tasks_service.plan_task_for_today(session, high, today)

    moved = tasks_service.carry_unfinished_forward(session, today, tomorrow, [TaskPriority.low])
    assert {t.title for t in moved} == {"low"}


def test_search_tasks_matches_title_and_notes(session):
    make_task(session, title="Akuna Capital OA")
    make_task(session, title="Unrelated task", notes="mentions Akuna in passing")
    make_task(session, title="Totally different")

    results = tasks_service.search_tasks(session, "Akuna")
    assert len(results) == 2
