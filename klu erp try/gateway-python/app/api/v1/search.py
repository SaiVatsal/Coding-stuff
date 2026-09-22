"""
Search API Route (Eyefind Engine)
GET /api/v1/search?q={query}&mode={satire|direct}&category={web|news|stocks}
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Query
from app.services.search.search_service import search_service
from app.utils.logger import logger

router = APIRouter()


@router.get("/search")
async def search_endpoint(
    q: str = Query(default="", description="Search query string"),
    mode: str = Query(default="satire", description="Search mode: satire | direct | raw"),
    category: str = Query(default="web", description="Category: web | news | stocks | social | commerce | all"),
    limit: int = Query(default=8, ge=1, le=50, description="Max results limit"),
):
    clean_mode = (mode or "satire").lower()
    clean_cat = (category or "web").lower()

    if not q or not q.strip():
        return {
            "query": "",
            "mode": clean_mode,
            "category": clean_cat,
            "count": 0,
            "results": [],
            "provider": "none",
            "cached": False,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    logger.info(f'Processing Eyefind search: query="{q}", mode={clean_mode}, category={clean_cat}')
    return await search_service.execute_search(q, clean_mode, clean_cat, limit)
