from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.deps import get_db, require_auth
from app.schemas import (
    InternshipApplicationCreate,
    OACreate,
    OADeadlineItem,
    RecruitingPipelineStage,
    TaskRead,
)
from app.services import recruiting as recruiting_service
from app.services import tasks as tasks_service

router = APIRouter(
    prefix="/api/recruiting", tags=["recruiting"], dependencies=[Depends(require_auth)]
)


@router.post("/applications", response_model=TaskRead, status_code=201)
def create_application(payload: InternshipApplicationCreate, session: Session = Depends(get_db)):
    task = recruiting_service.create_internship_application(session, payload)
    return tasks_service.serialize_task(task)


@router.post("/oas", response_model=TaskRead, status_code=201)
def create_oa(payload: OACreate, session: Session = Depends(get_db)):
    task = recruiting_service.create_oa(session, payload)
    return tasks_service.serialize_task(task)


@router.get("/oas", response_model=list[OADeadlineItem])
def list_oas(session: Session = Depends(get_db)):
    items = recruiting_service.get_oa_deadlines(session)
    return [
        OADeadlineItem(
            task=tasks_service.serialize_task(item["task"]),
            company=item["company"],
            oa_name=item["oa_name"],
            received_date=item["received_date"],
            deadline=item["deadline"],
            days_remaining=item["days_remaining"],
            urgency=item["urgency"],
            completed=item["completed"],
        )
        for item in items
    ]


@router.get("/pipeline", response_model=list[RecruitingPipelineStage])
def pipeline(session: Session = Depends(get_db)):
    stages = recruiting_service.get_recruiting_pipeline(session)
    return [
        RecruitingPipelineStage(
            status=s["status"],
            count=s["count"],
            tasks=[tasks_service.serialize_task(t) for t in s["tasks"]],
        )
        for s in stages
    ]
