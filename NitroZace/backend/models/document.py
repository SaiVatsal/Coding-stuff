from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String, nullable=False)
    content = Column(String)
    document_type = Column(String) # "resume", "jd", "notes"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="documents")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    content = Column(String, nullable=False)
    embedding = Column(Vector(1536)) # Dimension size depends on AI model

    document = relationship("Document", backref="chunks")
