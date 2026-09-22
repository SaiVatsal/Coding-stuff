// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#include "Controllers/OpenWorldPlayerController.h"
#include "AI/TacticalAIController.h"
#include "AI/TacticalCompanionComponent.h"
#include "Kismet/GameplayStatics.h"
#include "Camera/PlayerCameraManager.h"
#include "Engine/World.h"
#include "DrawDebugHelpers.h"

AOpenWorldPlayerController::AOpenWorldPlayerController()
{
    PrimaryActorTick.bCanEverTick = true;
    bShowMouseCursor = false;
    bEnableClickEvents = false;
    bEnableMouseOverEvents = false;
}

void AOpenWorldPlayerController::BeginPlay()
{
    Super::BeginPlay();

    // Cache initial characters in world
    TArray<AActor*> FoundCharacters;
    UGameplayStatics::GetAllActorsOfClass(GetWorld(), ADualProtagonistCharacter::StaticClass(), FoundCharacters);

    for (AActor* Actor : FoundCharacters)
    {
        if (ADualProtagonistCharacter* Protagonist = Cast<ADualProtagonistCharacter>(Actor))
        {
            if (Protagonist->Identity == EProtagonistIdentity::Lucia)
            {
                LuciaPawn = Protagonist;
            }
            else if (Protagonist->Identity == EProtagonistIdentity::Jason)
            {
                JasonPawn = Protagonist;
            }
        }
    }

    // Initialize Companion AI Controller
    if (GetWorld() && !CompanionAIController)
    {
        CompanionAIController = GetWorld()->SpawnActor<ATacticalAIController>();
    }

    // Default possession
    if (LuciaPawn)
    {
        Possess(LuciaPawn);
        LuciaPawn->SetProtagonistState(EProtagonistState::ActivePlayer);
        ActiveProtagonist = EProtagonistIdentity::Lucia;
    }
    if (JasonPawn)
    {
        JasonPawn->SetProtagonistState(EProtagonistState::CompanionAI);
        if (CompanionAIController)
        {
            CompanionAIController->Possess(JasonPawn);
        }
    }
}

void AOpenWorldPlayerController::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    if (bIsTransitioningCamera)
    {
        TransitionTimer += DeltaTime;
        if (TransitionTimer >= TotalTransitionTime)
        {
            bIsTransitioningCamera = false;
            TransitionTimer = 0.0f;
        }
    }
}

void AOpenWorldPlayerController::SetupInputComponent()
{
    Super::SetupInputComponent();

    InputComponent->BindAction(TEXT("SwitchCharacter"), IE_Pressed, this, &AOpenWorldPlayerController::HandleSwitchCharacterInput);
    InputComponent->BindAction(TEXT("CompanionPing"), IE_Pressed, this, &AOpenWorldPlayerController::HandlePingInput);
    InputComponent->BindAction(TEXT("SensoryFocus"), IE_Pressed, this, &AOpenWorldPlayerController::HandleSensoryFocusInput);
}

void AOpenWorldPlayerController::HandleSwitchCharacterInput()
{
    EProtagonistIdentity NextIdentity = (ActiveProtagonist == EProtagonistIdentity::Lucia) ? EProtagonistIdentity::Jason : EProtagonistIdentity::Lucia;
    SwitchProtagonist(NextIdentity, 1.2f);
}

bool AOpenWorldPlayerController::SwitchProtagonist(EProtagonistIdentity TargetIdentity, float BlendDuration)
{
    if (TargetIdentity == ActiveProtagonist || bIsTransitioningCamera)
    {
        return false;
    }

    ADualProtagonistCharacter* CurrentPawn = (ActiveProtagonist == EProtagonistIdentity::Lucia) ? LuciaPawn.Get() : JasonPawn.Get();
    ADualProtagonistCharacter* TargetPawn = (TargetIdentity == EProtagonistIdentity::Lucia) ? LuciaPawn.Get() : JasonPawn.Get();

    if (!CurrentPawn || !TargetPawn)
    {
        UE_LOG(LogTemp, Warning, TEXT("[ProtagonistSwitch] Target or Current Pawn is null."));
        return false;
    }

    // 1. Save persistence of outgoing character
    if (ActiveProtagonist == EProtagonistIdentity::Lucia)
    {
        CurrentPawn->SaveStateData(LuciaPersistence);
    }
    else
    {
        CurrentPawn->SaveStateData(JasonPersistence);
    }

    // 2. Set Transition state
    bIsTransitioningCamera = true;
    TransitionTimer = 0.0f;
    TotalTransitionTime = BlendDuration;

    // 3. Smooth Camera ViewTarget blend
    SetViewTargetWithBlend(TargetPawn, BlendDuration, EViewTargetBlendFunction::VTBlend_Cubic, 2.0f, true);

    // 4. Update states & handover AI
    CurrentPawn->SetProtagonistState(EProtagonistState::CompanionAI);
    TargetPawn->SetProtagonistState(EProtagonistState::ActivePlayer);

    UnPossess();
    Possess(TargetPawn);

    // Hand over Companion AI possession to outgoing protagonist
    if (CompanionAIController)
    {
        CompanionAIController->UnPossess();
        CompanionAIController->Possess(CurrentPawn);
    }

    EProtagonistIdentity PreviousIdentity = ActiveProtagonist;
    ActiveProtagonist = TargetIdentity;

    OnProtagonistSwapped.Broadcast(PreviousIdentity, ActiveProtagonist);
    UE_LOG(LogTemp, Log, TEXT("[ProtagonistSwitch] Swapped from %s to %s with %.2fs blend."),
        *UEnum::GetValueAsString(PreviousIdentity), *UEnum::GetValueAsString(ActiveProtagonist), BlendDuration);

    return true;
}

