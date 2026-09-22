"""
Unreal Engine 5.5 Compatible Data Schemas (Pydantic v2)
Directly mirrors C++ Structs:
- FEyefindSearchResultItem
- FBAWSAQStockData
- FOnLiveRadioBulletinReceived
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class EyefindSearchResultItem(BaseModel):
    title: str = Field(..., description="Satirical headline or cleaned page title")
    snippet: str = Field(..., description="Satirical summary or cleaned snippet")
    source_url: str = Field(default="", description="Sanitized source URL")
    thumbnail_url: str = Field(default="", description="Sanitized image thumbnail URL")
    satirical_author: str = Field(default="Eyefind Direct Web Feed", description="GTA in-game author or source")
    market_impact: float = Field(default=0.0, description="Market impact metric between -1.0 and 1.0")


class EyefindSearchResponse(BaseModel):
    query: str
    mode: str = "satire"
    category: str = "web"
    count: int
    results: List[EyefindSearchResultItem]
    provider: str
    cached: bool = False
    timestamp: str


class BAWSAQStockData(BaseModel):
    ticker: str = Field(..., description="BAWSAQ in-game symbol (e.g. FRUT, COIL, BTBL)")
    company_name: str = Field(..., description="Satirical company name")
    real_ticker: str = Field(..., description="Real-world stock ticker (e.g. AAPL, TSLA, BTC)")
    price: float = Field(..., description="Current stock price")
    change_percent: float = Field(..., description="Daily percentage price fluctuation")
    description: str = Field(..., description="Satirical company description or breaking event")
    sector: str = Field(..., description="Market sector")


class BAWSAQMarketResponse(BaseModel):
    exchange: str = "BAWSAQ & LCN"
    timestamp: str
    count: int
    stocks: List[BAWSAQStockData]


class TrendingNewsItem(BaseModel):
    id: str
    headline: str
    title: str
    body: str
    snippet: str
    original_headline: str
    source: str
    satirical_author: str
    source_url: str
    thumbnail_url: str
    category: str
    location: str = "Leonida / Vice City"
    timestamp: str
    satirical_audio_url: str
    audio_url: str
    market_impact: float = 0.0


class TrendingNewsResponse(BaseModel):
    feed: str = "Weazel News Live Wire"
    region: str = "Leonida / Vice City Metro"
    headline_ticker: str
    count: int
    timestamp: str
    trending_news: List[TrendingNewsItem]
    articles: List[TrendingNewsItem]


class RadioStation(BaseModel):
    id: str
    name: str
    genre: str
    format: str
    dj: str
    tagline: str


class RadioBulletinPacket(BaseModel):
    type: str = "RADIO_BULLETIN"
    bulletin_id: str
    id: str
    station: str
    station_id: str
    headline: str
    script: str
    dj_name: str
    audio_url: str
    timestamp: str
    severity: str = "breaking"


class RadioBroadcastRequest(BaseModel):
    headline: str
    script: str
    station_id: str = "weazel-news-247"
    audio_url: Optional[str] = None


class RadioBroadcastResponse(BaseModel):
    status: str = "success"
    message: str
    bulletin: RadioBulletinPacket
