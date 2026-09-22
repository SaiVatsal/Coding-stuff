"""
Mock Data Generator & Fallback Provider for Eyefind Search
Produces ultra-realistic, immersive GTA 6 Vice City / Leonida search results
when external search APIs are offline, unreachable, or rate-limited.
"""

from typing import List, Dict, Any
from urllib.parse import quote
from app.utils.sanitizer import sanitize_text, sanitize_url

MOCK_DATABASE = [
    # Tech & Corporate
    {
        "keywords": ["apple", "iphone", "fruit", "tech", "phone", "macbook"],
        "results": [
            {
                "title": "Fruit Computers Unveils iFruit 16 with No Ports and Mandatory Retina Tracking",
                "snippet": "Fruit Computers CEO announces the new iFruit 16 will cost $2,499 and requires a continuous biometric subscription to unlock the lock screen.",
                "source_url": "https://eyefind.info/fruit-computers/ifruit16",
                "thumbnail_url": "http://127.0.0.1:8080/images/fruit_phone.jpg",
            },
            {
                "title": "LifeInvader Data Breach Exposes 400 Million Passwords to Russian Hackers",
                "snippet": "LifeInvader assures users that privacy is an illusion anyway and offers everyone a complimentary digital badge.",
                "source_url": "https://lifeinvader.com/security/update",
                "thumbnail_url": "http://127.0.0.1:8080/images/lifeinvader.jpg",
            },
        ],
    },
    # Automotive & Supercars
    {
        "keywords": ["car", "cars", "tesla", "ferrari", "grotti", "pegassi", "coil", "supercar"],
        "results": [
            {
                "title": "Coil Cyclone II Spontaneously Accelerates Into Swimming Pools Across Vice Beach",
                "snippet": "Coil Electric issues firmware update claiming aggressive pool navigation is an unadvertised amphibious safety feature.",
                "source_url": "https://eyefind.info/autos/coil-cyclone",
                "thumbnail_url": "http://127.0.0.1:8080/images/coil_car.jpg",
            },
            {
                "title": "Grotti Furia Sold Out in 12 Seconds to Corrupt South American Politicians",
                "snippet": "The new $3.8M Grotti Furia comes equipped with bullet-resistant tinted glass and custom champagne cooler.",
                "source_url": "https://legendarymotorsport.net/grotti/furia",
                "thumbnail_url": "http://127.0.0.1:8080/images/grotti.jpg",
            },
        ],
    },
    # Stocks & Finance
    {
        "keywords": ["stocks", "market", "bawsaq", "finance", "crypto", "bitcoin", "bitbull", "money"],
        "results": [
            {
                "title": "BAWSAQ Daily: BitBull Surges 400% After Influencer Bleet, Plummets 95% 10 Minutes Later",
                "snippet": "Day traders in Vice City financial district report severe mood swings while Fleeca Bank freezes withdrawals.",
                "source_url": "https://bawsaq.com/market/bitbull-analysis",
                "thumbnail_url": "http://127.0.0.1:8080/images/bawsaq_chart.jpg",
            },
            {
                "title": "Fleeca Bank Introduces $45 Fee for Checking Your Account Balance",
                "snippet": "Fleeca executives defend the fee as a \"motivational surcharge\" to encourage customers to earn more cash.",
                "source_url": "https://fleecabank.net/fees/update",
                "thumbnail_url": "http://127.0.0.1:8080/images/fleeca.jpg",
            },
        ],
    },
    # Crime & Vice City News
    {
        "keywords": ["crime", "police", "vcpd", "heist", "robbery", "drugs", "gator", "wetlands", "alligator"],
        "results": [
            {
                "title": "Leonida Man Arrested After Attempting to Rob Ammu-Nation with Live Alligator",
                "snippet": "The suspect claimed the reptile was an emotional support weapon and demanded 50 boxes of 12-gauge shotgun shells.",
                "source_url": "https://weazelnews.com/leonida-man-alligator-robbery",
                "thumbnail_url": "http://127.0.0.1:8080/images/gator_crime.jpg",
            },
            {
                "title": "VCPD Speed Boat Fleet Expanded Following High-Speed Contraband Chase in Starfish Island",
                "snippet": "Police Chief promises more sirens, more strobe lights, and zero reduction in marine smuggling.",
                "source_url": "https://vcpd.gov.lc/press/speedboat-expansion",
                "thumbnail_url": "http://127.0.0.1:8080/images/vcpd_boat.jpg",
            },
        ],
    },
    # Weapons & Defense
    {
        "keywords": ["gun", "guns", "weapon", "weapons", "ammu-nation", "defense"],
        "results": [
            {
                "title": "Ammu-Nation Annual Spring Clearance: Buy One Rocket Launcher, Get 500 Rounds of 9mm Free",
                "snippet": "Protect your front lawn from invasive iguanas and federal inspectors with heavy artillery discounts.",
                "source_url": "https://ammu-nation.net/promotions/spring-sale",
                "thumbnail_url": "http://127.0.0.1:8080/images/ammunation.jpg",
            },
        ],
    },
]


