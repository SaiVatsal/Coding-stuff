// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#include "Vehicles/CrimeVehiclePawn.h"
#include "Engine/World.h"
#include "DrawDebugHelpers.h"

ACrimeVehiclePawn::ACrimeVehiclePawn()
{
    PrimaryActorTick.bCanEverTick = true;
}

void ACrimeVehiclePawn::BeginPlay()
{
    Super::BeginPlay();
}

void ACrimeVehiclePawn::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    DetectSurfaceTraction();
    UpdatePhysicsDynamics(DeltaTime);
    ProcessHijackTick(DeltaTime);
}

void ACrimeVehiclePawn::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);

    PlayerInputComponent->BindAxis(TEXT("VehicleThrottle"), this, &ACrimeVehiclePawn::ThrottleInput);
    PlayerInputComponent->BindAxis(TEXT("VehicleSteer"), this, &ACrimeVehiclePawn::SteerInput);
    PlayerInputComponent->BindAxis(TEXT("VehicleHandbrake"), this, &ACrimeVehiclePawn::HandbrakeInput);
}

void ACrimeVehiclePawn::ThrottleInput(float Value)
{
    ThrottleInputVal = Value;
}

void ACrimeVehiclePawn::SteerInput(float Value)
{
    SteeringInputVal = Value;
}

void ACrimeVehiclePawn::HandbrakeInput(float Value)
{
    HandbrakeVal = Value;
}

void ACrimeVehiclePawn::StartHijackProcess(bool bHasElectronicBypassTool)
{
    if (SecurityTier == EVehicleSecurityTier::Unlocked)
    {
        CurrentHijackState = EHijackState::UnlockedAndRunning;
        OnHijackProgressUpdated.Broadcast(CurrentHijackState, 1.0f, true);
        return;
    }

    HijackTimer = 0.0f;
    if (SecurityTier == EVehicleSecurityTier::MechanicalLock)
    {
        CurrentHijackState = EHijackState::LockpickingMechanical;
        TargetHijackDuration = 2.8f;
    }
    else if (SecurityTier == EVehicleSecurityTier::ElectronicImmobilizer)
    {
        if (bHasElectronicBypassTool)
        {
            CurrentHijackState = EHijackState::SniffingElectronicRollingCode;
            TargetHijackDuration = 4.2f;
        }
        else
        {
            // Trigger Alarm immediately if attempting brute force without cyber tools
            CurrentHijackState = EHijackState::AlarmTriggered;
            bAlarmActive = true;
            OnVehicleAlarmStateChanged.Broadcast(true, GetActorLocation());
            OnHijackProgressUpdated.Broadcast(CurrentHijackState, 0.0f, false);
            return;
        }
    }
    else if (SecurityTier == EVehicleSecurityTier::ArmoredHighSecurity)
    {
        CurrentHijackState = EHijackState::HotwiringIgnition;
        TargetHijackDuration = 8.0f;
    }

    OnHijackProgressUpdated.Broadcast(CurrentHijackState, 0.0f, false);
    UE_LOG(LogTemp, Log, TEXT("[VehicleTheft] Started hijack state %s on %s"), *UEnum::GetValueAsString(CurrentHijackState), *VehicleModelName);
}

void ACrimeVehiclePawn::CancelHijack()
{
    CurrentHijackState = EHijackState::Idle;
    HijackTimer = 0.0f;
    OnHijackProgressUpdated.Broadcast(CurrentHijackState, 0.0f, false);
}

void ACrimeVehiclePawn::ProcessHijackTick(float DeltaTime)
{
    if (CurrentHijackState == EHijackState::Idle || CurrentHijackState == EHijackState::UnlockedAndRunning)
    {
        return;
    }

    if (CurrentHijackState == EHijackState::LockpickingMechanical ||
        CurrentHijackState == EHijackState::SniffingElectronicRollingCode ||
        CurrentHijackState == EHijackState::HotwiringIgnition)
    {
        HijackTimer += DeltaTime;
        float Progress = FMath::Clamp(HijackTimer / TargetHijackDuration, 0.0f, 1.0f);
        OnHijackProgressUpdated.Broadcast(CurrentHijackState, Progress, false);

        if (HijackTimer >= TargetHijackDuration)
        {
            CurrentHijackState = EHijackState::UnlockedAndRunning;
            SecurityTier = EVehicleSecurityTier::Unlocked;
            OnHijackProgressUpdated.Broadcast(CurrentHijackState, 1.0f, true);
            UE_LOG(LogTemp, Log, TEXT("[VehicleTheft] Hijack successful! Vehicle started."));
        }
    }
}

