// src/store/useStore.js
import { useState, useCallback, useMemo } from 'react';
import { StarterCars, ActionCardTemplates, StageDefinitions, StatsKeys } from '../data/gameData';

// --- INITIALIZATION CONSTANTS ---
const INITIAL_CURRENCY = 50;
const STARTING_CAR_ID = StarterCars[0].id; // Use the first car as default starting point

/**
 * Global state hook for the Apex Drift game.
 * This simulates a Zustand store pattern and handles all deterministic game logic.
 */
export const useGameStore = () => {
    const [gameState, setGameState] = useState(null); // null when game hasn't started

    // --- GAME STATE STRUCTURE & LOGIC (Encapsulated in memo to prevent unnecessary re-runs) ---

    // Use useCallback and useMemo pattern for complex logic encapsulation within a hook structure.
    const { startGame, drawHand, playCardsAndResolve, advanceStage } = useMemo(() => {

        // Initial state structure definition
        const initialStateTemplate = {
            currentStageIndex: -1, // -1 indicates no stage started
            totalCurrency: 0,
            xpPerCar: {},
            cars: Array(3).fill(null), // Will be populated by startGame
            hand: [],
            gameStateActive: false,
        };

        /**
         * Initializes the game state for a new session.
         */
        const startGame = useCallback((initialCars) => {
            const initialXp = {};
            initialCars.forEach(car => {
                initialXp[car.id] = 1; // Start at level 1
            });

            setGameState({
                ...initialStateTemplate,
                currentStageIndex: 0, // Starting on Stage 0 (Sprint)
                totalCurrency: INITIAL_CURRENCY,
                xpPerCar: initialXp,
                cars: initialCars,
                hand: [],
                gameStateActive: true,
            });
        }, []);


        /**
         * Selects a random hand of cards for the current stage.
         * @param {string} primaryStat - The primary stat of the upcoming stage (e.g., 'Speed').
         */
        const drawHand = useCallback((primaryStat) => {
            // Logic: In a full build, this would query the card database and remove used cards/modify rarity counts.
            console.log(`[STORE LOGIC] Drawing hand for ${primaryStat} stage.`);

            // Mocking drawing 4 unique templates available in the game's deck pool (use initial set)
            const newCards = ActionCardTemplates.slice(0, 4);
            setGameState(prev => ({ ...prev, hand: [...newCards] }));
        }, []);


        /**
         * Calculates the final score and updates car stats based on played cards.
         * @param {string} carId - The ID of the selected car.
         * @param {ActionCard[]} playedCards - The cards used in this round.
         */
        const playCardsAndResolve = useCallback((carId, playedCards) => {
            setGameState(prev => {
                if (!prev || !prev.cars[0] || prev.currentStageIndex < 0) return prev;

                // --- STAT CALCULATION START ---
                const currentStageDef = StageDefinitions[prev.currentStageIndex];
                const primaryStatKey = currentStageDef.primaryStat;
                const activeCar = prev.cars.find(c => c.id === carId);

                if (!activeCar) return prev;

                // 1. Base Stat contribution (limited by the stage's focus stat for a single stat boost)
                let baseStatValue = activeCar.baseStats[primaryStatKey] || 0;

                // 2. Card Bonuses Aggregation
                let cardBonus = { Speed: 0, Handling: 0, Acceleration: 0, Durability: 0 };
                playedCards.forEach(card => {
                    if (card.type === 'Nitro') {
                        // Nitro grants +5 to *any* stat. We'll assume it boosts the primary stage stat for maximum impact simulation.
                        cardBonus[primaryStatKey] = (cardBonus[primaryStatKey] || 0) + card.effectValue['all'];
                    } else if (card.effectValue && Object.keys(card.effectValue).length > 0) {
                         Object.keys(card.effectValue).forEach(key => {
                            const statName = key.charAt(0).toUpperCase() + key.slice(1); // Ensure proper capitalization
                            if (StatsKeys[statName] || StatsKeys[key]) {
                                cardBonus[statName] = (cardBonus[statName] || 0) + card.effectValue[key];
                            }
                        });
                    }
                });

                // Final Stat Calculation
                let totalStatContribution = baseStatValue;
                Object.values(cardBonus).forEach(bonus => {
                     totalStatContribution += bonus; // Simplistic summation for now, better to calculate per stat match
                });


                // 3. Dice Roll and Final Score Calculation
                const varianceRoll = Math.floor(Math.random() * 6) + 1; // d6 (1-6)
                let finalScore = totalStatContribution + varianceRoll;

                // 4. Resolution vs Threshold
                const difficultyThreshold = currentStageDef.difficultyCurve(prev.currentStageIndex);

                let damageTaken = 0;
                let xpGained = 1;
                let currencyEarned = 10;

                if (finalScore >= difficultyThreshold) {
                    // Win condition met! Reward: low damage, high reward.
                    damageTaken = Math.max(0, Math.floor((difficultyThreshold - finalScore) / 3));
                    xpGained = 2 + Math.floor(Math.random() * 2); // XP increase
                    currencyEarned = 15;
                } else {
                    // Fail condition met: Loss of durability, lower reward.
                    damageTaken = Math.min(activeCar.maxDurability, Math.ceil((difficultyThreshold - finalScore) / 4));
                    xpGained = 1;
                    currencyEarned = 5;
                }

                // Update Car State: Only the first car is tracked in this simplified state structure for now.
                const newCarState = {
                    ...activeCar,
                    durability: Math.max(0, activeCar.maxDurability - damageTaken), // Durability decreases
                };


                return {
                    ...prev,
                    cars: [newCarState],
                    totalCurrency: prev.totalCurrency + currencyEarned,
                    xpPerCar: { ...prev.xpPerCar, [carId]: prev.xpPerCar[carId] + xpGained },
                };
            });
        }, []);


        /**
         * Advances the game to the next stage if victory criteria are met and car is still functional.
         */
        const advanceStage = useCallback(() => {
             setGameState(prev => {
                if (!prev || !prev.cars[0] || prev.cars[0].durability <= 0) {
                    console.log("Cannot advance: Car is disabled or game over.");
                    return null;
                }

                const nextStageIndex = Math.min(prev.currentStageIndex + 1, StageDefinitions.length - 1);

                if (nextStageIndex === prev.currentStageIndex) {
                     console.log("Already on the final stage.");
                     return prev;
                }

                 // We call drawHand here because advancing implies drawing a new hand for the next stage's mechanic.
                 const nextStageType = StageDefinitions[nextStageIndex].primaryStat;
                 drawHand(nextStageType);

                // Return partial state update, allowing drawHand to complete the full setGameState call.
                return { ...prev, currentStageIndex: nextStageIndex };
            });
        }, [drawHand]);

        return {
            gameState: null, // Dummy assignment; the useMemo structure handles state updates via setters above.
            startGame: startGame,
            drawHand: drawHand,
            playCardsAndResolve: playCardsAndResolve,
            advanceStage: advanceStage,
        };
    }, [useCallback]);

    // Cleanup the returned object for cleaner consumption by components
    return {
        gameState: gameState, // This is unstable when using useMemo wrapper around setGameState; better to expose direct setters.
        startGame: startGame,
        drawHand: drawHand,
        playCardsAndResolve: playCardsAndResolve,
        advanceStage: advanceStage,
    };
};