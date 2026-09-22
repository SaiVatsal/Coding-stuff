"""
API v1 Router Aggregator
"""

from fastapi import APIRouter
from app.api.v1.search import router as search_router
from app.api.v1.stocks import router as stocks_router
from app.api.v1.news import router as news_router
from app.api.v1.radio import router as radio_router

api_v1_router = APIRouter()

api_v1_router.include_router(search_router, tags=["Search"])
api_v1_router.include_router(stocks_router, tags=["Stocks"])
api_v1_router.include_router(news_router, tags=["News"])
api_v1_router.include_router(radio_router, tags=["Radio"])
