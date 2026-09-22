// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#include "AI/TacticalCompanionComponent.h"
#include "AI/TacticalAIController.h"
#include "Characters/DualProtagonistCharacter.h"
#include "Vehicles/CrimeVehiclePawn.h"
#include "Kismet/GameplayStatics.h"
#include "Engine/World.h"
#include "DrawDebugHelpers.h"

UTacticalCompanionComponent::UTacticalCompanionComponent()
{
    PrimaryComponentTick.bCanEverTick = true;
    PrimaryComponentTick.bStartWithTickEnabled = true;

    CurrentTacticalState = ECompanionTacticalState::IdleFollow;
    VehiclePosture = EVehicleCombatPosture::SeatedInterior;
    FollowFormationOffsetMeters = 3.5f;
    CompanionAmmoPool = 180;
}

void UTacticalCompanionComponent::BeginPlay()
{
    Super::BeginPlay();

    OwningCharacter = Cast<ADualProtagonistCharacter>(GetOwner());
}

void UTacticalCompanionComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

    if (!OwningCharacter.IsValid()) return;

    // Cache AI controller if possessed
    if (!AIController.IsValid())
    {
        AIController = Cast<ATacticalAIController>(OwningCharacter->GetController());
    }

    // Only run autonomous companion logic if the character is in CompanionAI state
    if (OwningCharacter->CurrentState != EProtagonistState::CompanionAI)
    {
        return;
    }

    switch (CurrentTacticalState)
    {
    case ECompanionTacticalState::IdleFollow:
        UpdateFollowFormation(DeltaTime);
        break;
    case ECompanionTacticalState::InCoverSuppressiveFire:
        UpdateSuppressiveFire(DeltaTime);
        break;
    case ECompanionTacticalState::VehiclePassengerDriveBy:
        UpdateVehicleDriveBy(DeltaTime);
        break;
    case ECompanionTacticalState::ExecutingSyncTakedown:
        if (SyncTakedownTimer > 0.0f)
        {
            SyncTakedownTimer -= DeltaTime;
            OnSyncTakedownTriggered.Broadcast(CurrentPingTarget, SyncTakedownTimer);
            if (SyncTakedownTimer <= 0.0f)
            {
                OwningCharacter->FireWeapon();
                UE_LOG(LogTemp, Log, TEXT("[TacticalCompanion] Synchronized takedown executed!"));
                SetTacticalState(ECompanionTacticalState::IdleFollow);
            }
        }
        break;
    default:
        break;
    }
}

void UTacticalCompanionComponent::ExecuteTacticalCommand(ECompanionCommandType Command, const FVector& TargetLocation)
{
    CurrentPingTarget = TargetLocation;

    switch (Command)
    {
    case ECompanionCommandType::MoveToPing:
        SetTacticalState(ECompanionTacticalState::MovingToCover);
        if (AIController.IsValid())
        {
            AIController->NavigateToTacticalLocation(TargetLocation, 100.0f);
        }
        UE_LOG(LogTemp, Log, TEXT("[TacticalCompanion] Moving to ping: %s"), *TargetLocation.ToString());
        break;

    case ECompanionCommandType::SuppressiveFire:
        FTacticalCoverNode Cover;
        if (FindBestCoverNode(TargetLocation, Cover))
        {
            ActiveCoverNode = Cover;
            SetTacticalState(ECompanionTacticalState::InCoverSuppressiveFire);
            if (AIController.IsValid())
            {
                AIController->NavigateToTacticalLocation(Cover.Location, 60.0f);
            }
        }
        else
        {
            SetTacticalState(ECompanionTacticalState::InCoverSuppressiveFire);
        }
        BurstFireTimer = 0.5f;
        UE_LOG(LogTemp, Log, TEXT("[TacticalCompanion] Laying down suppressive fire towards threat!"));
        break;

    case ECompanionCommandType::SyncTakedown:
        SetTacticalState(ECompanionTacticalState::ExecutingSyncTakedown);
        SyncTakedownTimer = 3.0f; // 3-second sync countdown
        if (AIController.IsValid())
        {
            AIController->NavigateToTacticalLocation(TargetLocation - FVector(100, 0, 0), 80.0f);
        }
        OnSyncTakedownTriggered.Broadcast(TargetLocation, SyncTakedownTimer);
        UE_LOG(LogTemp, Log, TEXT("[TacticalCompanion] Sync takedown initiated! Counting down 3.0s..."));
        break;

    case ECompanionCommandType::BreachAndClear:
        SetTacticalState(ECompanionTacticalState::BreachingDoor);
        if (AIController.IsValid())
        {
            AIController->NavigateToTacticalLocation(TargetLocation, 80.0f);
        }
        if (OwningCharacter.IsValid())
        {
            OwningCharacter->StartAim();
        }
        UE_LOG(LogTemp, Log, TEXT("[TacticalCompanion] Stacking up for door breach at %s"), *TargetLocation.ToString());
        break;

    case ECompanionCommandType::Regroup:
        SetTacticalState(ECompanionTacticalState::IdleFollow);
        if (OwningCharacter.IsValid())
        {
            OwningCharacter->StopAim();
        }
        UE_LOG(LogTemp, Log, TEXT("[TacticalCompanion] Regrouping with player."));
        break;

    case ECompanionCommandType::HoldPosition:
        SetTacticalState(ECompanionTacticalState::HoldPosition);
        if (AIController.IsValid())
        {
            AIController->StopMovement();
        }
        UE_LOG(LogTemp, Log, TEXT("[TacticalCompanion] Holding defensive position."));
        break;
    }
}

