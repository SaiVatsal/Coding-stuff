"""
Eyefind Core Search Service (Python/FastAPI)
Orchestrates multi-provider search fallback (Brave -> DuckDuckGo -> Mock),
runs Satire Ingestion Layer, and sanitizes payload for Unreal Engine C++ stability.
"""

import time
from datetime import datetime, timezone
from typing import Dict, Any, List
from collections import OrderedDict

from app.config import settings
from app.utils.logger import logger
from app.utils.sanitizer import sanitize_text, sanitize_payload
from app.services.search.brave_provider import brave_provider
from app.services.search.duckduckgo_provider import duckduckgo_provider
from app.services.search.mock_provider import mock_provider
from app.services.satire.satire_engine import satire_engine


class SearchService:
    def __init__(self):
        self.cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self.cache_ttl_seconds = settings.search_cache_ttl_seconds

    async def execute_search(
        self, query: str, mode: str = "satire", category: str = "web", limit: int = 8
    ) -> Dict[str, Any]:
        clean_query = sanitize_text(query, 128)
        if not clean_query:
            return {
                "query": "",
                "mode": mode,
                "category": category,
                "count": 0,
                "results": [],
                "provider": "none",
                "cached": False,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        cache_key = f"{clean_query.lower()}_{mode}_{category}_{limit}"
        now = time.time()

        # 1. Check in-memory LRU cache
        if cache_key in self.cache:
            entry = self.cache[cache_key]
            if now - entry["timestamp"] < self.cache_ttl_seconds:
                logger.debug(f'Eyefind search cache hit for: "{clean_query}"')
                cached_data = dict(entry["data"])
                cached_data["cached"] = True
                return cached_data
            else:
                del self.cache[cache_key]

        raw_results: List[Dict[str, Any]] = []
        used_provider = "none"

        # 2. Fallback Chain: Brave -> DuckDuckGo -> Mock
        # Priority 1: Brave Search API
        if settings.brave_api_key:
            try:
                raw_results = await brave_provider.search(clean_query, limit)
                if raw_results:
                    used_provider = "brave"
            except Exception as e:
                logger.warn(f"Brave Search failed: {e}. Falling back to DuckDuckGo...")

        # Priority 2: DuckDuckGo API / Parser
        if not raw_results:
            try:
                raw_results = await duckduckgo_provider.search(clean_query, limit)
                if raw_results:
                    used_provider = "duckduckgo"
            except Exception as e:
                logger.warn(f"DuckDuckGo Search failed: {e}. Falling back to GTA Mock Generator...")

        # Priority 3: Built-in GTA Lore Mock Generator (Guaranteed 100% success)
        if not raw_results:
            raw_results = await mock_provider.search(clean_query, limit)
            used_provider = "mock_gta"

        # 3. Apply Satirical Transformation if mode is 'satire'
        if mode == "satire":
            processed_results = await satire_engine.satirize_batch(raw_results, clean_query, category)
        else:
            processed_results = [
                {
                    "title": sanitize_text(item.get("title", ""), settings.max_title_length),
                    "snippet": sanitize_text(item.get("snippet", ""), settings.max_snippet_length),
                    "source_url": item.get("source_url", ""),
                    "thumbnail_url": item.get("thumbnail_url", ""),
                    "satirical_author": "Eyefind Direct Web Feed",
                    "market_impact": 0.0,
                }
                for item in raw_results
            ]

        # 4. Final Safety Sanitization pass
        sanitized_results = sanitize_payload(processed_results)

        response_payload = {
            "query": clean_query,
            "mode": mode,
            "category": category,
            "count": len(sanitized_results),
            "results": sanitized_results,
            "provider": used_provider,
            "cached": False,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        # 5. Store in LRU cache
        if len(self.cache) > 256:
            self.cache.popitem(last=False)
        self.cache[cache_key] = {"timestamp": now, "data": response_payload}

        return response_payload

    def clear_cache(self):
        self.cache.clear()


search_service = SearchService()
