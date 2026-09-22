// src/data/gameData.js
/**
 * ====================================
 * CORE GAME DATA DEFINITIONS (V2.0)
 * Source: Apex Drift Prompt Requirements / V2.0 Expansion
 * Purpose: Centralized static data store for all card types, cars, and stages.
 * ====================================
 */

// --- 1. STATS STRUCTURE ---
export const StatsKeys = {
    SPEED: "Speed",
    HANDLING: "Handling",
    ACCELERATION: "Acceleration",
    DURABILITY: "Durability",
};

/** @typedef {Object.<string, number>} Stats */


// --- 2. CAR CARD DATA (Starter & Shop Pool) ---
/**
 * @typedef {object} CarCard
 * @property {string} id - Unique ID for the car.
 * @property {string} name - Display name (e.g., "Crimson Comet").
 * @property {Stats} baseStats - Base stats (0-10). Total budget must be 20.
 * @property {number} maxDurability - The maximum durability this specific car has.
 */

export const StarterCars = [
    {
        id: 'car_a',
        name: 'Crimson Comet',
        baseStats: { Speed: 8, Handling: 3, Acceleration: 5, Durability: 4 },
        maxDurability: 10,
    },
    {
        id: 'car_b',
        name: 'Ghost Runner',
        baseStats: { Speed: 6, Handling: 8, Acceleration: 3, Durability: 3 },
        maxDurability: 8,
    },
    {
        id: 'car_c',
        name: 'Titan Beast',
        baseStats: { Speed: 4, Handling: 5, Acceleration: 7, Durability: 10 },
        maxDurability: 12,
    }
];

// Shop pool includes starters + upgrades/purchasable cars
/** @type {CarCard[]} */
export const ShopDatabaseCars = [
     // Example upgrade car: High speed but fragile
    { id: 'shop_nova', name: 'Nova Racer', baseStats: { Speed: 9, Handling: 2, Acceleration: 4, Durability: 3 }, maxDurability: 10 },
];

/** @type {CarCard[]} */
export const AllCars = [...StarterCars, ...ShopDatabaseCars];


// --- 3. ACTION CARD DATA (Templates & Shop) ---
/**
 * Defines the card mechanics and shop pricing structure.
 */
const SHOP_CARDS_BASE_PRICE = 50; // Base cost for new cars

/**
 * @typedef {object} ActionCardTemplate
 * @property {string} id - Unique ID/Name of the card.
 * @property {'common'|'rare'|'epic'} rarity - Rarity tier.
 * @property {'Boost'|'Draft'|'Grip'|'Repair'|'Nitro'} type - Card effect type.
 * @property {{[key: string]: number}} effectValue - The stat boost or utility provided (e.g., {Speed: 3}).
 * @property {number} price - Cost to buy from the shop, if applicable.
 */

export const ActionCardTemplates = [
    // --- Common Cards (Cost 10) ---
    { id: 'boost_1', rarity: 'common', type: 'Boost', effectValue: { Speed: 2 }, price: 10 },
    { id: 'draft_1', rarity: 'common', type: 'Draft', effectValue: { Speed: 3 }, price: 10 },
    { id: 'grip_1', rarity: 'common', type: 'Grip', effectValue: { Handling: 3 }, price: 10 },
    { id: 'repair_1', rarity: 'common', type: 'Repair', effectValue: { Durability: 2 }, price: 10 },

    // --- Rare Cards (Cost 35) ---
    { id: 'boost_2', rarity: 'rare', type: 'Boost', effectValue: { Speed: 4 }, price: 35 },
    { id: 'draft_2', rarity: 'rare', type: 'Draft', effectValue: { Speed: 5 }, price: 35 },
    { id: 'grip_2', rarity: 'rare', type: 'Grip', effectValue: { Handling: 6 }, price: 35 },
    { id: 'repair_2', rarity: 'rare', type: 'Repair', effectValue: { Durability: 4 }, price: 35 },

    // --- Epic Cards (Cost 80) ---
    { id: 'nitro_1', rarity: 'epic', type: 'Nitro', effectValue: { all: 5 }, price: 80 }, // Special placeholder for general boost
];


/** @type {ActionCardTemplate[]} */
export const InitialActionCards = [...ActionCardTemplates];

// --- Shop Database Structure ---
/** @type {{[key: string]: number}} - Maps card ID to its shop price. */
export const ShopDatabasePrices = {
    'boost_1': 10, 'boost_2': 35,
    'draft_1': 10, 'draft_2': 35,
    'grip_1': 10, 'grip_2': 35,
    'repair_1': 10, 'repair_2': 35,
    'nitro_1': 80,
};

// --- 4. STAGE DEFINITIONS ---

/**
 * Defines the primary mechanics and difficulty curve for each stage.
 */
export const StageDefinitions = [
    {
        id: 0,
        name: 'Sprint',
        primaryStat: StatsKeys.SPEED, // Focuses on top straight speed
        description: 'A pure sprint requiring maximum raw velocity.',
        difficultyCurve: (stageNum) => Math.min(5 + stageNum * 0.2, 10), // Starts at low difficulty and slightly increases
    },
    {
        id: 1,
        name: 'Rally',
        primaryStat: StatsKeys.ACCELERATION, // Off-road burst power
        description: 'Rough terrain requires rapid acceleration and maintaining momentum.',
        difficultyCurve: (stageNum) => Math.min(6 + stageNum * 0.2, 13),
    },
    {
        id: 2,
        name: 'Drift',
        primaryStat: StatsKeys.HANDLING, // Cornering ability is key
        description: 'High-skill cornering and controlled slide physics are necessary.',
        difficultyCurve: (stageNum) => Math.min(5 + stageNum * 0.2, 11),
    },
    {
        id: 3,
        name: 'Drag',
        primaryStat: StatsKeys.ACCELERATION, // Straight line muscle car power
        description: 'A brute force drag race measuring pure torque and quick launch.',
        difficultyCurve: (stageNum) => Math.min(7 + stageNum * 0.2, 14),
    },
    {
        id: 4,
        name: 'Endurance',
        primaryStat: StatsKeys.DURABILITY, // Overall condition matters most
        description: 'The final marathon requires consistent performance and maintaining structural integrity.',
        difficultyCurve: (stageNum) => Math.min(7 + stageNum * 0.2, 16),
    },
];

// --- END OF GAME DATA (V2.0) ---