"""
GTA 6 / Vice City Lore & Translation Dictionary
Maps real-world entities (tech corporations, government agencies, locations,
politicians, cars, social networks) to GTA HD/VI lore equivalents.
"""

import re
from typing import Dict, Tuple

LORE_TRANSLATIONS: Dict[str, str] = {
    # Locations
    "Florida": "Leonida",
    "Miami": "Vice City",
    "Orlando": "Ambrosia",
    "Tampa": "Port Gellhorn",
    "Key West": "Vice Keys",
    "Everglades": "Grassrivers",
    "Fort Lauderdale": "Ocean Beach",
    "Daytona Beach": "Lake Leonida",
    "Biscayne Bay": "Vice Bay",
    "United States": "Liberty & Leonida Union",
    "America": "The United States of Paranoia",
    "New York": "Liberty City",
    "Los Angeles": "Los Santos",
    "San Francisco": "San Fierro",
    "Las Vegas": "Las Venturas",

    # Tech Corporations & Internet
    "Apple": "Fruit Computers",
    "iPhone": "iFruit Phone",
    "iPad": "iFruit Pad",
    "MacBook": "FruitBook Pro",
    "Google": "Eyefind",
    "Alphabet": "Eyefind Holdings",
    "Microsoft": "MicroFlop",
    "Amazon": "GoPostal Prime",
    "Facebook": "LifeInvader",
    "Meta": "LifeInvader Global",
    "Instagram": "Snapmatic",
    "Twitter": "Bleeter",
    "X.com": "Bleeter 2.0",
    "Tweet": "Bleet",
    "Tweets": "Bleets",
    "TikTok": "Tikitok",
    "Uber": "Downtown Cab Co.",
    "Lyft": "Vice Rides",
    "Netflix": "Weazel+",
    "Spotify": "Radio Los Santos Stream",
    "Tesla": "Coil",
    "Nvidia": "Bilgeco",
    "OpenAI": "SyntheticMind Inc.",
    "ChatGPT": "ChatFIB",

    # Cryptocurrencies & Finance
    "Bitcoin": "BitBull",
    "Ethereum": "EtherShit",
    "Dogecoin": "PugCoin",
    "Crypto": "BAWSAQ Crypto Scams",
    "Wall Street": "BAWSAQ & LCN Exchange",
    "NYSE": "BAWSAQ",
    "NASDAQ": "LCN Exchange",
    "JPMorgan": "Fleeca Financial Group",
    "Bank of America": "Maze Bank",
    "Wells Fargo": "Pacific Standard Bank",
    "Federal Reserve": "Bank of Liberty",

    # Law Enforcement, Intelligence & Government
    "FBI": "FIB",
    "CIA": "IAA",
    "NSA": "IAA Cyber Division",
    "Police": "VCPD",
    "Miami Police": "VCPD Ocean Beach Precinct",
    "SWAT": "NOOSE",
    "Coast Guard": "Leonida Coastal Patrol",
    "Secret Service": "Executive Protection Agency",
    "White House": "Executive Mansion in Capital City",
    "Congress": "Leonida State Senate",
    "Mayor": "Mayor Jock Cranley",
    "Governor": "Governor of Leonida",

    # Automotive & Aerospace
    "Ferrari": "Grotti",
    "Lamborghini": "Pegassi",
    "Porsche": "Pfister",
    "BMW": "Übermacht",
    "Mercedes-Benz": "Benefactor",
    "Audi": "Obey",
    "Bugatti": "Truffade",
    "Aston Martin": "Dewbauchee",
    "Chevrolet": "Declasse",
    "Ford": "Vapid",
    "Dodge": "Bravado",
    "Toyota": "Karin",
    "Honda": "Dinka",
    "Nissan": "Annis",
    "Boeing": "Air Herler",
    "SpaceX": "Coil Aerospace",
    "NASA": "Leonida Space Center",

    # Politicians & Personalities
    "Donald Trump": "Governor Jock Cranley",
    "Joe Biden": "Governor Jock Cranley",
    "Elon Musk": "Avon Hertz",
    "Mark Zuckerberg": "Jay Norris",
    "Jeff Bezos": "Malcom Vane",
    "Taylor Swift": "Poppy Mitchell",
    "President": "Governor Jock Cranley",

    # Fast Food, Retail & Consumer
    "McDonald's": "Burger Shot",
    "Burger King": "Up-n-Atom Burger",
    "KFC": "Cluckin' Bell",
    "Starbucks": "Bean Machine Coffee",
    "Coca-Cola": "eCola",
    "Pepsi": "Sprunk",
    "Heineken": "Pißwasser",
    "Budweiser": "Blarneys Stout",
    "Walmart": "YouTool Superstore",
    "Target": "Binco Mega Mall",
    "Costco": "Whiz Wholesale Club",
    "Nike": "ProLaps Athletic",
    "Adidas": "Heat Athletic",
    "Rolex": "Crowex Watches",

    # Weapons & Security
    "Glock": "Combat Pistol",
    "Lockheed Martin": "Ammu-Nation Defense Systems",
    "Raytheon": "Vom Feuer Arms",
    "Gun store": "Ammu-Nation Outlet",
    "Gun shop": "Ammu-Nation Discount Supercenter",

    # News & Media
    "CNN": "Weazel News Live",
    "Fox News": "Weazel News 24/7",
    "MSNBC": "VCPR Public Broadcast",
    "The New York Times": "The Liberty Tree",
    "The Washington Post": "Vice City Inquirer",
    "BBC": "British Broadcast Propaganda",
}

LORE_DICTIONARY = LORE_TRANSLATIONS

# Precompile regex replacements sorted by longest key first to avoid partial overlap
_COMPILED_PATTERNS = [
    (re.compile(r"\b" + re.escape(k) + r"\b", re.IGNORECASE), v)
    for k, v in sorted(LORE_TRANSLATIONS.items(), key=lambda item: len(item[0]), reverse=True)
]


def translate_lore(text: str) -> str:
    """
    Translate real-world text into GTA 6 Vice City / Leonida lore equivalents
    """
    if not text or not isinstance(text, str):
        return ""

    result = text
    for pattern, replacement in _COMPILED_PATTERNS:
        result = pattern.sub(replacement, result)

    return result
