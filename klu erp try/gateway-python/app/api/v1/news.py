"""
Trending News API Route
GET /api/v1/news/trending
"""

from fastapi import APIRouter, Query
from app.services.news.news_service import news_service

router = APIRouter()


@router.get("/news/trending")
async def get_trending_news(
    refresh: bool = Query(default=False, description="Force refresh trending news feeds"),
):
    return await news_service.get_trending_news(force_refresh=refresh)
