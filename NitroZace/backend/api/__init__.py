from fastapi import APIRouter
from api.endpoints import auth, documents, websockets, interviews

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(interviews.router, prefix="/interviews", tags=["interviews"])
api_router.include_router(websockets.router, prefix="/ws", tags=["websockets"])
