# GTA VI Live Internet & Open World Engine Subsystem (Unreal Engine 5.5 C++)

This repository contains the architecture, C++ source modules, live REST/WebSocket middleware gateway, and interactive web simulation testbed for an open-world action-adventure crime game inspired by GTA VI (set in the subtropical metropolis of Leonida and Vice City).

---

## 🏛️ Architecture Overview

The system is designed with high modularity and decoupling across 6 core pillars:

```
+---------------------------------------------------------------------------------------+
|                                UNREAL ENGINE 5.5 CLIENT                              |
+---------------------------------------------------------------------------------------+
|  1. Dual-Protagonist Dynamics       2. Physicalized Inventory & Physiology            |
|     - ADualProtagonistCharacter         - UPhysicalizedArmoryComponent                |
|     - AOpenWorldPlayerController        - Sockets (Back/Shoulder/Hip/Trunk)           |
|                                                                                       |
|  3. Chaos Vehicles & Traction       4. Law Enforcement & Heat Subsystem               |
|     - ACrimeVehiclePawn                 - UWantedHeatSubsystem                        |
|     - Lockpicking & OBD-II Hacking      - Witness 911 Delay Timer & Recon AI          |
|                                                                                       |
|  5. In-Game Social Media & Reelz    6. Slate In-Game Web & Live Internet              |
|     - UViralClipFeedSubsystem           - SEyefindBrowserWidget                       |
|     - Dynamic Stunt/Crime Capture       - UGameInternetSubsystem                      |
+---------------------------------------------------------------------------------------+
                                        ▲
                       HTTP REST / Async JSON / WebSockets
                                        ▼
+---------------------------------------------------------------------------------------+
|                         LIVE MIDDLEWARE GATEWAY (Node.js & Python)                    |
+---------------------------------------------------------------------------------------+
|  • server.js: Express + WebSocket Server (BAWSAQ Ticker, Maze Bank, Satirical Engine) |
|  • app.py: FastAPI Search Gateway with LLM Satire Translation                         |
+---------------------------------------------------------------------------------------+
                                        ▲
                               Live World Feeds
                                        ▼
+---------------------------------------------------------------------------------------+
|                   WEB TESTBED SIMULATOR (`Web_Simulation_Testbed/`)                   |
+---------------------------------------------------------------------------------------+
|  • Interactive HUD, Character Switcher, Vehicle Dynamics, Phone Apps (Eyefind, BAWSAQ)|
+---------------------------------------------------------------------------------------+
```

---

## 📁 Repository Structure

### 1. Unreal Engine 5.5 Core Module (`Source/GTA6Core/`)
- **Build Configuration**:
  - `GTA6Core.Build.cs`: Module dependencies (`HTTP`, `Json`, `ChaosVehicles`, `AIModule`, `Slate`, `SlateCore`, `UMG`, `WebBrowser`).
- **Dual Protagonists**:
  - `Public/Characters/DualProtagonistCharacter.h` & `Private/Characters/DualProtagonistCharacter.cpp`: Character pawn for Lucia and Jason with locomotion, aiming FOV scaling, camera lag, ragdoll physics, and persistence serialization.
  - `Public/Controllers/OpenWorldPlayerController.h` & `Private/Controllers/OpenWorldPlayerController.cpp`: Player controller managing seamless orbital camera transitions between Lucia and Jason, buddy ping commands, and sensory focus slomo.
- **Physicalized Inventory & Physiology**:
  - `Public/Inventory/PhysicalizedArmoryComponent.h` & `Private/Inventory/PhysicalizedArmoryComponent.cpp`: Physical weapon wheel socket manager, duffle bag weight/agility debuffs, vehicle trunk armory storage, and metabolism/stamina physiology.
- **Vehicle Dynamics & Theft**:
  - `Public/Vehicles/CrimeVehiclePawn.h` & `Private/Vehicles/CrimeVehiclePawn.cpp`: Chaos vehicle physics with surface traction detection (Asphalt, Mud, Sand), multi-tier hijacking (Lockpicking vs. Electronic Rolling Code Hacking), and modular damage.
- **Law Enforcement & Heat Escalation**:
  - `Public/Police/WantedHeatSubsystem.h` & `Private/Police/WantedHeatSubsystem.cpp`: 6-Star wanted rating, witness 911 call interception mechanics, and suspect profile recognition.
- **Social Media & Viral Clip Feed**:
  - `Public/Social/ViralClipFeedSubsystem.h` & `Private/Social/ViralClipFeedSubsystem.cpp`: Vertical short-form video clip feed ("Leonida Reelz") with dynamic viral generation from player crimes and stunts.
