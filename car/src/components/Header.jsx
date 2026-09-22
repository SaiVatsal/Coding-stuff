// src/components/Header.jsx
import React from 'react';
import { useGameStore } from '../store/useStore';

/**
 * Displays persistent game information (Currency, XP, Stage).
 */
const Header = () => {
    const { gameState } = useGameStore();

    if (!gameState) {
        return <div className="bg-gray-800 p-4 text-center shadow-lg rounded-t-xl">Welcome to Apex Drift! Press start or select cars in the Garage.</div>;
    }

    // Assuming stage definitions are available here for display purposes, though ideally imported from data file
    const stageInfo = { name: "Stage Placeholder", number: gameState.currentStageIndex + 1 };

    return (
        <header className="bg-gray-900 p-4 shadow-2xl rounded-t-xl flex justify-between items-center border-b-4 border-red-600/80">
            {/* Left: Stage Info */}
            <div className="text-left">
                <h1 className="text-3xl font-bold text-orange-500 tracking-widest">{stageInfo.name}</h1>
                <p className="text-sm text-gray-400">Stage {gameState.currentStageIndex + 1} / 5</p>
            </div>

            {/* Center: Stats Display */}
            <div className="flex gap-12 text-lg font-semibold">
                <div className="text-center">
                    <span className="block text-sm uppercase text-gray-400">Currency</span>
                    <span className="text-yellow-300 text-xl">{gameState.totalCurrency}</span>
                </div>
                <div className="text-center border-x border-gray-700/50 px-6">
                    <span className="block text-sm uppercase text-gray-400">Total XP</span>
                    <span className="text-green-300 text-xl">{/* Logic to calculate total XP */}X</span>
                </div>
            </div>

            {/* Right: Car Status Summary Placeholder */}
            <div className="text-right">
                <p className="text-sm uppercase text-gray-400">Active Cars</p>
                <span className={`inline-block px-3 py-1 rounded font-bold ${gameState.cars?.[0]?.durability > 0 ? 'bg-red-700' : 'bg-gray-600'} text-white`}>
                    Car Status: {gameState.cars?.[0]?.name || 'N/A'}
                </span>
            </div>
        </header>
    );
};

export default Header;