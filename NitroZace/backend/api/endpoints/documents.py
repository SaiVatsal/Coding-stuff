from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from api.deps import SessionDep, CurrentUser
from models.document import Document
from worker.tasks import process_document_task
import PyPDF2
import io

router = APIRouter()

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = "resume",
    db: SessionDep = Depends(),
    current_user: CurrentUser = Depends()
):
    if not file.filename.endswith((".pdf", ".txt")):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported currently")
    
    content = ""
    file_bytes = await file.read()
    
    if file.filename.endswith(".pdf"):
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        for page in pdf_reader.pages:
            content += page.extract_text() + "\n"
    else:
        content = file_bytes.decode("utf-8")
        
    doc = Document(
        user_id=current_user.id,
        filename=file.filename,
        content=content,
        document_type=document_type
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    # Trigger celery task
    process_document_task.delay(doc.id)
    
    return {"message": "Document uploaded and processing started", "document_id": doc.id}

@router.get("/")
def get_documents(
    db: SessionDep = Depends(),
    current_user: CurrentUser = Depends()
):
    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    return [{"id": d.id, "filename": d.filename, "type": d.document_type} for d in docs]