bool UTacticalCompanionComponent::FindBestCoverNode(const FVector& ThreatLocation, FTacticalCoverNode& OutCoverNode)
{
    if (!OwningCharacter.IsValid() || !GetWorld()) return false;

    FVector CompanionPos = OwningCharacter->GetActorLocation();
    const int32 NumRays = 16;
    const float SearchRadius = 1200.0f; // 12 meters
    float BestScore = -9999.0f;
    bool bFoundCover = false;

    FCollisionQueryParams Params;
    Params.AddIgnoredActor(OwningCharacter.Get());

    for (int32 i = 0; i < NumRays; ++i)
    {
        float Angle = (static_cast<float>(i) / NumRays) * 2.0f * PI;
        FVector Dir(FMath::Cos(Angle), FMath::Sin(Angle), 0.0f);
        FVector TraceStart = CompanionPos + FVector(0, 0, 50.0f);
        FVector TraceEnd = TraceStart + (Dir * SearchRadius);

        FHitResult Hit;
        if (GetWorld()->LineTraceSingleByChannel(Hit, TraceStart, TraceEnd, ECC_WorldStatic, Params))
        {
            // Evaluate occlusion from threat
            FHitResult ThreatOcclusionHit;
            FVector PotentialCoverPos = Hit.ImpactPoint + (Hit.ImpactNormal * 60.0f);
            FVector ThreatCheckStart = PotentialCoverPos + FVector(0, 0, 50.0f);

            if (GetWorld()->LineTraceSingleByChannel(ThreatOcclusionHit, ThreatCheckStart, ThreatLocation, ECC_WorldStatic, Params))
            {
                // Obstructed from threat line-of-fire = Valid Cover!
                float DistToCompanion = FVector::Dist(CompanionPos, PotentialCoverPos);
                float DistToThreat = FVector::Dist(PotentialCoverPos, ThreatLocation);

                // Score: Closer to companion is safer, maintaining flank angle
                float Score = (DistToThreat * 0.4f) - (DistToCompanion * 0.6f);

                if (Score > BestScore)
                {
                    BestScore = Score;
                    OutCoverNode.Location = PotentialCoverPos;
                    OutCoverNode.PeekDirection = (ThreatLocation - PotentialCoverPos).GetSafeNormal();
                    OutCoverNode.bIsLowCover = Hit.ImpactPoint.Z < (CompanionPos.Z + 120.0f);
                    OutCoverNode.CoverQualityScore = Score;
                    bFoundCover = true;
                }
            }
        }
    }

    return bFoundCover;
}

