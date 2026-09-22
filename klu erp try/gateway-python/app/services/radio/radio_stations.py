"""
In-Game Radio Station Profiles & Commercial Sponsors
Vice City / Leonida Radio Network
"""

from typing import List, Dict, Any, Optional

RADIO_STATIONS: List[Dict[str, Any]] = [
    {
        "id": "weazel-news-247",
        "aliases": ["weazel_news", "weazel-news", "weazel"],
        "name": "Weazel News 24/7",
        "genre": "News & Talk",
        "format": "News / Talk / Propaganda",
        "dj": "John Smith & Amy Sheckenhausen",
        "tagline": "Confirming Your Prejudices Around the Clock",
    },
    {
        "id": "vcpr",
        "aliases": ["vice-city-public-radio", "vcpr_radio"],
        "name": "Vice City Public Radio (VCPR)",
        "genre": "Public Talk & Debate",
        "format": "Public Talk & Intellectual Pretentiousness",
        "dj": "Maurice Chavez",
        "tagline": "Because Ignorance is No Longer an Excuse",
    },
    {
        "id": "flash-fm",
        "aliases": ["flash_fm", "flash"],
        "name": "Flash FM",
        "genre": "80s Synthpop & Dance",
        "format": "Pop / Synthwave / High Energy",
        "dj": "Toni",
        "tagline": "Music For the Me Decade and Beyond",
    },
    {
        "id": "wave-103",
        "aliases": ["wave_103", "wave"],
        "name": "Wave 103",
        "genre": "New Wave & Post-Punk",
        "format": "Post-Punk / Darkwave",
        "dj": "Adam First",
        "tagline": "The Sound of the Future, Recorded Yesterday",
    },
    {
        "id": "radio-espantoso",
        "aliases": ["radio_espantoso", "espantoso"],
        "name": "Radio Espantoso",
        "genre": "Latin Jazz & Salsa",
        "format": "Latin Jazz / Salsa / Mambo",
        "dj": "Pepe",
        "tagline": "El Sonido Caliente de Vice City",
    },
    {
        "id": "wildstyle",
        "aliases": ["wildstyle_pirate", "wildstyle-pirate-radio"],
        "name": "Wildstyle Pirate Radio",
        "genre": "Hip Hop & Electro",
        "format": "Old School Hip Hop / Electro Funk",
        "dj": "Mr. Magic",
        "tagline": "Broadcasting Illegally From an Abandoned Warehouse",
    },
]

COMMERCIAL_SPONSORS: List[Dict[str, str]] = [
    {
        "product": "Sprunk",
        "slogan": "The Essence of Life",
        "script": "Need an ungodly surge of pure caffeine and radioactive green sugar? Grab a Sprunk! Side effects include heart palpitations and immediate euphoria.",
    },
    {
        "product": "eCola",
        "slogan": "Deliciously Infectious",
        "script": "Why drink water when you can drink eCola? Packed with 400 grams of corn syrup per can. eCola: Put some disease in your diet!",
    },
    {
        "product": "Ammu-Nation",
        "slogan": "Protecting Freedom Since 1968",
        "script": "Is your neighbor looking at your driveway funny? Visit Ammu-Nation today! Full-auto assault rifles now 20% off with any valid driver license or crayon drawing.",
    },
    {
        "product": "Pißwasser",
        "slogan": "You Can Always Drink More",
        "script": "Pißwasser! The German export beer that makes you forget your wife, your mortgage, and why you are driving on the sidewalk!",
    },
    {
        "product": "EgoChaser",
        "slogan": "It is All About You",
        "script": "EgoChaser Energy Bars! Made with 100% processed synthetic whey and pure arrogance. Fuel your vanity today.",
    },
    {
        "product": "Dynasty 8 Real Estate",
        "slogan": "Overpriced Properties for Corrupt Elites",
        "script": "Looking for a fortified penthouse with a helipad and zero building permits? Dynasty 8 has your dream crime fortress waiting in Starfish Island.",
    },
]

DJ_CHATTER: List[Dict[str, str]] = [
    {
        "station": "Flash FM",
        "dj": "Toni",
        "script": "Hey Vice City, Toni here! If you are stuck in traffic on Ocean Drive because another supercar caught fire, just turn up the volume and dance through the smoke!",
    },
    {
        "station": "Wave 103",
        "dj": "Adam First",
        "script": "You are listening to Wave 103. The outside world is collapsing, but inside your synthesizer, everything is perfectly sterile and neon.",
    },
    {
        "station": "VCPR",
        "dj": "Maurice Chavez",
        "script": "Welcome back to Pressing Issues on VCPR. Today we ask our panel: Are armed alligators actually lowering the crime rate, or just eating the evidence?",
    },
]


def get_all_stations() -> List[Dict[str, Any]]:
    return RADIO_STATIONS


def get_station_by_id(station_id: Optional[str]) -> Optional[Dict[str, Any]]:
    if not station_id:
        return None
    clean = str(station_id).lower().strip()
    normalized = clean.replace("-", "").replace("_", "")

    for s in RADIO_STATIONS:
        if s["id"] == clean or s["id"].replace("-", "").replace("_", "") == normalized:
            return s
        for alias in s.get("aliases", []):
            if alias == clean or alias.replace("-", "").replace("_", "") == normalized:
                return s
    return None
