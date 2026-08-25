import os
from pathlib import Path
from typing import Iterator

from sqlmodel import Session, SQLModel, create_engine

from app.config import get_settings

settings = get_settings()

_connect_args = {}
if settings.db_engine == "sqlite":
    Path(settings.sqlite_path).parent.mkdir(parents=True, exist_ok=True)
    _connect_args = {"check_same_thread": False}

engine = create_engine(settings.database_url, echo=False, connect_args=_connect_args)


def init_db() -> None:
    """Create all tables if they don't exist yet.

    V1 uses simple create-all instead of a migration framework: the schema
    is expected to evolve additively during early development. If you need
    real migrations later, introduce Alembic against this same metadata.
    """
    import app.models  # noqa: F401  (ensure all models are registered)

    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session
