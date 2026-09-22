// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#include "AI/TacticalAIController.h"
#include "Characters/DualProtagonistCharacter.h"
#include "NavigationSystem.h"
#include "Navigation/PathFollowingComponent.h"
#include "GameFramework/CharacterMovementComponent.h"

ATacticalAIController::ATacticalAIController()
{
    PrimaryActorTick.bCanEverTick = true;
    bSetControlRotationFromPawnOrientation = false;
    bWantsPlayerState = false;
}

void ATacticalAIController::OnPossess(APawn* InPawn)
{
    Super::OnPossess(InPawn);

    PossessedProtagonist = Cast<ADualProtagonistCharacter>(InPawn);
    if (PossessedProtagonist)
    {
        UE_LOG(LogTemp, Log, TEXT("[TacticalAIController] Possessed companion protagonist: %s"),
            *UEnum::GetValueAsString(PossessedProtagonist->Identity));
    }
}

void ATacticalAIController::OnUnPossess()
{
    if (PossessedProtagonist)
    {
        ClearCombatFocus();
        StopMovement();
        PossessedProtagonist = nullptr;
    }

    Super::OnUnPossess();
}

void ATacticalAIController::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    if (CurrentFocusActor.IsValid() && PossessedProtagonist)
    {
        FVector TargetPos = CurrentFocusActor->GetActorLocation();
        SetFocalPoint(TargetPos);
    }
}

bool ATacticalAIController::NavigateToTacticalLocation(const FVector& TargetLocation, float AcceptanceRadius)
{
    if (!PossessedProtagonist) return false;

    FAIMoveRequest MoveReq(TargetLocation);
    MoveReq.SetAcceptanceRadius(AcceptanceRadius);
    MoveReq.SetUsePathfinding(true);

    FPathFollowingRequestResult Result = MoveTo(MoveReq);
    return Result.Code == EPathFollowingRequestResult::RequestSuccessful || Result.Code == EPathFollowingRequestResult::AlreadyAtGoal;
}

bool ATacticalAIController::PerformFlankManeuver(const FVector& FlankLocation, AActor* TargetEnemy)
{
    if (!PossessedProtagonist) return false;

    if (bUseSprintDuringFlanking)
    {
        PossessedProtagonist->StartSprint();
    }

    if (TargetEnemy)
    {
        SetCombatFocusActor(TargetEnemy);
    }

    return NavigateToTacticalLocation(FlankLocation, 120.0f);
}

void ATacticalAIController::SetCombatFocusActor(AActor* InTargetActor)
{
    CurrentFocusActor = InTargetActor;
    if (InTargetActor)
    {
        SetFocus(InTargetActor);
    }
    else
    {
        ClearCombatFocus();
    }
}

void ATacticalAIController::ClearCombatFocus()
{
    CurrentFocusActor = nullptr;
    ClearFocus(EAIFocusPriority::Gameplay);
}
