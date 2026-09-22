"""
Trending News Ingestion Service
Ingests live news feeds, rewrites headlines and stories into Vice City / Leonida Weazel News,
and attaches in-game audio URLs and market impact metrics.
"""

import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from app.config import settings
from app.utils.logger import logger
from app.utils.sanitizer import sanitize_text, sanitize_payload

BASE_NEWS_SEEDS: List[Dict[str, Any]] = [
    {
        "id": "weazel-leonida-001",
        "headline": "Leonida Legislature Legalizes Armed Alligators as Official Home Security Systems",
        "body": "Lawmakers in Capital City unanimously pass bill granting property owners the right to mount laser sights on domestic swamp reptiles. Insurance companies immediately double all premiums.",
        "original_headline": "State Approves New Wildlife and Property Protection Measures",
        "source": "Weazel News",
        "category": "politics",
        "market_impact": 0.15,
    },
    {
        "id": "weazel-tech-002",
        "headline": 'Fruit Computers Removes Screen from Next iFruit: "Viewing Content Causes Eyestrain"',
        "body": "Fruit Computers stock jumps 8% as CEO announces users will now simply imagine their emails while wearing $4,000 titanium contact lenses. Pre-orders crash the BAWSAQ exchange.",
        "original_headline": "Tech Giant Unveils Minimalist Wearable Device Lineup",
        "source": "Vice City Inquirer",
        "category": "tech",
        "market_impact": 0.4,
    },
    {
        "id": "weazel-crime-003",
        "headline": "Port Gellhorn Man Attempts High-Speed Jet Ski Getaway Through Luxury Hotel Lobby",
        "body": "VCPD confirms suspect successfully navigated three flights of stairs and the VIP cocktail lounge before colliding with a bronze fountain dedicated to Mayor Jock Cranley.",
        "original_headline": "Watercraft Pursuit Ends Inside Coastal Hotel Complex",
        "source": "Weazel News",
        "category": "crime",
        "market_impact": -0.1,
    },
    {
        "id": "weazel-finance-004",
        "headline": 'Fleeca Bank CEO Disappears to Private Island After Announcing "Negative Interest Checking"',
        "body": 'Customers discover their account balances now drain by 2% per hour to pay for server maintenance and yacht fuel. Regulators declare the practice "innovative financial engineering".',
        "original_headline": "Banking Sector Faces Scrutiny Over New Digital Account Fees",
        "source": "BAWSAQ Market Desk",
        "category": "economy",
        "market_impact": -0.65,
    },
    {
        "id": "weazel-social-005",
        "headline": "LifeInvader Influencer Arrested for Faking Kidnapping to Boost Bleeter Engagement",
        "body": "The 22-year-old lifestyle coach staged a dramatic hostage situation from a penthouse in Ocean Beach, gaining 1.4 million followers before ordering food delivery under his verified name.",
        "original_headline": "Social Media Creator Faces Charges for False Emergency Report",
        "source": "Bleeter Trending",
        "category": "lifestyle",
        "market_impact": 0.05,
    },
    {
        "id": "weazel-auto-006",
        "headline": "Coil Electric Recalls 50,000 Supercars After Self-Driving Feature Chooses to Race Police",
        "body": "Coil issues over-the-air statement stating the AI was simply demonstrating superior horsepower and handling against standard VCPD cruisers.",
        "original_headline": "Electric Automaker Issues Software Update Following Traffic Incidents",
        "source": "Vice City Inquirer",
        "category": "tech",
        "market_impact": -0.3,
    },
    {
        "id": "weazel-defense-007",
        "headline": 'Ammu-Nation Introduces "Buy Two Grenades, Get a Free Kids Meal" Happy Hour',
        "body": "Family values groups applaud the promotion, noting that firearm safety begins at early dinner time across all Leonida households.",
        "original_headline": "Retailer Launches Controversial Summer Promotion Campaign",
        "source": "Weazel News",
        "category": "lifestyle",
        "market_impact": 0.25,
    },
]


class NewsService:
    def __init__(self):
        self.cache: Optional[Dict[str, Any]] = None
        self.last_cache_time: float = 0.0
        self.cache_ttl_seconds: float = float(settings.news_cache_ttl_seconds)

    async def get_trending_news(self, force_refresh: bool = False) -> Dict[str, Any]:
        now = time.time()
        if not force_refresh and self.cache and (now - self.last_cache_time < self.cache_ttl_seconds):
            return self.cache

        logger.info("Ingesting and translating trending news for Vice City / Leonida...")

        ingested_news = list(BASE_NEWS_SEEDS)

        try:
            live_items = await self._fetch_live_news_seeds()
            if live_items and len(live_items) > 0:
                ingested_news = live_items
        except Exception as err:
            logger.warn(f"Live news ingestion failed, using satirical base seeds: {err}")

        formatted_news = []
        now_ms = int(now * 1000)

        for index, item in enumerate(ingested_news):
            news_id = item.get("id") or f"wn-{now_ms}-{index}"
            audio_url = f"{settings.audio_cdn_url}/bulletins/{news_id}.mp3"
            headline = sanitize_text(item.get("headline") or item.get("title", ""), settings.max_title_length)
            body = sanitize_text(item.get("body") or item.get("snippet", ""), settings.max_snippet_length)
            source = sanitize_text(item.get("source") or item.get("satirical_author", "Weazel News"), 64)
            category = sanitize_text(item.get("category", "general"), 32)
            ts = datetime.fromtimestamp(now - index * 180, timezone.utc).isoformat()
            market_impact = float(item.get("market_impact", 0.0))

            formatted_news.append({
                "id": sanitize_text(news_id, 64),
                "headline": headline,
                "title": headline,
                "body": body,
                "snippet": body,
                "original_headline": sanitize_text(item.get("original_headline") or headline, settings.max_title_length),
                "source": source,
                "satirical_author": source,
                "source_url": f"https://weazelnews.vicecity/article/{news_id}",
                "thumbnail_url": f"https://weazelnews.vicecity/images/{category}.jpg",
                "category": category,
                "location": "Leonida / Vice City",
                "timestamp": ts,
                "satirical_audio_url": audio_url,
                "audio_url": audio_url,
                "market_impact": market_impact,
            })

        sanitized_articles = sanitize_payload(formatted_news)

        payload = {
            "feed": "Weazel News Live Wire",
            "region": "Leonida / Vice City Metro",
            "headline_ticker": " +++ ".join(n["headline"] for n in sanitized_articles),
            "count": len(sanitized_articles),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "trending_news": sanitized_articles,
            "articles": sanitized_articles,
        }

        self.cache = payload
        self.last_cache_time = now

        return payload

    async def _fetch_live_news_seeds(self) -> Optional[List[Dict[str, Any]]]:
        from app.services.search.search_service import search_service

        search_res = await search_service.execute_search("breaking news technology economy crime", "satire", "news")
        if search_res and search_res.get("results") and len(search_res["results"]) >= 3:
            now_ms = int(time.time() * 1000)
            return [
                {
                    "id": f"wn-live-{now_ms}-{i}",
                    "headline": r.get("title", ""),
                    "body": r.get("snippet", ""),
                    "original_headline": r.get("title", ""),
                    "source": r.get("satirical_author") or "Weazel News Wire",
                    "category": "economy" if i % 2 == 0 else "crime",
                    "market_impact": r.get("market_impact", 0.0),
                }
                for i, r in enumerate(search_res["results"])
            ]
        return None


news_service = NewsService()
