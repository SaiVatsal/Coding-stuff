"""
Eyefind Internet Subsystem Middleware Gateway
FastAPI Application Entry Point
Unreal Engine 5.5 Compatible Backend Services
"""

import time
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.utils.logger import logger
from app.api.v1 import api_v1_router
from app.services.radio.radio_broadcaster import radio_broadcaster

START_TIME = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=======================================================")
    logger.info(f"Eyefind Middleware Gateway starting on {settings.host}:{settings.port}")
    logger.info(f"Environment: [{settings.app_env}] | Satire Provider: [{settings.satire_provider}]")
    logger.info("=======================================================")

    radio_broadcaster.start_broadcast_loop()
    yield

    logger.info("Shutting down Eyefind Middleware Gateway...")
    radio_broadcaster.shutdown()


app = FastAPI(
    title="Eyefind Live Internet Gateway API",
    description="Production-grade Middleware Gateway connecting Unreal Engine 5.5 to live web search, BAWSAQ stocks, Weazel News, and live radio streams.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# Global Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "HTTP Exception", "message": str(exc.detail), "status": exc.status_code},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "message": "An unexpected server error occurred.", "status": 500},
    )


# Root & Health Check Endpoints
@app.get("/")
async def root_overview():
    return {
        "title": "Eyefind Live Internet Gateway API",
        "description": "Production-grade Middleware Gateway connecting Unreal Engine 5.5 to live web, BAWSAQ stocks, Weazel News, and radio streams.",
        "endpoints": {
            "search": "GET /api/v1/search?q={query}&mode={satire|direct}&category={web|news|stocks|social|commerce}",
            "bawsaq": "GET /api/v1/stocks/bawsaq",
            "trending_news": "GET /api/v1/news/trending",
            "radio_websocket": "WS /ws/radio-broadcast",
            "health": "GET /health",
        },
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "service": "GTA6-Eyefind-Middleware-Gateway (Python/FastAPI)",
        "version": "1.0.0",
        "region": "Leonida / Vice City",
        "uptime_seconds": int(time.time() - START_TIME),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# WebSocket Radio Broadcast Stream Endpoint
@app.websocket("/ws/radio-broadcast")
async def websocket_radio_endpoint(websocket: WebSocket):
    await radio_broadcaster.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await radio_broadcaster.handle_client_message(websocket, data)
    except WebSocketDisconnect:
        radio_broadcaster.disconnect(websocket)
    except Exception as e:
        logger.warn(f"WebSocket error: {e}")
        radio_broadcaster.disconnect(websocket)


# Mount API v1 Routes
app.include_router(api_v1_router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=(settings.app_env == "development"))
