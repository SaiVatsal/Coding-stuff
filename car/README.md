# 🏎️ Apex Drift: Card Racing Game

A single-player, in-memory card game prototype built with React and Tailwind CSS. Players race across a 5-stage circuit by strategically playing action cards and managing their cars' durability.

---

## ✨ Features Overview
*   **Game Loop:** Stages (Sprint $\to$ Rally $\to$ Drift $\to$ Drag $\to$ Endurance).
*   **Core Mechanics:** Card play, stat resolution vs. dynamic difficulty thresholds, XP/Currency gain/loss.
*   **Progression:** Car leveling and resource spending in a mock Shop/Garage component.
*   **UI/UX:** Dark theme with high-contrast red/orange accents, designed for readability on card states and stats.

## 🚀 Getting Started (Setup)

This guide assumes you have Node.js and npm/yarn installed.

1.  **Clone/Navigate:** Ensure your project directory is set up correctly (`cd <your-project-root>`).
2.  **Install Dependencies:** Install all required packages listed in `package.json`.
    ```bash
    npm install
    # OR
    # yarn install
    ```
3.  **Run the Application:** Start the development server to see the live build.
    ```bash
    npm run dev # or npm start, depending on package.json script
    ```

## 🧪 Testing Guide (How to Test)

The testing process should be done end-to-end by simulating player interaction through the UI components and verifying state changes in the console/browser debugger.

### Phase 1: Initial Setup & Garage Flow
**Goal:** Verify that starting the game correctly populates initial state and allows car selection.

1.  **Check Default View:** The application should load to the **Garage Overview**.
2.  **Car Display Verification:** All three starter cars (Crimson Comet, Ghost Runner, Titan Beast) must be displayed with their correct base stats using the `StatBar` component.
3.  **Game Start:** Click the "Start First Race" button (or equivalent initial trigger).
    *   **Expected Output:** The view should transition from **Garage Overview** to **Race Screen**.
    *   The Header must display `Stage 1/5` and initialized currency.

### Phase 2: Single Stage Resolution Flow
**Goal:** Test the full sequence of drawing, playing cards, resolving stats, and determining state change (Win/Loss).

1.  **Draw Hand Verification:** Upon entering the stage view, a hand of **4 Action Cards** must be visible in the hand panel, representing the current round's draw.
2.  **Card Play Simulation:** Manually select up to 2 cards from the hand (simulated by clicking/selecting them).
3.  **Resolve Round Button Click:** Click the "Attempt Stage Resolution" button.
    *   **Verification Check:** The resolution area should update:
        *   The calculated final score must be displayed.
        *   Damage taken and XP gained (or none) must be visibly communicated to the user.
        *   The car's Durability status in the central panel **must decrease/stay stable** based on the outcome.
4.  **Advance Stage:** If the car is still operational (Durability > 0), click the "Advance Stage" button.
    *   **Expected Output:** The `currentStageIndex` must increment, the hand must be replaced with a new set of 4 cards, and the Primary Focus stat/Difficulty Threshold should update to the next stage's values.

### Phase 3: End-to-End Circuit Test
**Goal:** Verify state persistence across all 5 stages.

1.  Repeat **Phase 2 steps (Draw $\to$ Resolve $\to$ Advance)** exactly five times.
2.  **Final State Check:** After advancing from Stage 5, the view must transition to the **Results Screen**. The final status summary should be displayed correctly.

### ⚠️ Edge Case/Failure Tests
1.  **Game Over:** Manually play rounds (by changing state or mocking the function call) until the selected car's durability reaches `0` (or near zero). Verify that:
    *   The "Advance Stage" button is disabled.
    *   Attempting to resolve or advance results in a "Game Over" message.
2.  **Card Boost Verification:** Test playing all five card types (`Boost`, `Draft`, `Grip`, `Repair`, `Nitro`) sequentially. Verify that the stat boosts combine logically according to the rules set in `useStore.js`.

---
***Developer Notes:***
*   *The primary logic resides in `src/store/useStore.js` within `playCardsAndResolve` and `advanceStage`.*
*   *Due to state coupling, ensure all components read the definitive source of truth from `useGameStore()`.*