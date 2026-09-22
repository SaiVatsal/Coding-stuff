// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "Controllers/OpenWorldPlayerController.h"
#include "TacticalCompanionComponent.generated.h"

class ADualProtagonistCharacter;
class ATacticalAIController;
class ACrimeVehiclePawn;

UENUM(BlueprintType)
enum class ECompanionTacticalState : uint8
{
    IdleFollow              UMETA(DisplayName = "Following Player Leader"),
    MovingToCover           UMETA(DisplayName = "Moving to Cover Position"),
    InCoverSuppressiveFire  UMETA(DisplayName = "In Cover (Suppressive Fire)"),
    FlankingTarget          UMETA(DisplayName = "Flanking Enemy Flank"),
    ExecutingSyncTakedown   UMETA(DisplayName = "Executing Synchronized Stealth Takedown"),
    BreachingDoor           UMETA(DisplayName = "Breaching Door / Room"),
    VehiclePassengerDriveBy UMETA(DisplayName = "Vehicle Passenger Drive-By Combat"),
    HoldPosition            UMETA(DisplayName = "Holding Defensive Position")
};

UENUM(BlueprintType)
enum class EVehicleCombatPosture : uint8
{
    SeatedInterior          UMETA(DisplayName = "Seated Low (Cab Cover)"),
    PassengerDriveByWindow  UMETA(DisplayName = "Leaning Out Passenger Window"),
    ReloadingInCab          UMETA(DisplayName = "Reloading Inside Vehicle")
};

USTRUCT(BlueprintType)
struct FTacticalCoverNode
{
    GENERATED_BODY()

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Tactical Cover")
    FVector Location = FVector::ZeroVector;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Tactical Cover")
    FVector PeekDirection = FVector::ForwardVector;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Tactical Cover")
    bool bIsLowCover = true;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Tactical Cover")
    float CoverQualityScore = 0.0f;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnCompanionTacticalStateChanged, ECompanionTacticalState, OldState, ECompanionTacticalState, NewState);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnSyncTakedownTriggered, const FVector&, TargetLocation, float, SyncCountdownRemaining);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnVehicleCombatPostureChanged, EVehicleCombatPosture, NewPosture);

/**
 * AAA Tactical AI Companion Component for GTA VI Dual Protagonists.
 * Drives dynamic 16-ray cover finding, tactical formation, synchronized takedowns, and vehicle passenger drive-bys.
 */
UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class GTA6CORE_API UTacticalCompanionComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UTacticalCompanionComponent();

    virtual void BeginPlay() override;
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

    /** Execute player ping command dispatched from AOpenWorldPlayerController */
    UFUNCTION(BlueprintCallable, Category = "Tactical Companion")
    void ExecuteTacticalCommand(ECompanionCommandType Command, const FVector& TargetLocation);

    /** Evaluate dynamic 16-ray environmental cover around enemy threat */
    UFUNCTION(BlueprintCallable, Category = "Tactical Companion")
    bool FindBestCoverNode(const FVector& ThreatLocation, FTacticalCoverNode& OutCoverNode);

    /** Enter vehicle passenger combat state when riding in player vehicle */
    UFUNCTION(BlueprintCallable, Category = "Tactical Companion")
    void EnterVehiclePassengerCombat(ACrimeVehiclePawn* Vehicle);

    /** Exit vehicle passenger combat */
    UFUNCTION(BlueprintCallable, Category = "Tactical Companion")
    void ExitVehiclePassengerCombat();

    /** Calculate ballistic lead aiming vector from vehicle window */
    UFUNCTION(BlueprintPure, Category = "Tactical Companion")
    FVector CalculateBallisticLeadDirection(const FVector& TargetPos, const FVector& TargetVelocity, float ProjectileSpeed = 900.0f) const;

    // Getters
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Tactical Companion")
    ECompanionTacticalState CurrentTacticalState = ECompanionTacticalState::IdleFollow;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Tactical Companion")
    EVehicleCombatPosture VehiclePosture = EVehicleCombatPosture::SeatedInterior;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Tactical Companion")
    FTacticalCoverNode ActiveCoverNode;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Tactical Companion")
    float FollowFormationOffsetMeters = 3.5f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Tactical Companion")
    int32 CompanionAmmoPool = 180;

    // Events
    UPROPERTY(BlueprintAssignable, Category = "Tactical Companion|Events")
    FOnCompanionTacticalStateChanged OnTacticalStateChanged;

    UPROPERTY(BlueprintAssignable, Category = "Tactical Companion|Events")
    FOnSyncTakedownTriggered OnSyncTakedownTriggered;

    UPROPERTY(BlueprintAssignable, Category = "Tactical Companion|Events")
    FOnVehicleCombatPostureChanged OnVehicleCombatPostureChanged;

private:
    void SetTacticalState(ECompanionTacticalState NewState);
    void UpdateFollowFormation(float DeltaTime);
    void UpdateSuppressiveFire(float DeltaTime);
    void UpdateVehicleDriveBy(float DeltaTime);

    TWeakObjectPtr<ADualProtagonistCharacter> OwningCharacter;
    TWeakObjectPtr<ATacticalAIController> AIController;

    float BurstFireTimer = 0.0f;
    float SyncTakedownTimer = 0.0f;
    FVector CurrentPingTarget = FVector::ZeroVector;
};
