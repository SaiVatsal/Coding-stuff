"""
Tests for Satire Transformation Engine & Lore Dictionary (Python)
"""

import pytest
from app.services.satire.lore_dictionary import translate_lore, LORE_DICTIONARY
from app.services.satire.satire_engine import (
    satire_engine,
    calculate_market_impact,
)


def test_lore_dictionary_accurately_translates_real_world_entities():
    input_text = "Florida police and FBI agents raided Apple headquarters in Miami while Tesla stocks rose."
    output = translate_lore(input_text)

    assert "Leonida" in output, "Florida -> Leonida"
    assert "FIB" in output, "FBI -> FIB"
    assert "Fruit Computers" in output or "Fruit" in output, "Apple -> Fruit"
    assert "Vice City" in output, "Miami -> Vice City"
    assert "Coil" in output, "Tesla -> Coil"


def test_lore_dictionary_translates_media_politicians_and_social_networks():
    input_text = "CNN and Fox News reported on Twitter that Donald Trump posted on Instagram."
    output = translate_lore(input_text)

    assert "Weazel News" in output or "Public Liberty Online" in output
    assert "Bleeter" in output
    assert "Snapmatic" in output
    assert "Donald Love" in output or "Jock Cranley" in output


def test_satire_engine_heuristic_transformation_generates_satirical_headlines():
    result = satire_engine._transform_with_heuristics({
        "title": "Elon Musk announces new Tesla autopilot update in Florida",
        "snippet": "The tech CEO claims new autonomous features will prevent traffic delays across the state.",
        "category": "tech",
    })

    assert result.get("title")
    assert result.get("snippet")
    assert result.get("satirical_author")
    assert isinstance(result.get("market_impact"), float)
    assert -1.0 <= result["market_impact"] <= 1.0
    assert "Coil" in result["title"] or "Coil" in result["snippet"] or "Leonida" in result["title"] or "Leonida" in result["snippet"]


def test_satire_engine_market_impact_calculation_produces_valid_floats():
    positive = calculate_market_impact("Record profits, massive breakthrough surge, stock jumps 25%")
    assert positive > 0, f"Expected positive impact, got {positive}"
    assert positive <= 1.0

    negative = calculate_market_impact("Catastrophic fraud bankruptcy disaster, CEO arrested in investigation crash")
    assert negative < 0, f"Expected negative impact, got {negative}"
    assert negative >= -1.0

    neutral = calculate_market_impact("Regular quarterly meeting scheduled for Tuesday afternoon.")
    assert abs(neutral) <= 0.3, f"Expected near-neutral impact, got {neutral}"


@pytest.mark.asyncio
async def test_satire_engine_transform_content_orchestrates_fallback():
    transformed = await satire_engine.transform_content({
        "title": "SpaceX launches rocket from Florida space coast",
        "snippet": "NASA and SpaceX partnered for the latest orbital satellite launch.",
        "category": "news",
    })

    assert transformed.get("title")
    assert transformed.get("snippet")
    assert transformed.get("satirical_author")
    assert isinstance(transformed.get("market_impact"), float)
