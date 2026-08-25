from typing import List

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.deps import get_db, require_auth
from app.models.task import RecurrenceRule
from app.schemas import RecurrenceRuleRead, RecurringTaskCreate
from app.services import recurrence as recurrence_service

router = APIRouter(
    prefix="/api/recurring-tasks", tags=["recurring"], dependencies=[Depends(require_auth)]
)


@router.get("", response_model=List[RecurrenceRuleRead])
def list_recurring(session: Session = Depends(get_db)):
    return list(session.exec(select(RecurrenceRule).where(RecurrenceRule.active == True)).all())  # noqa: E712


@router.post("", response_model=RecurrenceRuleRead, status_code=201)
def create_recurring(payload: RecurringTaskCreate, session: Session = Depends(get_db)):
    return recurrence_service.create_recurring_task(session, payload)
