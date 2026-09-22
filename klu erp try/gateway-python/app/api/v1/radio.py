"""
Radio Bulletin Trigger Route & WebSocket Endpoint
POST /api/v1/radio/broadcast
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.services.radio.radio_broadcaster import radio_broadcaster
from app.utils.sanitizer import sanitize_text

router = APIRouter()


class BulletinRequest(BaseModel):
    headline: Optional[str] = None
    script: Optional[str] = None
    station_id: Optional[str] = "all"
    audio_url: Optional[str] = None


@router.post("/radio/broadcast")
async def broadcast_radio_bulletin(req: BulletinRequest):
    if not req.headline or not req.script:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Invalid Payload",
                "message": 'Both "headline" and "script" fields are required to trigger an in-game radio bulletin.',
                "status": 400,
            },
        )

    packet = await radio_broadcaster.broadcast_bulletin(
        headline=sanitize_text(req.headline, 180),
        script=sanitize_text(req.script, 512),
        station_id=req.station_id or "all",
        custom_audio_url=req.audio_url,
    )

    return {
        "success": True,
        "message": "Bulletin broadcasted to in-game radio stream",
        "packet": packet,
    }
