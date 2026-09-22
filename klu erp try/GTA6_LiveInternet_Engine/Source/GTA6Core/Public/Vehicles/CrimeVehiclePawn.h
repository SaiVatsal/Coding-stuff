// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Pawn.h"
#include "Inventory/PhysicalizedArmoryComponent.h"
#include "CrimeVehiclePawn.generated.h"

UENUM(BlueprintType)
enum class EVehicleSurfaceTraction : uint8
{
    DryAsphalt          UMETA(DisplayName = "Dry Vice City Asphalt (1.0x Friction)"),
    WetPavement         UMETA(DisplayName = "Tropical Rain Slick (0.65x Friction)"),
    SwampMud            UMETA(DisplayName = "Leonida Swamp Mud (0.40x Drag & Slip)"),
    BeachSand           UMETA(DisplayName = "Ocean Beach Sand (0.55x Loose Traction)"),
    GravelDirt          UMETA(DisplayName = "Backcountry Gravel (0.75x Drift Bias)")
};

UENUM(BlueprintType)
enum class EVehicleSecurityTier : uint8
{
    Unlocked            UMETA(DisplayName = "Door Unlocked"),
    MechanicalLock      UMETA(DisplayName = "Mechanical Tumbler (Slim Jim / Lockpick)"),
    ElectronicImmobilizer UMETA(DisplayName = "Rolling Code Cryptographic Immobilizer (Flipper / OBD-II Hack)"),
    ArmoredHighSecurity UMETA(DisplayName = "Military / Bank Armor (Thermite Required)")
};

UENUM(BlueprintType)
enum class EHijackState : uint8
{
    Idle,
    LockpickingMechanical,
    SniffingElectronicRollingCode,
    HotwiringIgnition,
    UnlockedAndRunning,
    AlarmTriggered
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnVehicleAlarmStateChanged, bool, bIsAlarmSounding, const FVector&, Location);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FOnHijackProgressUpdated, EHijackState, State, float, ProgressPercent, bool, bSuccess);

/**
 * AAA Open-World Vehicle Dynamics, Chaos Handling, Multi-Tier Theft, and Surface Physics.
 */
UCLASS()
class GTA6CORE_API ACrimeVehiclePawn : public APawn
{
    GENERATED_BODY()

public:
    ACrimeVehiclePawn();

    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;
    virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;

    // Vehicle Identity & Class
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Vehicle")
    FString VehicleModelName = TEXT("Pegassi Torero XO");

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Security")
    EVehicleSecurityTier SecurityTier = EVehicleSecurityTier::ElectronicImmobilizer;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Security")
    EHijackState CurrentHijackState = EHijackState::Idle;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Security")
    bool bAlarmActive = false;

    // Handling & Dynamics
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dynamics")
    float TopSpeedKmh = 310.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dynamics")
    float AccelerationTorque = 950.0f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dynamics")
    float CurrentSpeedKmh = 0.0f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dynamics")
    float EngineRPM = 800.0f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dynamics")
    int32 CurrentGear = 1;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dynamics")
    EVehicleSurfaceTraction CurrentSurface = EVehicleSurfaceTraction::DryAsphalt;

    // Damage & Modular Health
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Health")
    float EngineHealth = 100.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Health")
    float BodyHealth = 100.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Health")
    float FuelLevelPercent = 100.0f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Health")
    bool bFrontLeftTireBlown = false;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Health")
    bool bFrontRightTireBlown = false;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Health")
    bool bRearLeftTireBlown = false;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Health")
    bool bRearRightTireBlown = false;

    // Armory Storage (Trunk & Glove Compartment)
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Storage")
    TArray<FPhysicalWeaponItem> TrunkStorage;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Storage")
    TArray<FPhysicalWeaponItem> GloveCompartmentStorage;

    // Hijacking Mechanics
    UFUNCTION(BlueprintCallable, Category = "Theft")
    void StartHijackProcess(bool bHasElectronicBypassTool);

    UFUNCTION(BlueprintCallable, Category = "Theft")
    void CancelHijack();

    UFUNCTION(BlueprintCallable, Category = "Combat")
    void ApplyImpactDamage(float ImpulseMagnitude, const FVector& ImpactPoint);

    UFUNCTION(BlueprintCallable, Category = "Combat")
    void BlowTire(int32 WheelIndex);

    UFUNCTION(BlueprintCallable, Category = "Maintenance")
    void RepairTires();

    UFUNCTION(BlueprintCallable, Category = "Maintenance")
    void RepairVehicle();

    // Surface Detection
    UFUNCTION(BlueprintCallable, Category = "Dynamics")
    void DetectSurfaceTraction();

    // Events
    UPROPERTY(BlueprintAssignable, Category = "Security|Events")
    FOnVehicleAlarmStateChanged OnVehicleAlarmStateChanged;

    UPROPERTY(BlueprintAssignable, Category = "Theft|Events")
    FOnHijackProgressUpdated OnHijackProgressUpdated;

protected:
    void ThrottleInput(float Value);
    void SteerInput(float Value);
    void HandbrakeInput(float Value);

private:
    float HijackTimer = 0.0f;
    float TargetHijackDuration = 3.5f;
    float SteeringInputVal = 0.0f;
    float ThrottleInputVal = 0.0f;
    float HandbrakeVal = 0.0f;

    void ProcessHijackTick(float DeltaTime);
    void UpdatePhysicsDynamics(float DeltaTime);
};
