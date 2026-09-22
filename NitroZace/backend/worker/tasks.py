from celery import shared_task
from core.database import SessionLocal
from models.document import Document, DocumentChunk
from services.document_processor import process_and_embed_document

@shared_task(name="worker.tasks.process_document")
def process_document_task(document_id: int):
    db = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return "Document not found"
        
        # Call service to chunk and embed
        chunks = process_and_embed_document(document.content)
        
        for chunk_text, embedding in chunks:
            doc_chunk = DocumentChunk(
                document_id=document.id,
                content=chunk_text,
                embedding=embedding
            )
            db.add(doc_chunk)
        db.commit()
        return f"Successfully processed document {document_id}"
    finally:
        db.close()
