# Tactical AI Companion Subsystem Design Specification
**Project**: GTA VI Live Internet & Open World Engine Subsystem (Unreal Engine 5.5 C++)  
**Author**: Lead Game Systems Engineer  
**Date**: 2026-09-23  
**Status**: Approved  

---

## 1. Executive Summary

This document specifies the technical architecture, class interfaces, state machines, and integration protocols for the **Tactical AI Companion Subsystem** in the GTA VI open-world engine. 

The subsystem empowers the non-player protagonist (either Lucia Caminos or Jason Duval) with autonomous, high-IQ combat companion capabilities, including:
- Dynamic combat formation and stealth following.
- Environmental cover evaluation and suppressive fire.
- Flanking maneuvers and synchronized stealth takedowns.
- Room/door breach and clearing sequences.
- Vehicle boarding, passenger combat, and drive-by window leaning with ballistic lead targeting.
- Seamless player-to-AI possession handover during dual-protagonist character hot-swaps.
- Full synchronization with the interactive Web Simulation Testbed.

---

## 2. Architecture & Class Hierarchy

```
+-------------------------------------------------------------+
|                ADualProtagonistCharacter                    |
|  - Identity (Lucia / Jason)                                 |
|  - CurrentState (ActivePlayer / CompanionAI)                |
+-------------------------------------------------------------+
               ▲                                ▲
               │ Has Component                  │ Possessed by
+-------------------------------+   +-------------------------+
|  UTacticalCompanionComponent  |   |  ATacticalAIController  |
|  - Tactical State Machine     |   |  - Pathfinding / Nav    |
|  - Dynamic Cover Evaluator    |   |  - Target Focus         |
|  - Command Queue & Execution  |   |  - Possession Handover  |
|  - Vehicle Passenger Combat   |   +-------------------------+
+-------------------------------+                ▲
               ▲                                 │
               │ Listens to Delegates            │ Controlled by
+-------------------------------------------------------------+
|                AOpenWorldPlayerController                   |
|  - ActiveProtagonist                                        |
|  - OnCompanionCommandIssued Delegate                        |
|  - PingWorldTarget()                                        |
+-------------------------------------------------------------+
```

### 2.1 File Layout

- `Source/GTA6Core/Public/AI/TacticalAIController.h`
- `Source/GTA6Core/Private/AI/TacticalAIController.cpp`
- `Source/GTA6Core/Public/AI/TacticalCompanionComponent.h`
- `Source/GTA6Core/Private/AI/TacticalCompanionComponent.cpp`
- Modifications to:
  - `Source/GTA6Core/Public/Characters/DualProtagonistCharacter.h`
  - `Source/GTA6Core/Private/Characters/DualProtagonistCharacter.cpp`
  - `Source/GTA6Core/Public/Controllers/OpenWorldPlayerController.h`
  - `Source/GTA6Core/Private/Controllers/OpenWorldPlayerController.cpp`
  - `Web_Simulation_Testbed/index.html`

---

## 3. Detailed Component Specifications

### 3.1 `ATacticalAIController`
Inherits from `AAIController`.
- **Responsibilities**:
  - Manages AI pathfinding via `UNavigationSystemV1`.
  - Configures AI sight, hearing perception, and focal point tracking.
  - Handles pawn possession and unpossession cleanly during hot-swapping.
  - Exposes navigation queries (`MoveToActor`, `MoveToLocation`) with adaptive acceptance radius.

### 3.2 `UTacticalCompanionComponent`
Inherits from `UActorComponent`.
- **States (`ECompanionTacticalState`)**:
  1. `FollowingLeader`: Matches leader speed (walk/jog/sprint), maintains tactical lateral offset.
  2. `MovingToCover`: Computes best cover node and sprints to position.
  3. `InCoverSuppressiveFire`: Peeks from cover and lays down bursts toward target threat.
  4. `FlankingTarget`: Executes wide arc path around enemy line-of-sight to establish crossfire.
  5. `ExecutingSyncTakedown`: Synchronizes stealth approach with player, eliminating target on signal.
  6. `BreachingDoor`: Moves to breach threshold, stacks up, and enters with weapon drawn.
  7. `VehiclePassengerDriveBy`: Rides in front passenger seat of `ACrimeVehiclePawn`, leans out window to engage hostiles.
  8. `HoldPosition`: Anchors to specific world coordinate, scanning forward firing arc.

### 3.3 Dynamic Cover Evaluation Algorithm
1. Project 16 trace rays in a 360-degree circle (radius: 1200 UE units) around the companion.
2. Filter for static geometry with height between 90cm (low cover - crouch) and 200cm (high cover - lean).
3. Check occlusion: Ensure vector between cover node and enemy origin is completely blocked by geometry.
4. Check firing clearance: Ensure vector from cover peek offset (+60cm lateral or +40cm vertical) to enemy origin is unobstructed.
5. Score nodes based on `Distance(Companion, Node) * 0.4 + Distance(Enemy, Node) * 0.6 + FlankAngleFactor * 0.3`.
6. Select highest-scoring node and dispatch move command.

### 3.4 Vehicle Passenger Combat Protocol
1. **Entry**: Listens to leader's vehicle entry event. If leader enters `ACrimeVehiclePawn`, companion aborts ground pathing and paths to front passenger door, invoking `TryEnterVehicle(Pawn, false)`.
2. **Threat Assessment**: Scans for active law enforcement cruisers or hostile combatants within 80 meters.
3. **Posture Switch**: Enters `EVehicleCombatPosture::PassengerDriveByWindow`.
4. **Aiming & Ballistics**: Calculates lead vector using target velocity, own vehicle velocity, and projectile flight speed.
5. **Egress**: When vehicle stops and leader exits, companion automatically exits via `ExitVehicle()` and adopts tactical ground cover.

---

## 4. Integration with Player Controller & Hot-Swapping

In `AOpenWorldPlayerController`:
- Bind `OnCompanionCommandIssued` to the inactive protagonist's `UTacticalCompanionComponent::ExecuteTacticalCommand`.
- On `SwitchProtagonist`:
  1. Detach player input and save state.
  2. Unpossess current protagonist.
  3. `ATacticalAIController` immediately possesses former player character and initializes `UTacticalCompanionComponent`.
  4. PlayerController possesses target protagonist; `ATacticalAIController` is released from target protagonist.
  5. Camera smoothly blends with cubic spline over 1.2s.

---

## 5. Web Simulation Testbed Updates

In `Web_Simulation_Testbed/index.html`:
- Add a dedicated **Tactical Companion Monitor**:
  - Current tactical posture display (`Following`, `In Cover`, `Flanking`, `Passenger Drive-By`).
  - Active companion ammo pool (`180 rounds Tactical 5.56`).
  - Tactical engagement stance toggle (`Aggressive`, `Defensive`, `Stealth Only`).
- Wire Ping buttons (`📍 Ping Move`, `🔥 Suppress`, `🗡️ Takedown`, `🚪 Breach`) to update simulation state, display synchronized tactical countdown timers, and output immersive radio barks.

---

## 6. Verification & Test Plan

1. **Compilation & Syntax**: Validate all UE5 C++ headers and source files for syntax correctness, includes, and UPROPERTY/UFUNCTION reflection macros.
2. **Class Linkage**: Confirm all headers are properly referenced in `GTA6Core.Build.cs` module dependencies.
3. **State Transitions**: Test state transitions through unit logic verification (Follow -> Cover -> Flank -> Vehicle).
4. **Web Testbed Diagnostics**: Load and verify `index.html` in browser, verify zero JavaScript console errors, and validate interactive companion command executions.
