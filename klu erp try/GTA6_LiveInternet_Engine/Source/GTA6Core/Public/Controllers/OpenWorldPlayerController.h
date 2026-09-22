// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "Characters/DualProtagonistCharacter.h"
#include "OpenWorldPlayerController.generated.h"

UENUM(BlueprintType)
enum class ECompanionCommandType : uint8
{
    MoveToPing          UMETA(DisplayName = "Move to Pinged Position"),
    SuppressiveFire     UMETA(DisplayName = "Lay Down Suppressive Fire"),
    SyncTakedown        UMETA(DisplayName = "Synchronized Stealth Takedown"),
    BreachAndClear      UMETA(DisplayName = "Breach Door / Room"),
    Regroup             UMETA(DisplayName = "Regroup & Follow"),
    HoldPosition        UMETA(DisplayName = "Hold Position & Ambush")
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnProtagonistSwapped, EProtagonistIdentity, OldIdentity, EProtagonistIdentity, NewIdentity);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSensoryFocusToggled, bool, bIsActive);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnCompanionCommandIssued, ECompanionCommandType, Command, const FVector&, TargetLocation);

class ATacticalAIController;

/**
 * AAA Open World Player Controller managing Dual-Protagonist transitions, companion ping engine, and sensory focus.
 */
UCLASS()
class GTA6CORE_API AOpenWorldPlayerController : public APlayerController
{
    GENERATED_BODY()

public:
    AOpenWorldPlayerController();

    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;
    virtual void SetupInputComponent() override;

    // Protagonist References
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Protagonists")
    TObjectPtr<ADualProtagonistCharacter> LuciaPawn;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Protagonists")
    TObjectPtr<ADualProtagonistCharacter> JasonPawn;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Protagonists")
    TObjectPtr<ATacticalAIController> CompanionAIController;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Protagonists")
    EProtagonistIdentity ActiveProtagonist = EProtagonistIdentity::Lucia;

    // Switching Logic
    UFUNCTION(BlueprintCallable, Category = "Protagonists")
    bool SwitchProtagonist(EProtagonistIdentity TargetIdentity, float BlendDuration = 1.2f);

    // Companion Ping & Command Engine
    UFUNCTION(BlueprintCallable, Category = "Companion")
    void IssueCompanionCommand(ECompanionCommandType CommandType);

    UFUNCTION(BlueprintCallable, Category = "Companion")
    void PingWorldTarget();

    // Sensory Focus Mode (Situational Awareness)
    UFUNCTION(BlueprintCallable, Category = "Abilities")
    void ToggleSensoryFocusMode();

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Abilities")
    bool bSensoryFocusActive = false;

    // Events
    UPROPERTY(BlueprintAssignable, Category = "Protagonists|Events")
    FOnProtagonistSwapped OnProtagonistSwapped;

    UPROPERTY(BlueprintAssignable, Category = "Abilities|Events")
    FOnSensoryFocusToggled OnSensoryFocusToggled;

    UPROPERTY(BlueprintAssignable, Category = "Companion|Events")
    FOnCompanionCommandIssued OnCompanionCommandIssued;

protected:
    void HandleSwitchCharacterInput();
    void HandlePingInput();
    void HandleSensoryFocusInput();

private:
    bool bIsTransitioningCamera = false;
    float TransitionTimer = 0.0f;
    float TotalTransitionTime = 1.2f;

    FProtagonistPersistenceData LuciaPersistence;
    FProtagonistPersistenceData JasonPersistence;

    void PerformTraceForPing(FHitResult& OutHit);
};
