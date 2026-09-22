// src/components/RaceScreen/RaceStageView.jsx
import React from 'react';
import { useGameStore } from '../../store/useStore';
import { StageDefinitions, StatsKeys } from '../../data/gameData';

/**
 * Component representing the active race stage and card play interaction.
 */
const RaceStageView = () => {
    const { gameState, drawHand, playCardsAndResolve, advanceStage } = useGameStore();

    if (!gameState || !gameState.currentStageIndex) return <div className="text-center py-12">Loading Game State...</div>;

    const currentStage = StageDefinitions[gameState.currentStageIndex];
    const activeCar = gameState.cars?.[0] || null;

    // Handles player selecting cards and simulating the resolution attempt
    const handleCardPlayAndResolve = (playedCards) => {
        if (!activeCar) return;

        // Pass the current selected car ID and played card list to the store logic
        playCardsAndResolve(activeCar.id, playedCards);

        // NOTE: In a real app, the state update from playCardsAndResolve must trigger re-render,
        // which would then enable/allow calling advanceStage() on the next tick/button press.
    };


    return (
        <div className="space-y-8">
            {/* 1. Current Stage Banner */}
            <div className="bg-[#2d3748] border-l-8 border-orange-500 p-6 rounded-lg shadow-xl">
                <h2 className="text-4xl font-extrabold text-white mb-1">{currentStage.name}</h2>
                <p className={`text-xl ${StatsKeys[currentStage.primaryStat] === currentStage.primaryStat ? 'text-red-300' : 'text-orange-300'}`}>
                    Primary Focus: {currentStage.primaryStat}
                </p>
                <p className="mt-2 text-gray-400">Difficulty Threshold (Current): {currentStage.difficultyCurve(gameState.currentStageIndex)}</p>
            </div>

            {/* Car Status */}
             <div className={`p-4 bg-gray-800 rounded-lg ${activeCar ? 'border-l-8 border-green-500' : ''}`}>
                <h3 className="text-2xl font-semibold mb-2">Race Participant: {activeCar?.name}</h3>
                <p className="text-sm text-gray-400 mb-3">Durability Status:</p>
                 <div className="flex items-center gap-3">
                    <span className={`font-bold ${activeCar?.durability < activeCar.maxDurability * 0.2 ? 'text-red-500' : 'text-green-400'}`}>
                        {Math.round(activeCar?.durability)}/{activeCar?.maxDurability} Damage Remaining
                    </span>
                </div>
            </div>


            {/* 2. Hand Panel */}
            <div className="p-3 bg-[#1f2937] rounded-xl shadow-inner">
                <h3 className="text-2xl font-semibold mb-4 border-b pb-2 border-gray-700">Your Hand ({gameState.hand ? gameState.hand.length : '0'} Cards)</h3>
                <div className="flex space-x-4 overflow-x-auto p-3 flex-shrink-0">
                    {/* Card Rendering Loop */}
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={`w-32 h-48 bg-gray-700 p-3 rounded-lg border-b-4 cursor-pointer hover:scale-[1.02] transition ${i < 2 ? 'border-yellow-500' : 'border-gray-600'}`}>
                            <p className="text-xs font-bold mb-1 text-center">Card {i + 1}</p>
                            <div className="h-3 bg-red-500/50 rounded w-full mb-1"></div> {/* Mock Stat Bar */}
                            <p className='text-sm italic'>Tap to play</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Resolution Area / Controls */}
            <div className="bg-[#2d3748] p-6 rounded-lg shadow-inner">
                <h3 className="text-2xl font-semibold mb-4 border-b pb-2 border-gray-700">Resolution & Controls</h3>

                {/* Status Display Placeholder (This area updates dynamically on state change) */}
                <div className="mb-6 p-4 bg-[#1a202c] rounded text-center text-lg min-h-[5rem]">
                    Awaiting player action... Select cards and click Resolve.
                </div>

                <button
                    onClick={() => handleCardPlayAndResolve([])}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 transition rounded text-white font-bold text-xl shadow-md"
                    disabled={!gameState.hand || gameState.hand.length === 0}
                >
                    Attempt Stage Resolution ({currentStage.primaryStat})
                </button>

                <button
                    onClick={() => advanceStage()}
                    className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 transition rounded text-white font-bold text-xl shadow-md disabled:opacity-50"
                    disabled={!gameState.hand || gameState.cars?.[0]?.durability <= 0}
                >
                    Advance Stage ({currentStage.id + 1}/{StageDefinitions.length})
                </button>
            </div>
        </div>
    );
};

export default RaceStageView;