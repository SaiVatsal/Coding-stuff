/**
 * Comprehensive GTA 6 / Vice City Lore & Satire Translation Dictionary
 * Maps real-world corporations, agencies, locations, brands, and public figures
 * into their official GTA universe equivalents.
 */

const LORE_MAPPINGS = {
  // --- TECH & SOCIAL MEDIA ---
  tech: [
    { pattern: /\b(?:Apple Inc\.?|Apple|iPhone|iPad|MacBook|iOS)\b/gi, replacement: 'Fruit Computers' },
    { pattern: /\b(?:Tesla|Elon Musk(?:'s)? EV)\b/gi, replacement: 'Coil Auto' },
    { pattern: /\b(?:Twitter|X\.com|Tweets?|Tweeting)\b/gi, replacement: 'Bleeter' },
    { pattern: /\b(?:Facebook|Meta Platforms|Meta)\b/gi, replacement: 'LifeInvader' },
    { pattern: /\b(?:Instagram)\b/gi, replacement: 'Snapmatic' },
    { pattern: /\b(?:TikTok)\b/gi, replacement: 'TickleTok' },
    { pattern: /\b(?:Google|Alphabet)\b/gi, replacement: 'Eyefind Search' },
    { pattern: /\b(?:Microsoft|Windows)\b/gi, replacement: 'MicroFlop' },
    { pattern: /\b(?:Amazon|Prime Delivery)\b/gi, replacement: 'GoPostal' },
    { pattern: /\b(?:Nvidia|GeForce)\b/gi, replacement: 'Bilgeco GPUs' },
    { pattern: /\b(?:Uber|Lyft)\b/gi, replacement: 'Downtown Cab Co. App' },
    { pattern: /\b(?:Bitcoin|BTC|Cryptocurrency|Crypto)\b/gi, replacement: 'BitBull' },
    { pattern: /\b(?:Ethereum|ETH)\b/gi, replacement: 'E-Coins' },
  ],

  // --- GOVERNMENT, LAW ENFORCEMENT & MILITARY ---
  agencies: [
    { pattern: /\b(?:FBI|Federal Bureau of Investigation)\b/gi, replacement: 'FIB (Federal Investigation Bureau)' },
    { pattern: /\b(?:CIA|Central Intelligence Agency)\b/gi, replacement: 'IAA (International Affairs Agency)' },
    { pattern: /\b(?:NSA|National Security Agency)\b/gi, replacement: 'Doomsday Defense Subsystem' },
    { pattern: /\b(?:ATF|Bureau of Alcohol, Tobacco, Firearms)\b/gi, replacement: 'Ammu-Nation Regulatory Board' },
    { pattern: /\b(?:SWAT|Tactical Police)\b/gi, replacement: 'NOOSE (National Office of Security Enforcement)' },
    { pattern: /\b(?:Miami Police|Miami-Dade Police|MPD|Police Department)\b/gi, replacement: 'VCPD (Vice City Police Department)' },
    { pattern: /\b(?:Florida Highway Patrol|State Police|State Troopers)\b/gi, replacement: 'Leonida State Patrol' },
    { pattern: /\b(?:Coast Guard)\b/gi, replacement: 'Vice City Harbor Patrol' },
    { pattern: /\b(?:DEA|Drug Enforcement Administration)\b/gi, replacement: 'Narcotics Tactical Taskforce' },
  ],

  // --- GEOGRAPHY, CITIES & REGIONS ---
  geography: [
    { pattern: /\b(?:Florida)\b/gi, replacement: 'State of Leonida' },
    { pattern: /\b(?:Miami)\b/gi, replacement: 'Vice City' },
    { pattern: /\b(?:Miami Beach|South Beach)\b/gi, replacement: 'Vice Beach / Ocean Beach' },
    { pattern: /\b(?:Florida Keys|Key West)\b/gi, replacement: 'Gator Keys' },
    { pattern: /\b(?:Everglades)\b/gi, replacement: 'Leonida Wetlands & Swamplands' },
    { pattern: /\b(?:Tampa|Orlando|Jacksonville)\b/gi, replacement: 'Port Gellhorn / Ambrosia' },
    { pattern: /\b(?:Los Angeles|LA)\b/gi, replacement: 'Los Santos' },
    { pattern: /\b(?:New York|NYC)\b/gi, replacement: 'Liberty City' },
    { pattern: /\b(?:San Francisco)\b/gi, replacement: 'San Fierro' },
    { pattern: /\b(?:Las Vegas)\b/gi, replacement: 'Las Venturas' },
    { pattern: /\b(?:United States|USA|America)\b/gi, replacement: 'United States of Paranoia' },
  ],

  // --- AUTOMOTIVE BRANDS & LUXURY ---
  automotive: [
    { pattern: /\b(?:Ferrari)\b/gi, replacement: 'Grotti' },
    { pattern: /\b(?:Lamborghini)\b/gi, replacement: 'Pegassi' },
    { pattern: /\b(?:Porsche)\b/gi, replacement: 'Pfister' },
    { pattern: /\b(?:Mercedes-Benz|Mercedes|AMG)\b/gi, replacement: 'Benefactor' },
    { pattern: /\b(?:BMW)\b/gi, replacement: 'Übermacht' },
    { pattern: /\b(?:Audi)\b/gi, replacement: 'Obey' },
    { pattern: /\b(?:Ford)\b/gi, replacement: 'Vapid' },
    { pattern: /\b(?:Chevrolet|Chevy)\b/gi, replacement: 'Declasse' },
    { pattern: /\b(?:Dodge)\b/gi, replacement: 'Bravado' },
    { pattern: /\b(?:Toyota)\b/gi, replacement: 'Karin' },
    { pattern: /\b(?:Rolls-Royce)\b/gi, replacement: 'Enus' },
  ],

  // --- CONSUMER BRANDS, FOOD & DRINK ---
  consumer: [
    { pattern: /\b(?:Coca-Cola|Coke)\b/gi, replacement: 'eCola ("Deliciously Infectious!")' },
    { pattern: /\b(?:Sprite|7Up)\b/gi, replacement: 'Sprunk ("The Essence of Life")' },
    { pattern: /\b(?:Heineken|Budweiser|Corona|Beer)\b/gi, replacement: 'Pißwasser ("German Fighting Lager")' },
    { pattern: /\b(?:McDonald'?s|Burger King|Wendy'?s)\b/gi, replacement: 'Burger Shot / Cluckin\' Bell' },
    { pattern: /\b(?:Starbucks)\b/gi, replacement: 'The Bean Machine' },
    { pattern: /\b(?:Nike|Adidas)\b/gi, replacement: 'ProLaps Sports Apparel' },
    { pattern: /\b(?:Gucci|Louis Vuitton|Prada)\b/gi, replacement: 'Perseus / Didier Sachs' },
    { pattern: /\b(?:Walmart|Target)\b/gi, replacement: '24/7 Supermarket & Pawn' },
    { pattern: /\b(?:Gun Store|Gun Shop|Firearm Retailer)\b/gi, replacement: 'Ammu-Nation ("Protecting Your Rights")' },
  ],

  // --- MEDIA, JOURNALISM & ENTERTAINMENT ---
  media: [
    { pattern: /\b(?:CNN|Fox News|BBC|MSNBC|Reuters|Associated Press|AP News)\b/gi, replacement: 'Weazel News ("Confirming Your Prejudices")' },
    { pattern: /\b(?:New York Times|Washington Post|Wall Street Journal)\b/gi, replacement: 'Vice City Inquirer' },
    { pattern: /\b(?:TMZ|Page Six|Gossip)\b/gi, replacement: 'Bleeter VIP Gossip Desk' },
    { pattern: /\b(?:Hollywood)\b/gi, replacement: 'Vinewood Studios' },
    { pattern: /\b(?:Disney|Warner Bros)\b/gi, replacement: 'Richards Majestic Productions' },
  ],

  // --- CELEBRITIES & PERSONALITIES ---
  personalities: [
    { pattern: /\b(?:Elon Musk)\b/gi, replacement: 'Avon Hertz / Devin Weston' },
    { pattern: /\b(?:Mark Zuckerberg)\b/gi, replacement: 'Jay Norris (Ghost-AI)' },
    { pattern: /\b(?:Donald Trump|Joe Biden|President)\b/gi, replacement: 'Governor Jock Cranley / Sue Murry' },
    { pattern: /\b(?:Taylor Swift|Pop Star|Celebrity)\b/gi, replacement: 'Poppy Mitchell / Miranda Cowan' },
    { pattern: /\b(?:Jeff Bezos)\b/gi, replacement: 'GoPostal CEO Malcom Vane' },
  ],
};

const SATIRICAL_AUTHORS = [
  'Weazel News Breaking Desk',
  'Vice City Inquirer Editorial Board',
  'Bleeter Trending Bot #409',
  'Public Liberty Online Syndicate',
  'VCPR Investigative Correspondent',
  'BAWSAQ Daily Shakedown',
  'CNT Network Sensationalism Desk',
  'Ammu-Nation Monthly Gazette',
  'Port Gellhorn Gazette',
  'Leonida Wildlife & Armed Citizens League',
];

const SATIRICAL_TEMPLATES = {
  newsSuffixes: [
    ' Citizens are advised to stay indoors and keep their shotguns loaded.',
    ' Stock prices are currently swinging wildly as hedge fund algorithms enter a panic state.',
    ' City officials have denied all responsibility while boarding private helicopters.',
    ' The VCPD has launched an immediate investigation into whoever leaked the evidence.',
    ' Local convenience stores report complete sellouts of ammo, Sprunk, and EgoChaser bars.',
    ' LifeInvader users have expressed outrage through automated like buttons.',
    ' Meanwhile, real estate prices in Ocean Beach just doubled for no discernible reason.',
    ' Weazel News will continue to broadcast sensationalized updates every four minutes.',
  ],

  satiricalPunches: [
    'In what local authorities describe as "just another Tuesday in Leonida", ',
    'Unchecked corporate greed reached new artistic heights today as ',
    'Vice City residents celebrated with celebratory gunfire following reports that ',
    'Defying basic economic theory and federal laws, ',
    'Amid mounting corruption charges that were promptly dismissed by sympathetic judges, ',
    'In a live televised press conference interrupted twice by alligator wrestling, ',
    'Armed with zero evidence and unlimited venture capital funding, ',
  ],
};

/**
 * Translate real-world text into GTA Vice City lore
 * @param {string} text - Raw input string
 * @returns {string} Translated string
 */
function translateLore(text) {
  if (!text) return '';
  let str = String(text);
  for (const group of Object.values(LORE_MAPPINGS)) {
    for (const mapping of group) {
      str = str.replace(mapping.pattern, mapping.replacement);
    }
  }
  return str;
}

module.exports = {
  LORE_MAPPINGS,
  LORE_DICTIONARY: LORE_MAPPINGS,
  SATIRICAL_AUTHORS,
  SATIRICAL_TEMPLATES,
  translateLore,
};
