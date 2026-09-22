"""
BAWSAQ In-Game Stock Exchange Service
Aggregates live stock and crypto data (Yahoo Finance / CoinGecko API)
and translates real-world companies into GTA lore equivalents with satirical commentary.
Strictly adheres to Unreal Engine 5.5 `FBAWSAQStockData` struct layout.
"""

import math
import time
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import httpx

from app.config import settings
from app.utils.logger import logger
from app.utils.sanitizer import sanitize_text
from app.services.stocks.ticker_map import BAWSAQ_TICKERS


class BawsaqService:
    def __init__(self):
        self.cache: Optional[Dict[str, Any]] = None
        self.last_cache_time: float = 0.0
        self.cache_ttl_seconds: float = float(settings.stocks_cache_ttl_seconds)

    async def get_bawsaq_market(self, force_refresh: bool = False) -> Dict[str, Any]:
        now = time.time()
        if not force_refresh and self.cache and (now - self.last_cache_time < self.cache_ttl_seconds):
            return self.cache

        logger.info("Updating BAWSAQ stock indices from live market data...")

        tasks = [self._fetch_stock_data(def_item) for def_item in BAWSAQ_TICKERS]
        stocks = await asyncio.gather(*tasks)

        payload = {
            "exchange": "BAWSAQ & LCN",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "count": len(stocks),
            "stocks": list(stocks),
        }

        self.cache = payload
        self.last_cache_time = now

        return payload

    async def get_stock_by_ticker(self, ticker: Optional[str]) -> Optional[Dict[str, Any]]:
        if not ticker:
            return None
        upper = ticker.upper().strip()

        market = await self.get_bawsaq_market()
        for s in market.get("stocks", []):
            if s.get("ticker") == upper or s.get("real_ticker") == upper:
                return s

        return None

    async def _fetch_stock_data(self, def_item: Dict[str, Any]) -> Dict[str, Any]:
        current_price = float(def_item.get("base_price", 100.0))
        change_percent = 0.0

        # Try fetching live Yahoo Finance Quote
        live_data = await self._query_yahoo_finance(def_item.get("real_ticker", ""))

        if live_data and live_data.get("price", 0.0) > 0:
            current_price = live_data["price"]
            change_percent = live_data["changePercent"]
        else:
            # Fallback to high-fidelity simulated volatility
            simulated = self._generate_simulated_fluctuation(def_item)
            current_price = simulated["price"]
            change_percent = simulated["changePercent"]

        # Dynamic satirical description based on market movement
        description = def_item.get("description", "")
        company_name = def_item.get("company_name", "")
        if change_percent > 3.0:
            description = (
                f"{company_name} shares rocket {change_percent:.1f}% as CEO announces "
                "massive layoffs and record executive yacht bonuses."
            )
        elif change_percent < -3.0:
            description = (
                f"{company_name} plummets {abs(change_percent):.1f}% amid FIB raid on "
                "headquarters in Downtown Vice City."
            )

        return {
            "ticker": sanitize_text(def_item.get("ticker", ""), 8),
            "company_name": sanitize_text(company_name, 64),
            "real_ticker": sanitize_text(def_item.get("real_ticker", ""), 8),
            "price": round(float(current_price), 2),
            "change_percent": round(float(change_percent), 2),
            "description": sanitize_text(description, settings.max_snippet_length),
            "sector": sanitize_text(def_item.get("sector", "General"), 64),
        }

    async def _query_yahoo_finance(self, real_ticker: str) -> Optional[Dict[str, Any]]:
        if not real_ticker:
            return None
        try:
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{httpx.URL(real_ticker)}?interval=1d&range=1d"
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            async with httpx.AsyncClient(timeout=2.5) as client:
                res = await client.get(url, headers=headers)
                if res.status_code != 200:
                    return None

                data = res.json()
                results = data.get("chart", {}).get("result", [])
                if results and "meta" in results[0]:
                    meta = results[0]["meta"]
                    if "regularMarketPrice" in meta:
                        price = float(meta["regularMarketPrice"])
                        prev_close = float(meta.get("previousClose") or meta.get("chartPreviousClose") or price)
                        change_percent = ((price - prev_close) / prev_close) * 100.0 if prev_close != 0 else 0.0
                        return {"price": price, "changePercent": change_percent}
        except Exception:
            # Ignore network timeout and use simulated dynamics
            pass
        return None

    def _generate_simulated_fluctuation(self, def_item: Dict[str, Any]) -> Dict[str, Any]:
        now = time.time()
        time_step = int(now // 30)  # updates every 30s
        ticker = def_item.get("ticker", "")
        seed = self._hash_string(f"{ticker}_{time_step}")

        # Sine wave + pseudo-random noise
        noise = ((seed % 1000) - 500) / 500.0  # -1.0 to 1.0
        wave = math.sin(now / 120.0 + (seed % 10))

        volatility = float(def_item.get("volatility", 1.0))
        total_delta_pct = (noise * 0.7 + wave * 0.3) * volatility * settings.volatility_multiplier
        base_price = float(def_item.get("base_price", 100.0))
        current_price = max(1.0, base_price * (1.0 + total_delta_pct / 100.0))

        return {
            "price": current_price,
            "changePercent": total_delta_pct,
        }

    def _hash_string(self, s: str) -> int:
        hash_val = 0
        for char in s:
            hash_val = ((hash_val << 5) - hash_val + ord(char)) & 0xFFFFFFFF
        if hash_val >= 0x80000000:
            hash_val -= 0x100000000
        return abs(hash_val)


bawsaq_service = BawsaqService()