void ACrimeVehiclePawn::DetectSurfaceTraction()
{
    FHitResult Hit;
    FVector Start = GetActorLocation();
    FVector End = Start - FVector(0, 0, 150.0f);

    FCollisionQueryParams Params;
    Params.AddIgnoredActor(this);

    if (GetWorld()->LineTraceSingleByChannel(Hit, Start, End, ECC_WorldStatic, Params))
    {
        if (Hit.PhysMaterial.IsValid())
        {
            FString MatName = Hit.PhysMaterial->GetName().ToLower();
            if (MatName.Contains(TEXT("mud")) || MatName.Contains(TEXT("swamp")))
            {
                CurrentSurface = EVehicleSurfaceTraction::SwampMud;
            }
            else if (MatName.Contains(TEXT("sand")) || MatName.Contains(TEXT("beach")))
            {
                CurrentSurface = EVehicleSurfaceTraction::BeachSand;
            }
            else if (MatName.Contains(TEXT("gravel")) || MatName.Contains(TEXT("dirt")))
            {
                CurrentSurface = EVehicleSurfaceTraction::GravelDirt;
            }
            else if (MatName.Contains(TEXT("wet")) || MatName.Contains(TEXT("rain")))
            {
                CurrentSurface = EVehicleSurfaceTraction::WetPavement;
            }
            else
            {
                CurrentSurface = EVehicleSurfaceTraction::DryAsphalt;
            }
        }
    }
}

void ACrimeVehiclePawn::UpdatePhysicsDynamics(float DeltaTime)
{
    float SurfaceGrip = 1.0f;
    switch (CurrentSurface)
    {
    case EVehicleSurfaceTraction::WetPavement: SurfaceGrip = 0.65f; break;
    case EVehicleSurfaceTraction::SwampMud: SurfaceGrip = 0.40f; break;
    case EVehicleSurfaceTraction::BeachSand: SurfaceGrip = 0.55f; break;
    case EVehicleSurfaceTraction::GravelDirt: SurfaceGrip = 0.75f; break;
    default: SurfaceGrip = 1.0f; break;
    }

    // Calculate grip penalty for blown tires
    int32 BlownTireCount = (bFrontLeftTireBlown ? 1 : 0) + (bFrontRightTireBlown ? 1 : 0) +
                           (bRearLeftTireBlown ? 1 : 0) + (bRearRightTireBlown ? 1 : 0);
    if (BlownTireCount > 0)
    {
        SurfaceGrip *= FMath::Max(0.15f, 1.0f - (BlownTireCount * 0.22f));
    }

    // Dynamic Speed Calculation (stall if engine is destroyed or out of fuel)
    bool bEngineOperational = (EngineHealth > 0.0f) && (FuelLevelPercent > 0.0f);
    float EffectiveThrottle = bEngineOperational ? ThrottleInputVal : 0.0f;
    float TargetSpeed = EffectiveThrottle * TopSpeedKmh * SurfaceGrip;

    CurrentSpeedKmh = FMath::FInterpTo(CurrentSpeedKmh, TargetSpeed, DeltaTime, (EffectiveThrottle != 0.0f) ? 2.5f : 1.2f);

    // RPM & Gear shifting simulation
    float SpeedRatio = FMath::Abs(CurrentSpeedKmh) / TopSpeedKmh;
    CurrentGear = FMath::Clamp(FMath::FloorToInt(SpeedRatio * 6.0f) + 1, 1, 6);
    EngineRPM = bEngineOperational ? (800.0f + (SpeedRatio * 6500.0f)) : 0.0f;
}

void ACrimeVehiclePawn::ApplyImpactDamage(float ImpulseMagnitude, const FVector& ImpactPoint)
{
    float Damage = ImpulseMagnitude * 0.05f;
    BodyHealth = FMath::Max(0.0f, BodyHealth - Damage);
    if (Damage > 40.0f)
    {
        EngineHealth = FMath::Max(0.0f, EngineHealth - (Damage * 0.5f));
    }

    UE_LOG(LogTemp, Log, TEXT("[VehicleDamage] Impact: %.1f | Body: %.1f | Engine: %.1f"), Damage, BodyHealth, EngineHealth);
}

void ACrimeVehiclePawn::BlowTire(int32 WheelIndex)
{
    switch (WheelIndex)
    {
    case 0: bFrontLeftTireBlown = true; break;
    case 1: bFrontRightTireBlown = true; break;
    case 2: bRearLeftTireBlown = true; break;
    case 3: bRearRightTireBlown = true; break;
    default: break;
    }
    UE_LOG(LogTemp, Warning, TEXT("[VehicleDamage] Tire %d blown!"), WheelIndex);
}

void ACrimeVehiclePawn::RepairTires()
{
    bFrontLeftTireBlown = false;
    bFrontRightTireBlown = false;
    bRearLeftTireBlown = false;
    bRearRightTireBlown = false;
    UE_LOG(LogTemp, Log, TEXT("[VehicleMaintenance] All 4 tires replaced / repaired on %s."), *VehicleModelName);
}

void ACrimeVehiclePawn::RepairVehicle()
{
    RepairTires();
    EngineHealth = 100.0f;
    BodyHealth = 100.0f;
    FuelLevelPercent = 100.0f;
    bAlarmActive = false;
    UE_LOG(LogTemp, Log, TEXT("[VehicleMaintenance] Vehicle %s fully serviced and restored to mint condition."), *VehicleModelName);
}
