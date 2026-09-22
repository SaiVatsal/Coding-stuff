from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.deps import SessionDep, CurrentUser
from models.interview import InterviewSession
from pydantic import BaseModel
from typing import List

router = APIRouter()

class InterviewCreate(BaseModel):
    title: str
    interview_type: str
    difficulty: str

@router.post("/", response_model=dict)
def create_interview(
    interview_in: InterviewCreate,
    db: SessionDep = Depends(),
    current_user: CurrentUser = Depends()
):
    session = InterviewSession(
        user_id=current_user.id,
        title=interview_in.title,
        interview_type=interview_in.interview_type,
        difficulty=interview_in.difficulty,
        status="scheduled"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"id": session.id, "message": "Interview session created"}

@router.get("/")
def get_interviews(
    db: SessionDep = Depends(),
    current_user: CurrentUser = Depends()
):
    sessions = db.query(InterviewSession).filter(InterviewSession.user_id == current_user.id).all()
    return [{"id": s.id, "title": s.title, "status": s.status, "type": s.interview_type} for s in sessions]
