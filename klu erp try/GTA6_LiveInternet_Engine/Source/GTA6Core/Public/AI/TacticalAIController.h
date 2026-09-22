// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "AIController.h"
#include "TacticalAIController.generated.h"

class ADualProtagonistCharacter;

/**
 * AAA Autonomous Tactical AI Controller for Dual-Protagonist Companion.
 * Drives pathfinding, combat focal tracking, and seamless player-to-AI possession transitions.
 */
UCLASS()
class GTA6CORE_API ATacticalAIController : public AAIController
{
    GENERATED_BODY()

public:
    ATacticalAIController();

    virtual void OnPossess(APawn* InPawn) override;
    virtual void OnUnPossess() override;
    virtual void Tick(float DeltaTime) override;

    /** Command companion to navigate smoothly to a tactical cover location */
    UFUNCTION(BlueprintCallable, Category = "Tactical AI")
    bool NavigateToTacticalLocation(const FVector& TargetLocation, float AcceptanceRadius = 75.0f);

    /** Command companion to sprint / flank an enemy target */
    UFUNCTION(BlueprintCallable, Category = "Tactical AI")
    bool PerformFlankManeuver(const FVector& FlankLocation, AActor* TargetEnemy);

    /** Focus aim on target actor with lead vector calculation */
    UFUNCTION(BlueprintCallable, Category = "Tactical AI")
    void SetCombatFocusActor(AActor* InTargetActor);

    /** Clear focus and resume default heading */
    UFUNCTION(BlueprintCallable, Category = "Tactical AI")
    void ClearCombatFocus();

    /** Cache of possessed dual-protagonist character */
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Tactical AI")
    TObjectPtr<ADualProtagonistCharacter> PossessedProtagonist;

protected:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Tactical AI|Navigation")
    float DefaultAcceptanceRadius = 100.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Tactical AI|Navigation")
    bool bUseSprintDuringFlanking = true;

private:
    TWeakObjectPtr<AActor> CurrentFocusActor;
};
