"""
Computed priority score used to rank "what should I work on next".

Design goal: simple and explainable, not machine-learned. Every point added
to the score comes with a human-readable reason so an AI (or the user) can
see exactly why a task ranks where it does. This score is NEVER written back
onto `task.priority` — the user's manually chosen priority is never
silently overwritten.
"""

from dataclasses import dataclass, field
from datetime import date
from typing import List

from app.models.enums import TaskPriority, TaskStatus
from app.models.task import Task

_PRIORITY_WEIGHTS = {
    TaskPriority.critical: 100.0,
    TaskPriority.high: 70.0,
    TaskPriority.medium: 40.0,
    TaskPriority.low: 15.0,
}


@dataclass
class PriorityResult:
    score: float
    reasons: List[str] = field(default_factory=list)


def compute_priority(task: Task, today: date) -> PriorityResult:
    score = 0.0
    reasons: List[str] = []

    base = _PRIORITY_WEIGHTS.get(task.priority, 40.0)
    score += base
    reasons.append(f"Manually set priority '{task.priority.value}' (+{base:.0f})")

    if task.due_date is not None and task.status not in (
        TaskStatus.completed,
        TaskStatus.cancelled,
    ):
        days_over = (today - task.due_date).days

        if task.due_date < today:
            overdue_bonus = min(50.0, 30.0 + days_over * 5.0)
            score += overdue_bonus
            reasons.append(
                f"Overdue by {days_over} day(s) (+{overdue_bonus:.0f})"
            )
        elif task.due_date == today:
            score += 30.0
            reasons.append("Due today (+30)")
        elif (task.due_date - today).days <= 3:
            score += 15.0
            reasons.append("Due within 3 days (+15)")
        elif (task.due_date - today).days <= 7:
            score += 5.0
            reasons.append("Due within 7 days (+5)")

    if task.planned_for_date == today:
        score += 20.0
        reasons.append("Planned for today (+20)")

    if task.estimated_duration is not None:
        if task.estimated_duration <= 15:
            score += 5.0
            reasons.append("Quick win: <=15 min (+5)")
        elif task.estimated_duration > 120:
            score -= 5.0
            reasons.append("Large effort: >120 min (-5)")

    if task.status == TaskStatus.blocked:
        score -= 15.0
        reasons.append("Blocked (-15)")

    return PriorityResult(score=round(score, 1), reasons=reasons)


def rank_tasks(tasks: List[Task], today: date) -> List[tuple[Task, PriorityResult]]:
    scored = [(t, compute_priority(t, today)) for t in tasks]
    scored.sort(key=lambda pair: pair[1].score, reverse=True)
    return scored
