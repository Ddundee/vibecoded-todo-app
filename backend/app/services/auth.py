from typing import Optional

from sqlmodel import Session, select

from app.config import get_settings
from app.models.user import User
from app.security import hash_password, verify_password


def ensure_admin_user(session: Session) -> None:
    """Seed the single admin account from env vars if no user exists yet.

    Only runs when the users table is empty, so changing ADMIN_PASSWORD in
    .env after first boot does NOT reset an already-created account.
    """
    settings = get_settings()
    existing = session.exec(select(User)).first()
    if existing is not None:
        return

    user = User(
        username=settings.admin_username,
        password_hash=hash_password(settings.admin_password),
    )
    session.add(user)
    session.commit()


def authenticate_user(session: Session, username: str, password: str) -> Optional[User]:
    user = session.exec(select(User).where(User.username == username)).first()
    if user is None:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
