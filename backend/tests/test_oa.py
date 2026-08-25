from datetime import date, timedelta

from app.models.enums import OAUrgency
from app.services.oa import compute_oa_urgency, days_remaining


def test_no_deadline_is_normal():
    assert compute_oa_urgency(None, date.today()) == OAUrgency.normal


def test_completed_is_always_normal_regardless_of_deadline():
    assert (
        compute_oa_urgency(date.today() - timedelta(days=5), date.today(), completed=True)
        == OAUrgency.normal
    )


def test_deadline_today_is_critical():
    assert compute_oa_urgency(date.today(), date.today()) == OAUrgency.critical


def test_deadline_within_three_days_is_high():
    assert compute_oa_urgency(date.today() + timedelta(days=2), date.today()) == OAUrgency.high


def test_deadline_within_seven_days_is_upcoming():
    assert (
        compute_oa_urgency(date.today() + timedelta(days=6), date.today()) == OAUrgency.upcoming
    )


def test_deadline_far_away_is_normal():
    assert compute_oa_urgency(date.today() + timedelta(days=30), date.today()) == OAUrgency.normal


def test_deadline_in_past_is_expired():
    assert (
        compute_oa_urgency(date.today() - timedelta(days=1), date.today()) == OAUrgency.expired
    )


def test_days_remaining_computation():
    assert days_remaining(date.today() + timedelta(days=4), date.today()) == 4
    assert days_remaining(None, date.today()) is None
