"""
Tests for BAWSAQ Stocks Service & Ticker Mapping (Python)
"""

import pytest
from app.services.stocks.ticker_map import (
    BAWSAQ_TICKER_MAP,
    get_ticker_by_real_symbol,
    get_ticker_by_bawsaq_symbol,
)
from app.services.stocks.bawsaq_service import bawsaq_service


def test_bawsaq_ticker_map_correctly_maps_real_tickers():
    fruit = get_ticker_by_bawsaq_symbol("FRUT")
    assert fruit is not None
    assert fruit["company_name"] == "Fruit Computers"
    assert fruit["real_ticker"] == "AAPL"

    coil = get_ticker_by_real_symbol("TSLA")
    assert coil is not None
    assert coil["ticker"] == "COIL"
    assert coil["company_name"] == "Coil Auto"

    life = get_ticker_by_real_symbol("META")
    assert life is not None
    assert life["ticker"] == "LIFE"
    assert life["company_name"] == "LifeInvader Network"


@pytest.mark.asyncio
async def test_bawsaq_stock_service_returns_full_market_listings():
    market = await bawsaq_service.get_bawsaq_market(force_refresh=True)

    assert market.get("exchange") == "BAWSAQ & LCN"
    assert isinstance(market.get("stocks"), list)
    assert len(market["stocks"]) >= 10
    assert isinstance(market.get("timestamp"), str)

    for stock in market["stocks"]:
        assert isinstance(stock.get("ticker"), str)
        assert isinstance(stock.get("company_name"), str)
        assert isinstance(stock.get("real_ticker"), str)
        assert isinstance(stock.get("price"), (int, float)) and stock["price"] > 0
        assert isinstance(stock.get("change_percent"), (int, float))
        assert isinstance(stock.get("description"), str)
        assert isinstance(stock.get("sector"), str)


@pytest.mark.asyncio
async def test_bawsaq_stock_service_retrieves_individual_stock():
    frut = await bawsaq_service.get_stock_by_ticker("FRUT")
    assert frut is not None
    assert frut["ticker"] == "FRUT"
    assert frut["company_name"] == "Fruit Computers"

    coil = await bawsaq_service.get_stock_by_ticker("TSLA")
    assert coil is not None
    assert coil["ticker"] == "COIL"

    unknown = await bawsaq_service.get_stock_by_ticker("NONEXISTENT_XYZ")
    assert unknown is None
