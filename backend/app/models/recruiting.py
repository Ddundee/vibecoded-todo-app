import uuid
from datetime import date
from typing import Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import ApplicationStatus

if TYPE_CHECKING:
    from app.models.task import Task


def _uuid() -> str:
    return str(uuid.uuid4())


class RecruitingDetail(SQLModel, table=True):
    """
    Recruiting-specific metadata attached 1:1 to a Task. Kept as its own
    table so the generic Task model stays clean for non-recruiting tasks
    (school, errands, projects, ...).
    """

    __tablename__ = "recruiting_details"

    id: str = Field(default_factory=_uuid, primary_key=True)
    task_id: str = Field(foreign_key="tasks.id", unique=True, index=True)

    company: Optional[str] = None
    position: Optional[str] = None
    application_url: Optional[str] = None
    application_status: ApplicationStatus = Field(default=ApplicationStatus.discovered)
    applied_date: Optional[date] = None
    recruiter: Optional[str] = None

    # OA-specific
    oa_received_date: Optional[date] = None
    oa_deadline: Optional[date] = None

    # Interview-specific
    interview_date: Optional[date] = None
    interview_stage: Optional[str] = None

    # Freeform prep notes, distinct from the parent task's general `notes`.
    prep_notes: Optional[str] = None

    task: "Task" = Relationship(back_populates="recruiting_detail")