void AOpenWorldPlayerController::HandlePingInput()
{
    PingWorldTarget();
}

void AOpenWorldPlayerController::PingWorldTarget()
{
    FHitResult Hit;
    PerformTraceForPing(Hit);

    FVector FallbackLoc = GetPawn() ? (GetPawn()->GetActorLocation() + GetPawn()->GetActorForwardVector() * 1500.0f) : FVector::ZeroVector;
    FVector TargetLocation = Hit.bBlockingHit ? Hit.ImpactPoint : (PlayerCameraManager ? (PlayerCameraManager->GetCameraLocation() + PlayerCameraManager->GetActorForwardVector() * 3000.0f) : FallbackLoc);

    ECompanionCommandType AutoCommand = ECompanionCommandType::MoveToPing;
    if (Hit.bBlockingHit && Hit.GetActor())
    {
        if (Hit.GetActor()->ActorHasTag(TEXT("Enemy")))
        {
            AutoCommand = ECompanionCommandType::SyncTakedown;
        }
        else if (Hit.GetActor()->ActorHasTag(TEXT("Door")))
        {
            AutoCommand = ECompanionCommandType::BreachAndClear;
        }
    }

    // Dispatch directly to inactive companion protagonist
    ADualProtagonistCharacter* CompanionPawn = (ActiveProtagonist == EProtagonistIdentity::Lucia) ? JasonPawn.Get() : LuciaPawn.Get();
    if (CompanionPawn && CompanionPawn->GetCompanionComponent())
    {
        CompanionPawn->GetCompanionComponent()->ExecuteTacticalCommand(AutoCommand, TargetLocation);
    }

    OnCompanionCommandIssued.Broadcast(AutoCommand, TargetLocation);
    UE_LOG(LogTemp, Log, TEXT("[CompanionPing] Command: %s at %s"), *UEnum::GetValueAsString(AutoCommand), *TargetLocation.ToString());
}

void AOpenWorldPlayerController::IssueCompanionCommand(ECompanionCommandType CommandType)
{
    FHitResult Hit;
    PerformTraceForPing(Hit);
    FVector Loc = Hit.bBlockingHit ? Hit.ImpactPoint : (GetPawn() ? GetPawn()->GetActorLocation() : FVector::ZeroVector);

    ADualProtagonistCharacter* CompanionPawn = (ActiveProtagonist == EProtagonistIdentity::Lucia) ? JasonPawn.Get() : LuciaPawn.Get();
    if (CompanionPawn && CompanionPawn->GetCompanionComponent())
    {
        CompanionPawn->GetCompanionComponent()->ExecuteTacticalCommand(CommandType, Loc);
    }

    OnCompanionCommandIssued.Broadcast(CommandType, Loc);
}

void AOpenWorldPlayerController::HandleSensoryFocusInput()
{
    ToggleSensoryFocusMode();
}

void AOpenWorldPlayerController::ToggleSensoryFocusMode()
{
    bSensoryFocusActive = !bSensoryFocusActive;

    // Slomo time dilation effect + custom post-process highlight
    UGameplayStatics::SetGlobalTimeDilation(GetWorld(), bSensoryFocusActive ? 0.35f : 1.0f);
    CustomTimeDilation = bSensoryFocusActive ? (1.0f / 0.35f) : 1.0f; // Player stays normal relative speed

    OnSensoryFocusToggled.Broadcast(bSensoryFocusActive);
    UE_LOG(LogTemp, Log, TEXT("[SensoryFocus] %s"), bSensoryFocusActive ? TEXT("Activated") : TEXT("Deactivated"));
}

void AOpenWorldPlayerController::PerformTraceForPing(FHitResult& OutHit)
{
    if (!PlayerCameraManager || !GetWorld()) return;

    FVector Start = PlayerCameraManager->GetCameraLocation();
    FVector End = Start + (PlayerCameraManager->GetActorForwardVector() * 50000.0f);

    FCollisionQueryParams Params;
    Params.AddIgnoredActor(GetPawn());
    if (LuciaPawn) Params.AddIgnoredActor(LuciaPawn.Get());
    if (JasonPawn) Params.AddIgnoredActor(JasonPawn.Get());

    GetWorld()->LineTraceSingleByChannel(OutHit, Start, End, ECC_Visibility, Params);
}
