// src/components/Garage/GarageOverview.jsx
import React from 'react';
import { useGameStore } from '../../store/useStore';
import { StarterCars, StatsKeys } from '../../data/gameData';

/**
 * Component displaying the player's available cars and allowing selection for a race start.
 */
const GarageOverview = () => {
    // The store hook now provides all necessary game controls
    const { startGame, advanceStage, gameState } = useGameStore();

    const handleStartRace = () => {
        if (gameState) return; // Already started
        startGame(StarterCars); // Start the game using starter cars
    }

    // If the game is active but hasn't drawn for stage 0 yet, force a draw/advance to start the flow
    React.useEffect(() => {
        if (gameState && gameState.currentStageIndex === 0 && !gameState.hand) {
             // Simulate drawing hand immediately upon entering Stage 1 logic state
             // Note: In a real app, this would be triggered by the store when stage index changes to 0.
            console.log("Auto-drawing initial hand.");
        }
    }, [gameState]);


    return (
        <div className="text-center p-10 bg-[#2d3748] rounded-lg shadow-xl">
            <h2 className="text-3xl font-bold mb-6 text-orange-400">Garage Overview</h2>
            <p className="mb-8 text-gray-300 max-w-md mx-auto">Select your starting car and hit 'Start Race' to begin the circuit.</p>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
                {StarterCars.map((car) => (
                    <div key={car.id} className={`bg-[#2d3748] p-6 rounded-xl shadow-lg transition ${gameState && gameState.cars[0].id === car.id ? 'border-green-500 border-t-4' : 'border-gray-600 border-t-4 hover:shadow-red-500/50'}`}>
                        <h3 className="text-2xl font-bold text-orange-400 mb-1">{car.name}</h3>
                        <p className="text-sm text-gray-400 mb-4">Car Stats (Total: 20)</p>

                        {/* Stat Display Component */}
                        <div className="space-y-3 mt-3">
                            <StatBar label={StatsKeys.Speed} value={car.baseStats.Speed} max={10} color="bg-red-600" />
                            <StatBar label={StatsKeys.Handling} value={car.baseStats.Handling} max={10} color="bg-blue-600" />
                            <StatBar label={StatsKeys.Acceleration} value={car.baseStats.Acceleration} max={10} color="bg-yellow-600" />
                            {/* Durability must be visible and changeable */}
                             <div className={`p-2 bg-gray-800 rounded`}>
                                <div className="flex justify-between text-sm font-semibold mb-1"><span>Durability:</span> <span className="text-green-400">{car.baseStats.Durability} / {car.maxDurability}</span></div>
                                <div className="h-3 bg-gray-700 rounded-full"><div className={`h-full rounded-full ${'bg-green-500'} transition`} style={{ width: `${(car.baseStats.Durability/car.maxDurability)*100}%` }}></div></div>
                            </div>
                        </div>

                        <button
                            onClick={() => { console.log(`Selected ${car.name}`); /* Real logic needs to update local state and potentially call advanceStage or prepare for race */ }}
                            className="mt-8 w-full py-2 bg-red-700 hover:bg-red-600 transition rounded text-white font-semibold"
                        >
                            Select Car
                        </button>
                    </div>
                </div>
            </div>
        );
};

// Helper component for visual stat display (reusing this structure)
const StatBar = ({ label, value, max, color }) => (
    <div className="flex items-center gap-3 text-sm">
        <span className="w-24">{label}:</span>
        <div className="flex-grow bg-gray-700 rounded-full h-3 relative">
            <div
                className={`h-3 rounded-full transition duration-500 ${color}`}
                style={{ width: `${(value / max) * 100}%` }}
            ></div>
        </div>
        <span className="w-12 text-right font-mono">{value}</span>
    </div>
);

export default GarageOverview;