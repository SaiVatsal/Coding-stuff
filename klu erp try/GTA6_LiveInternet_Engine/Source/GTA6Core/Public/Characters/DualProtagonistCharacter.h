// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "DualProtagonistCharacter.generated.h"

class USpringArmComponent;
class UCameraComponent;
class ACrimeVehiclePawn;
class UTacticalCompanionComponent;

UENUM(BlueprintType)
enum class EProtagonistIdentity : uint8
{
    Lucia       UMETA(DisplayName = "Lucia Caminos"),
    Jason       UMETA(DisplayName = "Jason Duval")
};

UENUM(BlueprintType)
enum class EProtagonistState : uint8
{
    ActivePlayer    UMETA(DisplayName = "Direct Player Controlled"),
    CompanionAI     UMETA(DisplayName = "Active AI Companion"),
    StandbyOffscreen UMETA(DisplayName = "Off-Screen Ambient Simulation")
};

USTRUCT(BlueprintType)
struct FProtagonistPersistenceData
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Persistence")
    float Health = 100.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Persistence")
    float Armor = 100.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Persistence")
    int32 Cash = 5000;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Persistence")
    TArray<FString> EquippedWeapons;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Persistence")
    FVector LastWorldLocation = FVector::ZeroVector;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Persistence")
    FRotator LastWorldRotation = FRotator::ZeroRotator;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnProtagonistStateChanged, EProtagonistIdentity, Identity, EProtagonistState, NewState);

/**
 * AAA Dual-Protagonist Character with Locomotion, Weapon Handling, and State Persistence
 */
UCLASS()
class GTA6CORE_API ADualProtagonistCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    ADualProtagonistCharacter();

    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;
    virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;

    // Protagonist Properties
    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Protagonist")
    EProtagonistIdentity Identity = EProtagonistIdentity::Lucia;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Protagonist")
    EProtagonistState CurrentState = EProtagonistState::StandbyOffscreen;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Camera")
    TObjectPtr<USpringArmComponent> CameraBoom;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Camera")
    TObjectPtr<UCameraComponent> FollowCamera;

    // Movement & Locomotion Speeds
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Locomotion")
    float WalkSpeed = 220.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Locomotion")
    float JogSpeed = 480.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Locomotion")
    float SprintSpeed = 750.0f;

    // Health & Combat
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat")
    float CurrentHealth = 100.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat")
    float CurrentArmor = 50.0f;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Combat")
    bool bIsAiming = false;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Combat")
    bool bIsRagdoll = false;

    // Vehicle Interaction
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Vehicles")
    TObjectPtr<ACrimeVehiclePawn> CurrentOccupiedVehicle;

    // Tactical AI Companion Component
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "AI")
    TObjectPtr<UTacticalCompanionComponent> CompanionComponent;

    UFUNCTION(BlueprintPure, Category = "AI")
    UTacticalCompanionComponent* GetCompanionComponent() const { return CompanionComponent.Get(); }

    // Switching & Persistence API
    UFUNCTION(BlueprintCallable, Category = "Protagonist")
    void SetProtagonistState(EProtagonistState NewState);

    UFUNCTION(BlueprintCallable, Category = "Protagonist")
    void SaveStateData(FProtagonistPersistenceData& OutData) const;

    UFUNCTION(BlueprintCallable, Category = "Protagonist")
    void RestoreStateData(const FProtagonistPersistenceData& InData);

    UFUNCTION(BlueprintCallable, Category = "Combat")
    void TriggerRagdoll(const FVector& ImpulseOrigin, float ImpulseStrength);

    UFUNCTION(BlueprintCallable, Category = "Combat")
    void RecoverFromRagdoll();

    UFUNCTION(BlueprintCallable, Category = "Vehicles")
    bool TryEnterVehicle(ACrimeVehiclePawn* TargetVehicle, bool bDriverSeat = true);

    UFUNCTION(BlueprintCallable, Category = "Vehicles")
    void ExitVehicle();

    UPROPERTY(BlueprintAssignable, Category = "Protagonist|Events")
    FOnProtagonistStateChanged OnStateChanged;

protected:
    void MoveForward(float Value);
    void MoveRight(float Value);
    void Turn(float Value);
    void LookUp(float Value);
    void StartSprint();
    void StopSprint();
    void StartAim();
    void StopAim();
    void FireWeapon();

private:
    bool bIsSprinting = false;
    FRotator AimRecoilOffset = FRotator::ZeroRotator;
};
