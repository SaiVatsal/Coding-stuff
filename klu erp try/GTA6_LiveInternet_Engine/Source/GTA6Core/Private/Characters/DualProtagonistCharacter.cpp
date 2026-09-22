// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.

#include "Characters/DualProtagonistCharacter.h"
#include "AI/TacticalCompanionComponent.h"
#include "GameFramework/SpringArmComponent.h"
#include "Camera/CameraComponent.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "Components/CapsuleComponent.h"
#include "Vehicles/CrimeVehiclePawn.h"

ADualProtagonistCharacter::ADualProtagonistCharacter()
{
    PrimaryActorTick.bCanEverTick = true;

    // Capsule setup
    GetCapsuleComponent()->InitCapsuleSize(35.0f, 92.0f);
    GetCapsuleComponent()->SetCollisionResponseToChannel(ECC_Camera, ECR_Ignore);

    // Character movement configuration
    bUseControllerRotationPitch = false;
    bUseControllerRotationYaw = false;
    bUseControllerRotationRoll = false;

    GetCharacterMovement()->bOrientRotationToMovement = true;
    GetCharacterMovement()->RotationRate = FRotator(0.0f, 540.0f, 0.0f);
    GetCharacterMovement()->JumpZVelocity = 450.0f;
    GetCharacterMovement()->AirControl = 0.2f;
    GetCharacterMovement()->MaxWalkSpeed = JogSpeed;

    // Camera Boom & Follow Camera
    CameraBoom = CreateDefaultSubobject<USpringArmComponent>(TEXT("CameraBoom"));
    CameraBoom->SetupAttachment(RootComponent);
    CameraBoom->TargetArmLength = 280.0f;
    CameraBoom->SocketOffset = FVector(0.0f, 45.0f, 65.0f);
    CameraBoom->bUsePawnControlRotation = true;
    CameraBoom->bEnableCameraLag = true;
    CameraBoom->CameraLagSpeed = 12.0f;

    FollowCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("FollowCamera"));
    FollowCamera->SetupAttachment(CameraBoom, USpringArmComponent::SocketName);
    FollowCamera->bUsePawnControlRotation = false;

    // Tactical AI Companion Component
    CompanionComponent = CreateDefaultSubobject<UTacticalCompanionComponent>(TEXT("TacticalCompanionComponent"));
}

void ADualProtagonistCharacter::BeginPlay()
{
    Super::BeginPlay();
}

void ADualProtagonistCharacter::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    // Aiming FOV and arm adjustment interpolation
    if (CameraBoom && FollowCamera)
    {
        float TargetArmLength = bIsAiming ? 140.0f : (bIsSprinting ? 340.0f : 280.0f);
        float TargetFOV = bIsAiming ? 65.0f : 90.0f;

        CameraBoom->TargetArmLength = FMath::FInterpTo(CameraBoom->TargetArmLength, TargetArmLength, DeltaTime, 10.0f);
        FollowCamera->FieldOfView = FMath::FInterpTo(FollowCamera->FieldOfView, TargetFOV, DeltaTime, 8.0f);
    }
}

void ADualProtagonistCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);

    PlayerInputComponent->BindAxis(TEXT("MoveForward"), this, &ADualProtagonistCharacter::MoveForward);
    PlayerInputComponent->BindAxis(TEXT("MoveRight"), this, &ADualProtagonistCharacter::MoveRight);
    PlayerInputComponent->BindAxis(TEXT("Turn"), this, &ADualProtagonistCharacter::Turn);
    PlayerInputComponent->BindAxis(TEXT("LookUp"), this, &ADualProtagonistCharacter::LookUp);

    PlayerInputComponent->BindAction(TEXT("Sprint"), IE_Pressed, this, &ADualProtagonistCharacter::StartSprint);
    PlayerInputComponent->BindAction(TEXT("Sprint"), IE_Released, this, &ADualProtagonistCharacter::StopSprint);

    PlayerInputComponent->BindAction(TEXT("Aim"), IE_Pressed, this, &ADualProtagonistCharacter::StartAim);
    PlayerInputComponent->BindAction(TEXT("Aim"), IE_Released, this, &ADualProtagonistCharacter::StopAim);

    PlayerInputComponent->BindAction(TEXT("Fire"), IE_Pressed, this, &ADualProtagonistCharacter::FireWeapon);
}

void ADualProtagonistCharacter::MoveForward(float Value)
{
    if (Controller && Value != 0.0f && !bIsRagdoll)
    {
        const FRotator Rotation = Controller->GetControlRotation();
        const FRotator YawRotation(0, Rotation.Yaw, 0);
        const FVector Direction = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::X);
        AddMovementInput(Direction, Value);
    }
}

void ADualProtagonistCharacter::MoveRight(float Value)
{
    if (Controller && Value != 0.0f && !bIsRagdoll)
    {
        const FRotator Rotation = Controller->GetControlRotation();
        const FRotator YawRotation(0, Rotation.Yaw, 0);
        const FVector Direction = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::Y);
        AddMovementInput(Direction, Value);
    }
}

