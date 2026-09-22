// src/App.jsx
import React, { useState, useEffect } from 'react';
import { useGameStore } from './store/useStore';
import Header from './components/Header';
import GarageOverview from './components/Garage/GarageOverview';
import RaceStageView from './components/RaceScreen/RaceStageView';

// --- Placeholder Components for Completion ---

const ResultsScreen = () => (
    <div className="text-center p-10 bg-[#2d3748] rounded-lg shadow-xl border-t-4 border-green-500">
        <h2 className="text-4xl font-extrabold text-yellow-400 mb-4">🏁 RACE COMPLETE! 🏆</h2>
        <p className="text-xl mb-6 text-gray-300">Circuit finished! Final scores, currency earned, and XP gained are displayed here.</p>

        {/* Placeholder for detailed score breakdown */}
        <div className="bg-[#1a202c] p-4 rounded-lg inline-block shadow-inner mb-8">
            <h3 className="text-xl font-semibold text-orange-400">Summary:</h3>
            <p>Stages Won: 3/5 | Best Car: Crimson Comet</p>
        </div>

        {/* Play Again Button */}
        <button
            onClick={() => { /* Call store function to reset game */ }}
            className="px-12 py-4 text-xl font-bold bg-green-600 hover:bg-green-700 transition rounded shadow-lg"
        >
            Play Again
        </button>
    </div>
);

// --- Main Application Component ---

function App() {
    const { gameState } = useGameStore();
    const [view, setView] = useState('garage'); // Use state to control which view is visible

    useEffect(() => {
        if (!gameState) {
            setView('garage');
        } else if (gameState.currentStageIndex === -1) {
             // Special case: Game Over/Game Finished screen
            setView('results');
        } else if (gameState.gameStateActive && gameState.currentStageIndex >= 0) {
                if (!gameState.hand || view !== 'race') {
                    // If the store state indicates a stage is active but we aren't on the race view, switch to it.
                    setView('race');
                } else if (view === 'garage') {
                     // On startup/state change: if the game is ready and wasn't in garage view before, force update.
                }
        }
    }, [gameState]);

    let ComponentToRender;

    switch (view) {
        case 'garage':
            ComponentToRender = <GarageOverview />;
            break;
        case 'race':
            ComponentToRender = <RaceStageView />;
            break;
        case 'results':
            ComponentToRender = <ResultsScreen />;
            break;
        default:
            ComponentToRender = <div className="text-center py-12 text-lg">Loading Game...</div>;
    }

    return (
        <div className="min-h-screen bg-[#1a202c] text-white p-8">
            {/* Global Header always visible */}
            <Header />

            {/* Main content area changes based on view state */}
            <main className="mt-6 pt-8 border-t border-gray-700/50 max-w-4xl mx-auto min-h-[calc(100vh-120px)]">
                {ComponentToRender}
            </main>
        </div >
    );
}

export default App;