"""
Satirical Transformation Engine
Orchestrates LLM / Heuristic rewrites of real-world search items and news
into GTA 6 Vice City / Leonida Weazel News satirical feeds.
"""

import json
import random
import httpx
from typing import Dict, List, Any, Optional

from app.config import settings
from app.utils.logger import logger
from app.utils.sanitizer import sanitize_text, sanitize_float
from app.services.satire.lore_dictionary import translate_lore
from app.services.satire.prompts import SATIRE_SYSTEM_PROMPT, build_satire_user_prompt

POSITIVE_SENTIMENT_KEYWORDS = [
    "profit", "surge", "record", "growth", "breakthrough", "rally", "gain",
    "launch", "billion", "merger", "boom", "success", "expand", "soar", "dividend", "jump"
]

NEGATIVE_SENTIMENT_KEYWORDS = [
    "crash", "plunge", "fraud", "lawsuit", "arrest", "scandal", "hack",
    "leak", "investigation", "recall", "layoff", "bankrupt", "crisis", "drop", "ban",
    "disaster", "catastrophic"
]

SATIRICAL_PREFIXES = [
    "Weazel News Exclusive: ",
    "Leonida Man Update: ",
    "BAWSAQ Market Alert: ",
    "Vice City Police Blotter: ",
    "Bleeter Viral Sensation: ",
    "FIB Leaked Memo: ",
    "Consumer Warning: ",
]

SATIRICAL_AUTHORS = [
    "Weazel News Wire",
    "Vice City Inquirer",
    "Bleeter Trending Desk",
    "BAWSAQ Market Desk",
    "VCPD Public Affairs Office",
    "Leonida Consumer Protection Coalition",
]


def calculate_market_impact(text: str) -> float:
    """
    Compute BAWSAQ market impact score (-1.0 to 1.0) based on keyword sentiment
    """
    if not text or not isinstance(text, str):
        return 0.0

    text_lower = text.lower()
    score = 0.0
    for kw in POSITIVE_SENTIMENT_KEYWORDS:
        if kw in text_lower:
            score += 0.25
    for kw in NEGATIVE_SENTIMENT_KEYWORDS:
        if kw in text_lower:
            score -= 0.35

    salt = (len(text) % 10) * 0.02 - 0.09
    total = score + salt if score != 0.0 else salt

    return float(sanitize_float(round(total, 2), default=0.0, min_val=-1.0, max_val=1.0))


