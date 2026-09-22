"""
Brave Search Web API Provider
Fetches live web search results using official Brave Search REST API.
"""

import httpx
from typing import List, Dict, Any

from app.config import settings
from app.utils.logger import logger
from app.utils.sanitizer import sanitize_text, sanitize_url

BRAVE_SEARCH_ENDPOINT = "https://api.search.brave.com/res/v1/web/search"


class BraveSearchProvider:
    def __init__(self):
        self.api_key = settings.brave_api_key

    async def search(self, query: str, limit: int = 8) -> List[Dict[str, Any]]:
        if not self.api_key:
            return []

        url = f"{BRAVE_SEARCH_ENDPOINT}?q={httpx.URL(query)}&count={limit}"
        headers = {
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": self.api_key,
        }

        async with httpx.AsyncClient(timeout=3.5) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                raise Exception(f"Brave Search returned status {resp.status_code}")

            data = resp.json()
            web_results = data.get("web", {}).get("results", [])

            results = []
            for item in web_results[:limit]:
                results.append({
                    "title": sanitize_text(item.get("title", "")),
                    "snippet": sanitize_text(item.get("description", "")),
                    "source_url": sanitize_url(item.get("url", "")),
                    "thumbnail_url": sanitize_url(item.get("thumbnail", {}).get("src", "")),
                })

            return results


brave_provider = BraveSearchProvider()
