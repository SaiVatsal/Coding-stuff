from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import api_router
from core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for NitroZace Interview Coaching Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "Welcome to NitroZace API"}
