from datetime import date, datetime, time, timedelta
from typing import Optional

from app.models.enums import OAUrgency


def compute_oa_urgency(
    deadline: Optional[date], today: date, completed: bool = False
) -> OAUrgency:
    if completed or deadline is None:
        return OAUrgency.normal

    now = datetime.combine(today, datetime.now().time())
    deadline_dt = datetime.combine(deadline, time(23, 59, 59))
    remaining = deadline_dt - now

    if remaining.total_seconds() < 0:
        return OAUrgency.expired
    if remaining <= timedelta(hours=24):
        return OAUrgency.critical
    if remaining <= timedelta(days=3):
        return OAUrgency.high
    if remaining <= timedelta(days=7):
        return OAUrgency.upcoming
    return OAUrgency.normal


def days_remaining(deadline: Optional[date], today: date) -> Optional[int]:
    if deadline is None:
        return None
    return (deadline - today).days
