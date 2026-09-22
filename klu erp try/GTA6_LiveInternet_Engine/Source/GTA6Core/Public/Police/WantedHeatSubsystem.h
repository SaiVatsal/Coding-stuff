// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Subsystems/WorldSubsystem.h"
#include "WantedHeatSubsystem.generated.h"

UENUM(BlueprintType)
enum class EWantedLevel : uint8
{
    Clean           = 0 UMETA(DisplayName = "0 Stars - Clean"),
    OneStar         = 1 UMETA(DisplayName = "1 Star - VCPD Patrol Search"),
    TwoStar         = 2 UMETA(DisplayName = "2 Stars - Active Arrest Pursuit"),
    ThreeStar       = 3 UMETA(DisplayName = "3 Stars - Tactical Interceptors & Maverick Heli"),
    FourStar        = 4 UMETA(DisplayName = "4 Stars - NOOSE Tactical Staging & Spike Strips"),
    FiveStar        = 5 UMETA(DisplayName = "5 Stars - State Highway Patrol & Armored Cordons"),
    SixStar         = 6 UMETA(DisplayName = "6 Stars - National Guard & Leonida Armed Blockades")
};

UENUM(BlueprintType)
enum class EWitnessCallStatus : uint8
{
    Inactive,
    Dialing911,
    ReportingCrime,
    CallInterceptedOrScaredOff,
    DispatchDispatched
};

USTRUCT(BlueprintType)
struct FSpyIdentityRecognition
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Surveillance")
    bool bFaceRecognized = false;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Surveillance")
    bool bVehiclePlateLogged = false;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Surveillance")
    FString KnownVehiclePlate = TEXT("NONE");

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Surveillance")
    FString DisguiseOutfitID = TEXT("DEFAULT_OUTFIT");
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnWantedLevelChanged, EWantedLevel, OldLevel, EWantedLevel, NewLevel);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FOnWitnessReportStatusChanged, EWitnessCallStatus, Status, const FVector&, Location, float, TimeRemaining);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnPoliceRadioDispatch, const FString&, DispatchAudioLine, const FVector&, LastKnownPos);

/**
 * AAA 6-Star Escalating Wanted System, Witness 911 Calls, CCTV Vision, and Dynamic Cordons.
 */
UCLASS()
class GTA6CORE_API UWantedHeatSubsystem : public UWorldSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

    // Crime Reporting API
    UFUNCTION(BlueprintCallable, Category = "Law Enforcement")
    void ReportCrimeEvent(const FString& CrimeType, const FVector& CrimeLocation, int32 HeatDelta = 1);

    UFUNCTION(BlueprintCallable, Category = "Law Enforcement")
    void StartWitness911Call(const FVector& WitnessLocation, float CallDuration = 6.0f);

    UFUNCTION(BlueprintCallable, Category = "Law Enforcement")
    bool TryIntimidateOrInterceptWitness(const FVector& PlayerLocation, float IntimidationRadius = 500.0f);

    // Heat & Wanted Mechanics
    UFUNCTION(BlueprintCallable, Category = "Law Enforcement")
    void SetWantedLevel(EWantedLevel NewLevel);

    UFUNCTION(BlueprintCallable, Category = "Law Enforcement")
    void ClearWantedLevel();

    UFUNCTION(BlueprintCallable, Category = "Law Enforcement")
    void ChangeVehicleDisguise(const FString& NewPlate);

    UFUNCTION(BlueprintCallable, Category = "Law Enforcement")
    void ChangeClothingDisguise(const FString& NewOutfitID);

    // Tick update
    void TickSubsystem(float DeltaTime);

    // Getters
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Law Enforcement")
    EWantedLevel CurrentWantedLevel = EWantedLevel::Clean;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Law Enforcement")
    FVector LastKnownPosition = FVector::ZeroVector;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Law Enforcement")
    float SearchRadiusMeters = 0.0f;

    UFUNCTION(BlueprintPure, Category = "Law Enforcement")
    float GetSearchRadiusUnrealUnits() const { return SearchRadiusMeters * 100.0f; }

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Law Enforcement")
    bool bPlayerInLOS = false;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Surveillance")
    FSpyIdentityRecognition SuspectProfile;

    // Events
    UPROPERTY(BlueprintAssignable, Category = "Law Enforcement|Events")
    FOnWantedLevelChanged OnWantedLevelChanged;

    UPROPERTY(BlueprintAssignable, Category = "Law Enforcement|Events")
    FOnWitnessReportStatusChanged OnWitnessReportStatusChanged;

    UPROPERTY(BlueprintAssignable, Category = "Law Enforcement|Events")
    FOnPoliceRadioDispatch OnPoliceRadioDispatch;

private:
    EWitnessCallStatus WitnessStatus = EWitnessCallStatus::Inactive;
    FVector ActiveWitnessLoc = FVector::ZeroVector;
    float WitnessTimer = 0.0f;
    float WitnessTotalTime = 6.0f;

    float HeatCooldownTimer = 0.0f;
    float HeatCooldownRequired = 45.0f;

    FTSTicker::FDelegateHandle TickerHandle;
};
