"""
Tests for Trending Vice City News Service (Python)
"""

import pytest
from app.services.news.news_service import news_service


@pytest.mark.asyncio
async def test_news_service_returns_satirical_vice_city_stories():
    trending = await news_service.get_trending_news(force_refresh=True)

    assert trending.get("headline_ticker")
    assert isinstance(trending.get("articles"), list)
    assert len(trending["articles"]) > 0
    assert isinstance(trending.get("count"), int)
    assert isinstance(trending.get("timestamp"), str)

    for article in trending["articles"]:
        assert isinstance(article.get("id"), str)
        assert isinstance(article.get("title"), str)
        assert isinstance(article.get("snippet"), str)
        assert isinstance(article.get("source_url"), str)
        assert isinstance(article.get("thumbnail_url"), str)
        assert isinstance(article.get("satirical_author"), str)
        assert isinstance(article.get("market_impact"), (int, float))
        assert -1.0 <= article["market_impact"] <= 1.0
        assert isinstance(article.get("audio_url"), str)
        assert isinstance(article.get("category"), str)
        assert isinstance(article.get("location"), str)
