// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#include "Police/WantedHeatSubsystem.h"
#include "Containers/Ticker.h"
#include "Engine/World.h"

void UWantedHeatSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);

    TickerHandle = FTSTicker::GetCoreTicker().AddTicker(FTickerDelegate::CreateLambda([this](float DeltaTime)
    {
        TickSubsystem(DeltaTime);
        return true;
    }));

    UE_LOG(LogTemp, Log, TEXT("[VCPD Dispatch] WantedHeatSubsystem initialized."));
}

void UWantedHeatSubsystem::Deinitialize()
{
    if (TickerHandle.IsValid())
    {
        FTSTicker::GetCoreTicker().RemoveTicker(TickerHandle);
    }
    Super::Deinitialize();
}

void UWantedHeatSubsystem::ReportCrimeEvent(const FString& CrimeType, const FVector& CrimeLocation, int32 HeatDelta)
{
    LastKnownPosition = CrimeLocation;

    int32 CurrentVal = static_cast<int32>(CurrentWantedLevel);
    int32 TargetVal = FMath::Clamp(CurrentVal + HeatDelta, 1, 6);

    SetWantedLevel(static_cast<EWantedLevel>(TargetVal));

    FString RadioLine = FString::Printf(TEXT("All units, 10-99 report in vicinity of %s. Suspect armed and active."), *CrimeLocation.ToCompactString());
    OnPoliceRadioDispatch.Broadcast(RadioLine, CrimeLocation);

    UE_LOG(LogTemp, Log, TEXT("[VCPD Dispatch] Crime reported: %s | Wanted Level: %d Stars"), *CrimeType, TargetVal);
}

void UWantedHeatSubsystem::StartWitness911Call(const FVector& WitnessLocation, float CallDuration)
{
    WitnessStatus = EWitnessCallStatus::Dialing911;
    ActiveWitnessLoc = WitnessLocation;
    WitnessTimer = 0.0f;
    WitnessTotalTime = CallDuration;

    OnWitnessReportStatusChanged.Broadcast(WitnessStatus, ActiveWitnessLoc, WitnessTotalTime);
    UE_LOG(LogTemp, Log, TEXT("[VCPD Dispatch] Witness dialing 911 at %s. Player has %.1fs to intercept."), *WitnessLocation.ToString(), CallDuration);
}

bool UWantedHeatSubsystem::TryIntimidateOrInterceptWitness(const FVector& PlayerLocation, float IntimidationRadius)
{
    if (WitnessStatus != EWitnessCallStatus::Dialing911 && WitnessStatus != EWitnessCallStatus::ReportingCrime)
    {
        return false;
    }

    float Dist = FVector::Dist(PlayerLocation, ActiveWitnessLoc);
    if (Dist <= IntimidationRadius)
    {
        WitnessStatus = EWitnessCallStatus::CallInterceptedOrScaredOff;
        OnWitnessReportStatusChanged.Broadcast(WitnessStatus, ActiveWitnessLoc, 0.0f);
        UE_LOG(LogTemp, Log, TEXT("[VCPD Dispatch] Witness 911 call successfully intercepted/intimidated!"));
        return true;
    }
    return false;
}

void UWantedHeatSubsystem::SetWantedLevel(EWantedLevel NewLevel)
{
    if (CurrentWantedLevel != NewLevel)
    {
        EWantedLevel Old = CurrentWantedLevel;
        CurrentWantedLevel = NewLevel;
        HeatCooldownTimer = 0.0f;

        // Radius scale based on stars
        SearchRadiusMeters = static_cast<float>(CurrentWantedLevel) * 250.0f;

        OnWantedLevelChanged.Broadcast(Old, CurrentWantedLevel);
        UE_LOG(LogTemp, Warning, TEXT("[VCPD Dispatch] Wanted level changed to %d Stars!"), static_cast<int32>(CurrentWantedLevel));
    }
}

void UWantedHeatSubsystem::ClearWantedLevel()
{
    SetWantedLevel(EWantedLevel::Clean);
    SearchRadiusMeters = 0.0f;
    SuspectProfile.bVehiclePlateLogged = false;
    SuspectProfile.bFaceRecognized = false;
    UE_LOG(LogTemp, Log, TEXT("[VCPD Dispatch] Wanted level cleared. Suspect lost."));
}

void UWantedHeatSubsystem::ChangeVehicleDisguise(const FString& NewPlate)
{
    SuspectProfile.KnownVehiclePlate = NewPlate;
    SuspectProfile.bVehiclePlateLogged = false;
    UE_LOG(LogTemp, Log, TEXT("[VCPD Dispatch] Swapped vehicle plate to %s. Cops searching old plate."), *NewPlate);
}

void UWantedHeatSubsystem::ChangeClothingDisguise(const FString& NewOutfitID)
{
    SuspectProfile.DisguiseOutfitID = NewOutfitID;
    SuspectProfile.bFaceRecognized = false;
    UE_LOG(LogTemp, Log, TEXT("[VCPD Dispatch] Swapped outfit to %s. Face identification reset."), *NewOutfitID);
}

void UWantedHeatSubsystem::TickSubsystem(float DeltaTime)
{
    // 1. Witness 911 Call Progression
    if (WitnessStatus == EWitnessCallStatus::Dialing911 || WitnessStatus == EWitnessCallStatus::ReportingCrime)
    {
        WitnessTimer += DeltaTime;
        float Remaining = FMath::Max(0.0f, WitnessTotalTime - WitnessTimer);
        OnWitnessReportStatusChanged.Broadcast(WitnessStatus, ActiveWitnessLoc, Remaining);

        if (WitnessTimer >= WitnessTotalTime)
        {
            WitnessStatus = EWitnessCallStatus::DispatchDispatched;
            ReportCrimeEvent(TEXT("Civilian 911 Emergency Report"), ActiveWitnessLoc, 1);
            OnWitnessReportStatusChanged.Broadcast(WitnessStatus, ActiveWitnessLoc, 0.0f);
        }
    }

    // 2. Heat Cooldown when out of LOS
    if (CurrentWantedLevel != EWantedLevel::Clean && !bPlayerInLOS)
    {
        HeatCooldownTimer += DeltaTime;
        if (HeatCooldownTimer >= HeatCooldownRequired)
        {
            int32 Stars = static_cast<int32>(CurrentWantedLevel) - 1;
            SetWantedLevel(static_cast<EWantedLevel>(Stars));
            HeatCooldownTimer = 0.0f;
        }
    }
}
