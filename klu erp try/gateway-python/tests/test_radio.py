"""
Tests for Radio Station Registry & Broadcaster Service (Python)
"""

import pytest
from app.services.radio.radio_stations import (
    RADIO_STATIONS,
    get_station_by_id,
    get_all_stations,
)
from app.services.radio.radio_broadcaster import radio_broadcaster


def test_radio_stations_lists_all_official_vice_city_stations():
    stations = get_all_stations()
    assert len(stations) >= 5

    weazel = get_station_by_id("weazel-news-247")
    assert weazel is not None
    assert weazel["name"] == "Weazel News 24/7"
    assert weazel["format"] == "News / Talk / Propaganda"

    vcpr = get_station_by_id("vcpr")
    assert vcpr is not None
    assert vcpr["name"] == "Vice City Public Radio (VCPR)"


@pytest.mark.asyncio
async def test_radio_broadcaster_creates_properly_structured_bulletin():
    packet = await radio_broadcaster.broadcast_bulletin(
        headline="Tanker explosion on Ocean Drive",
        script="Weazel News special report: A high-speed pursuit ended in fireworks on Ocean Beach.",
        station_id="weazel-news-247",
        custom_audio_url="/audio/bulletins/weazel_tanker.mp3",
    )

    assert packet.get("type") == "RADIO_BULLETIN"
    assert packet.get("headline") == "Tanker explosion on Ocean Drive"
    assert packet.get("station_id") == "weazel-news-247"
    assert packet.get("audio_url") == "/audio/bulletins/weazel_tanker.mp3"
    assert isinstance(packet.get("bulletin_id"), str)
    assert isinstance(packet.get("timestamp"), str)
