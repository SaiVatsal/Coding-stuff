"""
In-Game Live Radio & Bulletin WebSocket Broadcaster
Streams breaking news audio/text bulletins to Unreal Engine 5.5 clients.
Integrates with Unreal Engine `FOnLiveRadioBulletinReceived` dynamic multicast delegate.
"""

import json
import time
import random
import asyncio
from datetime import datetime, timezone
from typing import Set, Dict, Any, List, Optional
from urllib.parse import quote
from fastapi import WebSocket

from app.config import settings
from app.utils.logger import logger
from app.utils.sanitizer import sanitize_text, sanitize_payload
from app.services.radio.radio_stations import (
    RADIO_STATIONS,
    COMMERCIAL_SPONSORS,
    DJ_CHATTER,
    get_station_by_id,
)


class RadioBroadcaster:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.client_subscriptions: Dict[WebSocket, List[str]] = {}
        self.bulletin_counter: int = 0
        self.broadcast_task: Optional[asyncio.Task] = None
        self._running: bool = False

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        self.client_subscriptions[websocket] = ["all"]
        logger.info(f"Unreal Engine client connected to Radio Broadcast stream. Total listeners: {len(self.active_connections)}")

        # Send Welcome Packet & Station Directory
        welcome_packet = {
            "type": "connection_established",
            "server_time": datetime.now(timezone.utc).isoformat(),
            "message": "Connected to Vice City Radio Broadcast Network (Eyefind Engine)",
            "available_stations": [
                {"id": s["id"], "name": s["name"], "genre": s["genre"], "dj": s["dj"]}
                for s in RADIO_STATIONS
            ],
        }
        await websocket.send_text(json.dumps(sanitize_payload(welcome_packet)))

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.client_subscriptions:
            del self.client_subscriptions[websocket]
        logger.info(f"Client disconnected from Radio Broadcast stream. Remaining listeners: {len(self.active_connections)}")

    async def handle_client_message(self, websocket: WebSocket, message_text: str):
        try:
            data = json.loads(message_text)
            msg_type = data.get("type")
            if msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong", "timestamp": int(time.time() * 1000)}))
            elif msg_type == "subscribe" and isinstance(data.get("stations"), list):
                self.client_subscriptions[websocket] = data["stations"]
                await websocket.send_text(json.dumps({"type": "subscription_updated", "stations": data["stations"]}))
        except Exception:
            # Ignore malformed client frames
            pass

    async def broadcast_bulletin(
        self,
        headline: str,
        script: str,
        station_id: str = "all",
        custom_audio_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        self.bulletin_counter += 1
        now_ms = int(time.time() * 1000)
        bulletin_id = f"bulletin-{now_ms}-{self.bulletin_counter}"
        audio_url = custom_audio_url or f"{settings.audio_cdn_url}/bulletins/{bulletin_id}.mp3"

        station = get_station_by_id(station_id) or RADIO_STATIONS[0]
        resolved_station_id = station_id if station_id != "all" else station["id"]

        packet = {
            "type": "RADIO_BULLETIN",
            "bulletin_id": bulletin_id,
            "id": bulletin_id,
            "station": station["name"],
            "station_id": resolved_station_id,
            "headline": sanitize_text(headline, settings.max_title_length),
            "script": sanitize_text(script, settings.max_snippet_length),
            "dj_name": station["dj"],
            "audio_url": audio_url,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "severity": "breaking",
        }

        await self._send_to_subscribers(packet, station_id)
        logger.info(f'[Radio Broadcast] Sent breaking bulletin: "{headline}" across station [{station["name"]}]')
        return packet

    async def broadcast_commercial(self, sponsor_index: int = -1) -> Dict[str, Any]:
        if 0 <= sponsor_index < len(COMMERCIAL_SPONSORS):
            sponsor = COMMERCIAL_SPONSORS[sponsor_index]
        else:
            sponsor = random.choice(COMMERCIAL_SPONSORS)

        prod_slug = quote(sponsor["product"].lower().replace(" ", "_"))
        packet = {
            "type": "commercial",
            "product": sanitize_text(sponsor["product"], 64),
            "slogan": sanitize_text(sponsor["slogan"], 128),
            "script": sanitize_text(sponsor["script"], settings.max_snippet_length),
            "audio_url": f"{settings.audio_cdn_url}/commercials/{prod_slug}.mp3",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        await self._send_to_subscribers(packet, "all")
        logger.debug(f'[Radio Commercial] Broadcasted ad for: {sponsor["product"]}')
        return packet

    async def broadcast_dj_chatter(self) -> Dict[str, Any]:
        chatter = random.choice(DJ_CHATTER)
        dj_slug = quote(chatter["dj"].lower().replace(" ", "_"))
        packet = {
            "type": "dj_chatter",
            "station": chatter["station"],
            "dj_name": chatter["dj"],
            "script": sanitize_text(chatter["script"], settings.max_snippet_length),
            "audio_url": f"{settings.audio_cdn_url}/chatter/{dj_slug}.mp3",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        await self._send_to_subscribers(packet, "all")
        return packet

    async def _send_to_subscribers(self, packet: Dict[str, Any], target_station_id: str):
        if not self.active_connections:
            return

        payload_string = json.dumps(sanitize_payload(packet))
        dead_connections = set()

        for ws in list(self.active_connections):
            subs = self.client_subscriptions.get(ws, ["all"])
            if target_station_id == "all" or "all" in subs or target_station_id in subs:
                try:
                    await ws.send_text(payload_string)
                except Exception:
                    dead_connections.add(ws)

        for ws in dead_connections:
            self.disconnect(ws)

    def start_broadcast_loop(self):
        if self._running:
            return
        self._running = True
        self.broadcast_task = asyncio.create_task(self._broadcast_loop())

    async def _broadcast_loop(self):
        from app.services.news.news_service import news_service

        interval_s = max(1.0, float(settings.radio_broadcast_interval_ms) / 1000.0)
        state = 0

        while self._running:
            await asyncio.sleep(interval_s)
            if not self.active_connections:
                continue

            try:
                if state == 0:
                    trending = await news_service.get_trending_news()
                    articles = trending.get("trending_news", [])
                    if articles:
                        item = random.choice(articles)
                        await self.broadcast_bulletin(
                            item.get("headline", ""),
                            item.get("body", ""),
                            "weazel-news-247",
                            item.get("satirical_audio_url"),
                        )
                    state = 1
                elif state == 1:
                    await self.broadcast_dj_chatter()
                    state = 2
                else:
                    await self.broadcast_commercial()
                    state = 0
            except Exception as err:
                logger.warn(f"Radio loop broadcast error: {err}")

    def shutdown(self):
        self._running = False
        if self.broadcast_task and not self.broadcast_task.done():
            self.broadcast_task.cancel()


radio_broadcaster = RadioBroadcaster()
