"""
Tests for Eyefind Search Service & Mock Generator (Python)
"""

import time
import pytest
from app.services.search.mock_provider import generate_mock_results
from app.services.search.search_service import search_service


def test_mock_search_provider_generates_contextual_mock_items():
    results = generate_mock_results("police car chase", "satire", 5)
    assert len(results) == 5

    for item in results:
        assert item.get("title"), "Must have title"
        assert item.get("snippet"), "Must have snippet"
        assert item.get("source_url"), "Must have source_url"
        assert item.get("thumbnail_url"), "Must have thumbnail_url"
        assert item.get("satirical_author"), "Must have satirical_author"
        assert isinstance(item.get("market_impact"), float)
        assert -1.0 <= item["market_impact"] <= 1.0


@pytest.mark.asyncio
async def test_search_service_executes_search_with_satire_mode():
    search_service.clear_cache()
    response = await search_service.execute_search("weapons ammunition military", "satire", "web", 5)

    assert response.get("query")
    assert response.get("mode") == "satire"
    assert response.get("category") == "web"
    assert isinstance(response.get("results"), list)
    assert len(response["results"]) > 0
    assert response.get("count", 0) > 0
    assert isinstance(response.get("cached"), bool)

    # Verify UE5 FEyefindSearchResultItem schema compliance
    first = response["results"][0]
    assert isinstance(first.get("title"), str)
    assert isinstance(first.get("snippet"), str)
    assert isinstance(first.get("source_url"), str)
    assert isinstance(first.get("thumbnail_url"), str)
    assert isinstance(first.get("satirical_author"), str)
    assert isinstance(first.get("market_impact"), float)


@pytest.mark.asyncio
async def test_search_service_caches_search_results_in_lru_cache():
    query = f"lifeinvader data privacy test {time.time()}"
    first_call = await search_service.execute_search(query, "satire", "web", 3)
    assert first_call.get("cached") is False

    second_call = await search_service.execute_search(query, "satire", "web", 3)
    assert second_call.get("cached") is True
    assert len(second_call["results"]) == len(first_call["results"])


@pytest.mark.asyncio
async def test_search_service_handles_direct_mode():
    response = await search_service.execute_search("sports car", "direct", "web", 3)
    assert response.get("mode") == "direct"
    assert len(response.get("results", [])) > 0
