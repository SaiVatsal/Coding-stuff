# Tactical AI Companion Subsystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a production-grade Tactical AI Companion Subsystem for the GTA VI Open World Engine (Unreal Engine 5.5 C++), featuring autonomous tactical following, dynamic cover finding, suppressive fire, sync takedowns, vehicle passenger drive-by combat, seamless dual-protagonist hot-swap handover, and Web Simulation Testbed synchronization.

**Architecture:** A decoupled actor component (`UTacticalCompanionComponent`) and AI controller (`ATacticalAIController`) architecture. The companion component manages tactical combat state machines, cover raycasting, and vehicle passenger postures, while the AI controller drives navmesh pathfinding and perception. `AOpenWorldPlayerController` broadcasts ping commands, and character hot-swaps smoothly exchange player and AI possession.

**Tech Stack:** Unreal Engine 5.5 C++, AIModule, NavigationSystem, ChaosVehicles, HTML5 Canvas/JavaScript.

## Global Constraints
- Target Framework: Unreal Engine 5.5 C++ with UE naming conventions (A for Actors, U for Components/Objects, F for Structs, E for Enums).
- Coding Standards: Zero placeholder comments, full production-grade implementations.
- Module: `GTA6Core` (`GTA6CORE_API` export macro).
- Web Testbed: Pure vanilla modern JS, zero external dependencies required for core logic, 60 FPS smooth rendering.

---

### Task 1: Create `ATacticalAIController`
**Files:**
- Create: `Source/GTA6Core/Public/AI/TacticalAIController.h`
- Create: `Source/GTA6Core/Private/AI/TacticalAIController.cpp`

**Interfaces:**
- Produces: `ATacticalAIController`, `SetTacticalFocusActor()`, `NavigateToCoverLocation()`, `PerformTacticalFlank()`, `HandleProtagonistPossessionHandover()`.

- [ ] **Step 1: Write header `TacticalAIController.h`**
  Declare class derived from `AAIController`, with navigation settings, focus management, and possession handover methods.
- [ ] **Step 2: Write implementation `TacticalAIController.cpp`**
  Implement pathfinding setup, focal tracking, perception configuration, and possession handover.
- [ ] **Step 3: Verify header and source syntax and includes**

---

### Task 2: Create `UTacticalCompanionComponent`
**Files:**
- Create: `Source/GTA6Core/Public/AI/TacticalCompanionComponent.h`
- Create: `Source/GTA6Core/Private/AI/TacticalCompanionComponent.cpp`

**Interfaces:**
- Produces: `UTacticalCompanionComponent`, `ECompanionTacticalState`, `EVehicleCombatPosture`, `ExecuteTacticalCommand()`, `FindBestCoverNode()`, `EnterVehiclePassengerCombat()`, `ExitVehiclePassengerCombat()`.

- [ ] **Step 1: Write header `TacticalCompanionComponent.h`**
  Declare component, enums, dynamic multicast delegates, cover evaluation structs, and vehicle combat postures.
- [ ] **Step 2: Write implementation `TacticalCompanionComponent.cpp`**
  Implement dynamic 16-ray cover evaluation, suppressive fire burst timers, sync takedown execution, and vehicle window lean aim calculation.
- [ ] **Step 3: Verify header and source syntax and includes**

---

### Task 3: Integrate Companion Component into `ADualProtagonistCharacter`
**Files:**
- Modify: `Source/GTA6Core/Public/Characters/DualProtagonistCharacter.h`
- Modify: `Source/GTA6Core/Private/Characters/DualProtagonistCharacter.cpp`

**Interfaces:**
- Consumes: `UTacticalCompanionComponent`
- Produces: `GetCompanionComponent()`, companion state transitions on `SetProtagonistState(EProtagonistState::CompanionAI)`.

- [ ] **Step 1: Update `DualProtagonistCharacter.h`**
  Add forward declaration and `TObjectPtr<UTacticalCompanionComponent> CompanionComponent;`.
- [ ] **Step 2: Update `DualProtagonistCharacter.cpp`**
  Instantiate `CompanionComponent = CreateDefaultSubobject<UTacticalCompanionComponent>(TEXT("TacticalCompanionComponent"));` in constructor, activate/deactivate in `SetProtagonistState`.
- [ ] **Step 3: Verify character modifications**

---

### Task 4: Connect Controller Command Dispatch & AI Possession in `AOpenWorldPlayerController`
**Files:**
- Modify: `Source/GTA6Core/Public/Controllers/OpenWorldPlayerController.h`
- Modify: `Source/GTA6Core/Private/Controllers/OpenWorldPlayerController.cpp`

**Interfaces:**
- Consumes: `ATacticalAIController`, `UTacticalCompanionComponent`
- Produces: Wire `OnCompanionCommandIssued` to active companion component; instantiate companion AI controller on `BeginPlay` and repossess on `SwitchProtagonist`.

- [ ] **Step 1: Update `OpenWorldPlayerController.h`**
  Add `TObjectPtr<ATacticalAIController> CompanionAIController;` and command routing helper.
- [ ] **Step 2: Update `OpenWorldPlayerController.cpp`**
  Spawn and attach `ATacticalAIController` to the non-controlled protagonist, wire command delegates, and execute smooth handover in `SwitchProtagonist`.
- [ ] **Step 3: Verify player controller modifications**

---

### Task 5: Upgrade Interactive Web Simulation Testbed (`index.html`)
**Files:**
- Modify: `Web_Simulation_Testbed/index.html`

**Interfaces:**
- Produces: Live tactical HUD monitor with active posture (`Following`, `In Cover`, `Flanking`, `Passenger Drive-By`), dynamic companion ammo and health, synchronized takedown timer, and companion tactical radio callouts.

- [ ] **Step 1: Update HTML layout in `index.html`**
  Add tactical companion status monitor widget with engagement stance toggles (`Aggressive`, `Defensive`, `Stealth`).
- [ ] **Step 2: Update JavaScript simulation engine in `index.html`**
  Implement companion tactical state machine with visual state changes, sync takedown sequence, and suppressive fire effects.
- [ ] **Step 3: Test and verify in browser**

---

### Task 6: Final Verification & Diagnostics
**Files:**
- Review all modified and newly created files.

- [ ] **Step 1: Audit C++ code for syntax, macros, and includes**
- [ ] **Step 2: Validate Web Simulation Testbed interactive behavior**
- [ ] **Step 3: Produce comprehensive walkthrough artifact**
