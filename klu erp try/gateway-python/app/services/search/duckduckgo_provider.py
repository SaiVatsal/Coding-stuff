"""
DuckDuckGo Instant Answer & Web Search Provider
Fetches live zero-click answers and organic results without requiring an API key.
"""

import re
import httpx
from typing import List, Dict, Any
from app.utils.logger import logger
from app.utils.sanitizer import sanitize_text, sanitize_url

DDG_API_ENDPOINT = "https://api.duckduckgo.com/"
DDG_HTML_ENDPOINT = "https://html.duckduckgo.com/html/"


class DuckDuckGoProvider:
    async def search(self, query: str, limit: int = 8) -> List[Dict[str, Any]]:
        results = []

        # 1. Try DuckDuckGo Instant Answer JSON API
        try:
            results = await self._search_instant_answer(query, limit)
            if results:
                return results
        except Exception as e:
            logger.debug(f"DuckDuckGo Instant Answer API error: {e}")

        # 2. Fallback to DuckDuckGo HTML endpoint
        try:
            results = await self._search_html(query, limit)
            if results:
                return results
        except Exception as e:
            logger.debug(f"DuckDuckGo HTML search error: {e}")

        return results

    async def _search_instant_answer(self, query: str, limit: int) -> List[Dict[str, Any]]:
        params = {
            "q": query,
            "format": "json",
            "no_html": "1",
            "no_redirect": "1",
            "skip_disambig": "0",
        }
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(DDG_API_ENDPOINT, params=params, headers=headers)
            if resp.status_code != 200:
                return []

            data = resp.json()
            items = []

            # Abstract / Direct Answer
            if data.get("AbstractText") and data.get("AbstractURL"):
                items.append({
                    "title": sanitize_text(data.get("Heading", query)),
                    "snippet": sanitize_text(data.get("AbstractText")),
                    "source_url": sanitize_url(data.get("AbstractURL")),
                    "thumbnail_url": sanitize_url(data.get("Image")),
                })

            # Related Topics
            related = data.get("RelatedTopics", [])
            for topic in related:
                if len(items) >= limit:
                    break
                if "Text" in topic and "FirstURL" in topic:
                    text = topic["Text"]
                    parts = text.split(" - ", 1)
                    title = parts[0] if len(parts) > 1 else text[:60]
                    snippet = parts[1] if len(parts) > 1 else text
                    icon_url = topic.get("Icon", {}).get("URL", "")
                    if icon_url and not icon_url.startswith("http"):
                        icon_url = f"https://duckduckgo.com{icon_url}"

                    items.append({
                        "title": sanitize_text(title),
                        "snippet": sanitize_text(snippet),
                        "source_url": sanitize_url(topic["FirstURL"]),
                        "thumbnail_url": sanitize_url(icon_url),
                    })

            return items

    async def _search_html(self, query: str, limit: int) -> List[Dict[str, Any]]:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = {"q": query, "b": ""}

        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.post(DDG_HTML_ENDPOINT, data=data, headers=headers)
            if resp.status_code != 200:
                return []

            html_text = resp.text
            items = []

            # Extract result blocks using regex
            blocks = re.findall(r'<div class="result__body">.*?</div>\s*</div>', html_text, re.DOTALL)
            for block in blocks[:limit]:
                title_match = re.search(r'<a class="result__snippet[^>]*href="([^"]*)".*?>(.*?)</a>', block, re.DOTALL)
                snippet_match = re.search(r'<a class="result__snippet[^>]*>(.*?)</a>', block, re.DOTALL)

                if title_match and snippet_match:
                    raw_url = title_match.group(1)
                    raw_snippet = snippet_match.group(1)
                    # Extract actual target url from DuckDuckGo redirect
                    url_match = re.search(r'uddg=([^&]+)', raw_url)
                    target_url = httpx.URL(raw_url) if not url_match else httpx.URL(url_match.group(1))

                    items.append({
                        "title": sanitize_text(re.sub(r'<[^>]+>', '', title_match.group(2))),
                        "snippet": sanitize_text(re.sub(r'<[^>]+>', '', raw_snippet)),
                        "source_url": sanitize_url(str(target_url)),
                        "thumbnail_url": "",
                    })

            return items


duckduckgo_provider = DuckDuckGoProvider()