void ADualProtagonistCharacter::Turn(float Value)
{
    AddControllerYawInput(Value);
}

void ADualProtagonistCharacter::LookUp(float Value)
{
    AddControllerPitchInput(Value);
}

void ADualProtagonistCharacter::StartSprint()
{
    if (!bIsAiming && !bIsRagdoll)
    {
        bIsSprinting = true;
        GetCharacterMovement()->MaxWalkSpeed = SprintSpeed;
    }
}

void ADualProtagonistCharacter::StopSprint()
{
    bIsSprinting = false;
    GetCharacterMovement()->MaxWalkSpeed = JogSpeed;
}

void ADualProtagonistCharacter::StartAim()
{
    bIsAiming = true;
    bIsSprinting = false;
    GetCharacterMovement()->MaxWalkSpeed = WalkSpeed;
    GetCharacterMovement()->bOrientRotationToMovement = false;
    bUseControllerRotationYaw = true;
}

void ADualProtagonistCharacter::StopAim()
{
    bIsAiming = false;
    GetCharacterMovement()->MaxWalkSpeed = JogSpeed;
    GetCharacterMovement()->bOrientRotationToMovement = true;
    bUseControllerRotationYaw = false;
}

void ADualProtagonistCharacter::FireWeapon()
{
    if (bIsRagdoll) return;
    UE_LOG(LogTemp, Log, TEXT("[%s] Fired weapon. Recoil triggered."), *UEnum::GetValueAsString(Identity));
}

void ADualProtagonistCharacter::SetProtagonistState(EProtagonistState NewState)
{
    CurrentState = NewState;
    if (NewState == EProtagonistState::ActivePlayer)
    {
        SetActorHiddenInGame(false);
        SetActorEnableCollision(true);
        SetActorTickEnabled(true);
    }
    else if (NewState == EProtagonistState::CompanionAI)
    {
        SetActorHiddenInGame(false);
        SetActorEnableCollision(true);
        if (CompanionComponent)
        {
            CompanionComponent->SetComponentTickEnabled(true);
        }
    }
    else if (NewState == EProtagonistState::StandbyOffscreen)
    {
        SetActorHiddenInGame(true);
        SetActorEnableCollision(false);
        if (CompanionComponent)
        {
            CompanionComponent->SetComponentTickEnabled(false);
        }
    }

    if (NewState == EProtagonistState::ActivePlayer && CompanionComponent)
    {
        CompanionComponent->SetComponentTickEnabled(false);
    }

    OnStateChanged.Broadcast(Identity, NewState);
}

void ADualProtagonistCharacter::SaveStateData(FProtagonistPersistenceData& OutData) const
{
    OutData.Health = CurrentHealth;
    OutData.Armor = CurrentArmor;
    OutData.LastWorldLocation = GetActorLocation();
    OutData.LastWorldRotation = GetActorRotation();
}

void ADualProtagonistCharacter::RestoreStateData(const FProtagonistPersistenceData& InData)
{
    CurrentHealth = InData.Health;
    CurrentArmor = InData.Armor;
    SetActorLocationAndRotation(InData.LastWorldLocation, InData.LastWorldRotation);
}

void ADualProtagonistCharacter::TriggerRagdoll(const FVector& ImpulseOrigin, float ImpulseStrength)
{
    bIsRagdoll = true;
    GetCapsuleComponent()->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    GetMesh()->SetCollisionProfileName(TEXT("Ragdoll"));
    GetMesh()->SetSimulatePhysics(true);

    FVector Direction = (GetActorLocation() - ImpulseOrigin).GetSafeNormal();
    GetMesh()->AddImpulse(Direction * ImpulseStrength, NAME_None, true);
}

void ADualProtagonistCharacter::RecoverFromRagdoll()
{
    if (!bIsRagdoll) return;
    bIsRagdoll = false;
    GetMesh()->SetSimulatePhysics(false);
    GetMesh()->AttachToComponent(GetCapsuleComponent(), FAttachmentTransformRules::SnapToTargetNotIncludingScale);
    GetCapsuleComponent()->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
}

bool ADualProtagonistCharacter::TryEnterVehicle(ACrimeVehiclePawn* TargetVehicle, bool bDriverSeat)
{
    if (!TargetVehicle || CurrentOccupiedVehicle != nullptr) return false;
    CurrentOccupiedVehicle = TargetVehicle;
    SetActorHiddenInGame(true);
    SetActorEnableCollision(false);
    return true;
}

void ADualProtagonistCharacter::ExitVehicle()
{
    if (!CurrentOccupiedVehicle) return;
    SetActorLocation(CurrentOccupiedVehicle->GetActorLocation() + CurrentOccupiedVehicle->GetActorRightVector() * 180.0f);
    SetActorHiddenInGame(false);
    SetActorEnableCollision(true);
    CurrentOccupiedVehicle = nullptr;
}
