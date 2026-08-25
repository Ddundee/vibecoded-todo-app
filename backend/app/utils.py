from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from app.config import get_settings


def utcnow() -> datetime:
    """Naive UTC timestamp for storage in timezone-less DB columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def local_today() -> date:
    """Today's date in APP_TIMEZONE, not the container/server's system
    timezone. Docker containers typically run in UTC regardless of where
    the user actually is, so a late-evening due date could otherwise land
    on the wrong day."""
    settings = get_settings()
    return datetime.now(ZoneInfo(settings.app_timezone)).date()
