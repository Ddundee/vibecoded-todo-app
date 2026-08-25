import os

os.environ.setdefault("DB_ENGINE", "sqlite")
os.environ.setdefault("SQLITE_PATH", "/tmp/todo_app_test_unused.db")
os.environ.setdefault("API_TOKEN", "test-token")
os.environ.setdefault("SESSION_SECRET", "test-session-secret-value-needs-32-bytes")
os.environ.setdefault("ADMIN_USERNAME", "admin")
os.environ.setdefault("ADMIN_PASSWORD", "admin-password")
# Fixed explicitly (rather than relying on the config default) so tests
# using `local_today()` are deterministic regardless of the machine's
# system timezone.
os.environ.setdefault("APP_TIMEZONE", "UTC")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

import app.models  # noqa: F401  (register table metadata)
from app import db as db_module


@pytest.fixture()
def engine():
    eng = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(eng)
    return eng


@pytest.fixture()
def session(engine):
    with Session(engine) as s:
        yield s


@pytest.fixture()
def use_test_db(engine, monkeypatch):
    """Point the shared app.db.engine at an isolated in-memory database for
    the duration of one test. Anything that looks up `db.engine` at call
    time (routers, MCP tools) picks this up automatically."""
    monkeypatch.setattr(db_module, "engine", engine)
    return engine


@pytest.fixture()
def client(use_test_db):
    from app.main import app

    with TestClient(app) as c:
        yield c


@pytest.fixture()
def auth_headers():
    return {"Authorization": "Bearer test-token"}