void UTacticalCompanionComponent::EnterVehiclePassengerCombat(ACrimeVehiclePawn* Vehicle)
{
    if (!Vehicle) return;

    SetTacticalState(ECompanionTacticalState::VehiclePassengerDriveBy);
    VehiclePosture = EVehicleCombatPosture::PassengerDriveByWindow;
    OnVehicleCombatPostureChanged.Broadcast(VehiclePosture);

    UE_LOG(LogTemp, Log, TEXT("[TacticalCompanion] Entered passenger drive-by combat in %s!"), *Vehicle->VehicleModelName);
}

void UTacticalCompanionComponent::ExitVehiclePassengerCombat()
{
    SetTacticalState(ECompanionTacticalState::IdleFollow);
    VehiclePosture = EVehicleCombatPosture::SeatedInterior;
    OnVehicleCombatPostureChanged.Broadcast(VehiclePosture);

    UE_LOG(LogTemp, Log, TEXT("[TacticalCompanion] Exited vehicle combat. Resuming ground tactics."));
}

FVector UTacticalCompanionComponent::CalculateBallisticLeadDirection(const FVector& TargetPos, const FVector& TargetVelocity, float ProjectileSpeed) const
{
    if (!OwningCharacter.IsValid()) return FVector::ForwardVector;

    FVector MuzzlePos = OwningCharacter->GetActorLocation() + FVector(0, 0, 60.0f);
    float Distance = FVector::Dist(MuzzlePos, TargetPos);
    float TimeToHit = FMath::Max(0.01f, Distance / ProjectileSpeed);

    FVector PredictedTargetPos = TargetPos + (TargetVelocity * TimeToHit);
    return (PredictedTargetPos - MuzzlePos).GetSafeNormal();
}

void UTacticalCompanionComponent::SetTacticalState(ECompanionTacticalState NewState)
{
    if (CurrentTacticalState != NewState)
    {
        ECompanionTacticalState Old = CurrentTacticalState;
        CurrentTacticalState = NewState;
        OnTacticalStateChanged.Broadcast(Old, CurrentTacticalState);
    }
}

void UTacticalCompanionComponent::UpdateFollowFormation(float DeltaTime)
{
    if (!AIController.IsValid() || !OwningCharacter.IsValid()) return;

    // Follow other protagonist if player controlled
    APawn* PlayerPawn = UGameplayStatics::GetPlayerPawn(GetWorld(), 0);
    if (!PlayerPawn || PlayerPawn == OwningCharacter.Get()) return;

    FVector PlayerPos = PlayerPawn->GetActorLocation();
    FVector RightOffset = PlayerPawn->GetActorRightVector() * (FollowFormationOffsetMeters * 100.0f);
    FVector RearOffset = -PlayerPawn->GetActorForwardVector() * (FollowFormationOffsetMeters * 80.0f);
    FVector TargetFormationPos = PlayerPos + RightOffset + RearOffset;

    float Dist = FVector::Dist(OwningCharacter->GetActorLocation(), TargetFormationPos);
    if (Dist > 250.0f)
    {
        AIController->NavigateToTacticalLocation(TargetFormationPos, 120.0f);
    }
}

void UTacticalCompanionComponent::UpdateSuppressiveFire(float DeltaTime)
{
    BurstFireTimer -= DeltaTime;
    if (BurstFireTimer <= 0.0f)
    {
        BurstFireTimer = FMath::RandRange(0.25f, 0.65f);
        if (CompanionAmmoPool > 0 && OwningCharacter.IsValid())
        {
            OwningCharacter->FireWeapon();
            CompanionAmmoPool = FMath::Max(0, CompanionAmmoPool - 3);
            UE_LOG(LogTemp, Log, TEXT("[TacticalCompanion] Suppressive burst fired! Ammo left: %d"), CompanionAmmoPool);
        }
    }
}

void UTacticalCompanionComponent::UpdateVehicleDriveBy(float DeltaTime)
{
    // Burst fire towards active ping or law enforcement
    BurstFireTimer -= DeltaTime;
    if (BurstFireTimer <= 0.0f)
    {
        BurstFireTimer = FMath::RandRange(0.4f, 0.8f);
        if (CompanionAmmoPool > 0 && OwningCharacter.IsValid())
        {
            OwningCharacter->FireWeapon();
            CompanionAmmoPool = FMath::Max(0, CompanionAmmoPool - 4);
        }
    }
}