class SatireEngine:
    def __init__(self):
        self.provider = settings.satire_provider.lower()

    async def satirize_batch(
        self, items: List[Dict[str, Any]], query: str = "", category: str = "web"
    ) -> List[Dict[str, Any]]:
        """
        Process a list of raw search results into satirical Vice City items
        """
        if not items:
            return []

        results = []
        for item in items:
            satirical = await self.transform_content(item, query, category)
            results.append(satirical)

        return results

    async def transform_content(
        self, item: Dict[str, Any], query: str = "", category: str = "web"
    ) -> Dict[str, Any]:
        """
        Transform a single raw item into GTA satire using configured provider or heuristic fallback
        """
        raw_title = item.get("title") or item.get("headline") or "Breaking News"
        raw_snippet = item.get("snippet") or item.get("body") or "No further details available."
        source_url = item.get("source_url") or item.get("url") or ""
        thumbnail_url = item.get("thumbnail_url") or ""

        # 1. Try LLM Provider if configured and key is present
        if self.provider == "openai" and settings.openai_api_key:
            try:
                transformed = await self._transform_openai(raw_title, raw_snippet, query, category)
                if transformed:
                    return self._format_result(transformed, source_url, thumbnail_url)
            except Exception as e:
                logger.warn(f"OpenAI satire generation failed: {e}. Using heuristic fallback.")

        elif self.provider == "ollama":
            try:
                transformed = await self._transform_ollama(raw_title, raw_snippet, query, category)
                if transformed:
                    return self._format_result(transformed, source_url, thumbnail_url)
            except Exception as e:
                logger.warn(f"Ollama satire generation failed: {e}. Using heuristic fallback.")

        # 2. Ultra-fast, deterministic rule-based Heuristic Transformer (Guaranteed 0ms latency)
        heuristic = self._transform_heuristic(raw_title, raw_snippet, query, category)
        return self._format_result(heuristic, source_url, thumbnail_url)

    def _transform_heuristic(
        self, raw_title: str, raw_snippet: str, query: str = "", category: str = "web"
    ) -> Dict[str, Any]:
        """
        Rule-based heuristic transformer translating real entities and generating satirical commentary
        """
        translated_title = translate_lore(raw_title)
        translated_snippet = translate_lore(raw_snippet)

        # Calculate sentiment and market impact score
        combined_text = f"{raw_title} {raw_snippet}".lower()
        impact = calculate_market_impact(combined_text)

        # Determine satirical author
        author = random.choice(SATIRICAL_AUTHORS)
        if "stock" in category or "market" in combined_text or "finance" in combined_text:
            author = "BAWSAQ Market Desk"
        elif "crime" in category or "police" in combined_text or "arrest" in combined_text:
            author = "VCPD Blotter Desk"
        elif "tech" in category or "phone" in combined_text or "crypto" in combined_text:
            author = "Eyefind Tech Review"

        # Apply satirical headline embellishment if not already present
        headline = translated_title
        if not any(headline.startswith(p) for p in SATIRICAL_PREFIXES) and len(headline) < 90:
            prefix = random.choice(SATIRICAL_PREFIXES)
            headline = f"{prefix}{headline}"

        # Construct GTA-style satirical body
        body = translated_snippet
        if len(body) < 150:
            body = f"{body} Local officials in Vice City recommend citizens invest heavily in ammunition and titanium deadbolts."

        return {
            "title": sanitize_text(headline, settings.max_title_length),
            "snippet": sanitize_text(body, settings.max_snippet_length),
            "satirical_author": author,
            "market_impact": impact,
        }

    def _transform_with_heuristics(
        self, item_or_title: Any, raw_snippet: str = "", query: str = "", category: str = "web"
    ) -> Dict[str, Any]:
        """
        Alias supporting dict or positional parameters for heuristic transformation
        """
        if isinstance(item_or_title, dict):
            raw_title = item_or_title.get("title") or item_or_title.get("headline") or "Breaking News"
            raw_snippet = item_or_title.get("snippet") or item_or_title.get("body") or "No further details available."
            category = item_or_title.get("category", category)
            query = item_or_title.get("query", query)
            return self._transform_heuristic(raw_title, raw_snippet, query, category)
        return self._transform_heuristic(item_or_title, raw_snippet, query, category)

    def _calculate_market_impact(self, text: str) -> float:
        """
        Compute BAWSAQ market impact score (-1.0 to 1.0) based on keyword sentiment
        """
        return calculate_market_impact(text)

    def _format_result(
        self, data: Dict[str, Any], source_url: str, thumbnail_url: str
    ) -> Dict[str, Any]:
        return {
            "title": sanitize_text(data.get("title", ""), settings.max_title_length),
            "snippet": sanitize_text(data.get("snippet", ""), settings.max_snippet_length),
            "source_url": source_url,
            "thumbnail_url": thumbnail_url,
            "satirical_author": sanitize_text(data.get("satirical_author", "Weazel News"), 64),
            "market_impact": sanitize_float(data.get("market_impact", 0.0)),
        }

    async def _transform_openai(
        self, title: str, snippet: str, query: str, category: str
    ) -> Optional[Dict[str, Any]]:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": settings.satire_model,
            "messages": [
                {"role": "system", "content": SATIRE_SYSTEM_PROMPT},
                {"role": "user", "content": build_satire_user_prompt(title, snippet, query, category)},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.8,
            "max_tokens": 256,
        }
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
        return None

    async def _transform_ollama(
        self, title: str, snippet: str, query: str, category: str
    ) -> Optional[Dict[str, Any]]:
        url = f"{settings.ollama_host}/api/generate"
        prompt = f"{SATIRE_SYSTEM_PROMPT}\n\n{build_satire_user_prompt(title, snippet, query, category)}"
        payload = {
            "model": settings.ollama_model,
            "prompt": prompt,
            "format": "json",
            "stream": False,
        }
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                return json.loads(data.get("response", "{}"))
        return None


satire_engine = SatireEngine()
