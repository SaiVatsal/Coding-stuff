"""
Integration Tests for Eyefind REST API Endpoints (Python / FastAPI)
"""

import pytest
from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_health_returns_status_and_region():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data.get("status") == "HEALTHY"
    assert data.get("region") == "Leonida / Vice City"


def test_api_root_returns_gateway_overview():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert "endpoints" in data
    assert "search" in data["endpoints"]


def test_api_search_executes_search_query():
    res = client.get("/api/v1/search?q=weapons&mode=satire&category=web&limit=3")
    assert res.status_code == 200
    data = res.json()
    assert data.get("query") == "weapons"
    assert data.get("mode") == "satire"
    assert isinstance(data.get("results"), list)
    assert len(data["results"]) > 0

    first = data["results"][0]
    assert first.get("title")
    assert first.get("snippet")
    assert first.get("source_url")
    assert isinstance(first.get("market_impact"), (int, float))


def test_api_search_handles_empty_query():
    res = client.get("/api/v1/search?q=")
    assert res.status_code == 200
    data = res.json()
    assert data.get("count") == 0
    assert data.get("results") == []


def test_api_stocks_bawsaq_returns_market():
    res = client.get("/api/v1/stocks/bawsaq")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data.get("stocks"), list)
    assert len(data["stocks"]) >= 10


def test_api_stocks_bawsaq_single_ticker():
    res = client.get("/api/v1/stocks/bawsaq/FRUT")
    assert res.status_code == 200
    data = res.json()
    assert data.get("ticker") == "FRUT"
    assert data.get("company_name") == "Fruit Computers"


def test_api_stocks_bawsaq_unknown_ticker():
    res = client.get("/api/v1/stocks/bawsaq/UNKNOWN_ABC")
    assert res.status_code == 404


def test_api_news_trending():
    res = client.get("/api/v1/news/trending")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data.get("articles"), list)
    assert len(data["articles"]) > 0


def test_api_radio_broadcast_trigger():
    res = client.post(
        "/api/v1/radio/broadcast",
        json={
            "headline": "Tanker collision on Ocean Beach",
            "script": "Weazel News bulletin: Multiple explosions reported along Ocean Drive.",
            "station_id": "weazel-news-247",
            "audio_url": "/audio/bulletins/weazel_tanker.mp3",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data.get("success") is True
    assert data.get("packet", {}).get("headline") == "Tanker collision on Ocean Beach"