class MockSearchProvider:
    def __init__(self):
        self.name = "mock"

    async def search(self, query: str, max_results: int = 8) -> List[Dict[str, Any]]:
        q = (query or "").lower()
        matched = []

        for entry in MOCK_DATABASE:
            if any(kw in q for kw in entry["keywords"]):
                matched.extend(entry["results"])

        if len(matched) < max_results:
            synthetic = self._generate_synthetic_results(query, max_results - len(matched))
            matched.extend(synthetic)

        return matched[:max_results]

    def _generate_synthetic_results(self, query: str, count: int) -> List[Dict[str, Any]]:
        clean_query = sanitize_text(query or "Vice City")
        results = []

        templates = [
            {
                "title": lambda q: f"{q}: How Corporate Monopolies in Leonida Are Dominating the Industry",
                "snippet": lambda q: f"Recent market investigations into {q} reveal unprecedented profits, zero tax liabilities, and widespread lobbying across Vice City council.",
                "path": "market-analysis",
            },
            {
                "title": lambda q: f"Weazel News Investigation: Is {q} Secretly Run by FIB Informants?",
                "snippet": lambda q: f"Leaked memos suggest {q} operations in Port Gellhorn may be front organizations for clandestine government operations.",
                "path": "investigation",
            },
            {
                "title": lambda q: f"Bleeter Users Launch Viral Boycott Against {q} That Lasts Exactly 3 Hours",
                "snippet": lambda q: f"Hashtag trends surge across Leonida before users become distracted by new video of water scooter chase on Ocean Drive.",
                "path": "social-trends",
            },
            {
                "title": lambda q: f"Dynasty 8 Real Estate Reports Record Demand for Luxury Properties Near {q}",
                "snippet": lambda q: f"Penthouses overlooking Vice Beach continue to surge in value despite recurring helicopter dogfights overhead.",
                "path": "real-estate",
            },
        ]

        for i in range(count):
            tmpl = templates[i % len(templates)]
            results.append({
                "title": tmpl["title"](clean_query),
                "snippet": tmpl["snippet"](clean_query),
                "source_url": f"https://eyefind.info/search/{quote(clean_query.lower())}/{tmpl['path']}",
                "thumbnail_url": f"http://127.0.0.1:8080/images/eyefind_{(i % 4) + 1}.jpg",
            })

        return results


mock_provider = MockSearchProvider()


def generate_mock_results(query: str, mode: str = "satire", limit: int = 8) -> List[Dict[str, Any]]:
    q = (query or "").lower()
    matched = []

    for entry in MOCK_DATABASE:
        if any(kw in q for kw in entry["keywords"]):
            matched.extend(entry["results"])

    if len(matched) < limit:
        synthetic = mock_provider._generate_synthetic_results(query, limit - len(matched))
        matched.extend(synthetic)

    results = []
    for idx, item in enumerate(matched[:limit]):
        results.append({
            "title": item["title"],
            "snippet": item["snippet"],
            "source_url": item["source_url"],
            "thumbnail_url": item["thumbnail_url"],
            "satirical_author": "Weazel News Desk",
            "market_impact": 0.25 if idx % 2 == 0 else -0.15,
        })
    return results
