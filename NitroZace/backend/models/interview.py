from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    interview_type = Column(String) # "behavioral", "technical", "system_design"
    difficulty = Column(String) # "easy", "medium", "hard"
    status = Column(String, default="scheduled") # "scheduled", "in_progress", "completed"
    scheduled_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Feedback metrics
    overall_score = Column(Float)
    technical_score = Column(Float)
    communication_score = Column(Float)
    confidence_score = Column(Float)
    feedback_summary = Column(Text)

    user = relationship("User", backref="interviews")

class InterviewMessage(Base):
    __tablename__ = "interview_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"))
    role = Column(String) # "user" or "assistant"
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("InterviewSession", backref="messages")
