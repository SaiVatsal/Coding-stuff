"""
BAWSAQ Stocks API Routes
GET /api/v1/stocks/bawsaq
GET /api/v1/stocks/bawsaq/{ticker}
"""

from fastapi import APIRouter, Query, HTTPException, status
from app.services.stocks.bawsaq_service import bawsaq_service

router = APIRouter()


@router.get("/stocks/bawsaq")
async def get_bawsaq_market(
    refresh: bool = Query(default=False, description="Force refresh live stock feeds"),
):
    return await bawsaq_service.get_bawsaq_market(force_refresh=refresh)


@router.get("/stocks/bawsaq/{ticker}")
async def get_bawsaq_ticker(ticker: str):
    stock = await bawsaq_service.get_stock_by_ticker(ticker)
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "Ticker Not Found",
                "message": f"Stock ticker '{ticker}' is not listed on the BAWSAQ or LCN exchange.",
                "status": 404,
            },
        )
    return stock