- **Slate In-Game Web Browser & Gateway Subsystem**:
  - `Public/UI/Slate/SEyefindBrowserWidget.h` & `Private/UI/Slate/SEyefindBrowserWidget.cpp`: Slate compound widget for the in-game web browser with gamepad virtual thumbstick mouse cursor emulation and multi-tab browser chrome.
  - `Public/Internet/GameInternetSubsystem.h` & `Private/Internet/GameInternetSubsystem.cpp`: Asynchronous search engine, token bucket rate limiting, LRU caching, and background thread JSON parsing.

### 2. Middleware Bridge Gateway (`Middleware_Bridge/`)
- `server.js`: Node.js Express server + WebSocket live world feed broadcasting BAWSAQ stocks, Maze Bank APIs, and satirical transformation routing.
- `app.py`: FastAPI microservice ingesting live queries and generating satirical GTA-lore news headlines.
- `package.json` & `requirements.txt`: Dependency manifests for Node.js and Python.

### 3. Interactive Web Simulation Testbed (`Web_Simulation_Testbed/`)
- `index.html`: A high-fidelity, responsive 60 FPS web simulation testbed rendering:
  - Lucia & Jason dynamic state switcher and physiology bars (Health, Armor, Stamina, Hydration).
  - Physicalized weapon slots (Right Hip, Back Sling, Shoulder, Trunk).
  - Chaos vehicle dynamics with surface traction switching (Dry Asphalt, Rain Slick, Mud, Sand).
  - 6-Star Wanted Heat system with interactive witness 911 intimidation/interception mechanics.
  - Interactive In-Game Smartphone with 4 functional apps:
    1. **Eyefind 2.0**: Live search queries with satirical Leonida news generation.
    2. **BAWSAQ Financial Market**: Real-time ticker with price fluctuations.
    3. **Leonida Reelz**: In-game vertical viral short-form video feed.
    4. **Maze Bank**: Account management and cash laundering portal.

### 4. Standalone 8K Ultra Native Windows Simulator (`Standalone_Executable/`)
- `GTA6_Leonida_8K_Simulator.exe`: Standalone 60 FPS native Windows executable featuring:
  - 8K Photorealistic (7680x4320) & 4K UHD rendering modes with Ray-Traced Screen Space Reflections (SSR).
  - High-speed 3D perspective driving across Vice City Ocean Drive & Biscayne Bay.
  - Dynamic weather cycle transitions (Tropical Sunset, Neon Midnight, Miami Rainstorm, Hurricane Category 5).
  - Dual-character hot-swapping (Lucia Caminos & Jason Duval) with live companion tactical AI.
  - Interactive In-Game Smartphone (`[P]`) with live Eyefind, BAWSAQ stocks, and Leonida Reelz.
  - 6-Star Law Enforcement heat system with 911 witness intercept timers and police helicopter spotlights.

---

## 🚀 Getting Started & Running

### 1. Launching the Standalone 8K Windows Simulator (.EXE)
```powershell
# Run the compiled native Windows executable directly:
& "GTA6_LiveInternet_Engine\Standalone_Executable\GTA6_Leonida_8K_Simulator.exe"
```
**In-Game Keyboard & Mouse Controls**:
- `W` / `Up Arrow`: Full Throttle / Acceleration
- `S` / `Down Arrow`: Brakes & Reverse
- `A` / `D` / `Left` / `Right`: Steering & Counter-Steer Drift
- `Spacebar`: Handbrake Drift & Smoke Generation
- `Tab`: Hot-swap between Lucia and Jason
- `E`: Sensory Focus Mode (0.35x Cinematic Slomo)
- `P` / `M`: Open / Close Smartphone (Eyefind, BAWSAQ, Reelz, Maze Bank)
- `Mouse Click`: Interact with top toolbar buttons, weather selector, and phone apps

### 2. Running the Node.js / Python Middleware Bridge
```bash
# Navigate to the middleware directory
cd "GTA6_LiveInternet_Engine/Middleware_Bridge"

# Option A: Start Node.js Express Gateway
npm install
node server.js

# Option B: Start Python FastAPI Gateway
pip install -r requirements.txt
python -m uvicorn app.py:app --port 8080 --reload
```

### 3. Running the Interactive Web Simulation Testbed
Open `GTA6_LiveInternet_Engine/Web_Simulation_Testbed/index.html` in any modern web browser to interact with the full GTA VI open-world sandbox and live internet testbed.
